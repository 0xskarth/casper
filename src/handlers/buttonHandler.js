// ========================================
// BUTTON HANDLER - Complete Implementation
// ========================================

const InteractionValidator = require('../core/InteractionValidator');
const { safeReply, safeUpdate } = require('../utils/interactionUtils');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const fs = require('fs-extra');
const { BRAND_ASSETS, EMBED_COLOR } = require('../config/constants');

async function handleButtonInteraction(interaction, session, dependencies) {
    const { sessionManager, logService, presetService, queueManager } = dependencies;
    const customId = interaction.customId;

    // Activity check yes
    if (customId === 'activity_check_yes') {
        if (session.activityCheckTimer) {
            clearTimeout(session.activityCheckTimer);
            session.activityCheckTimer = null;
        }
        session.resetInactivity();
        sessionManager.resetActivityTimer(session.userId, session.channelId);
        const embed = new EmbedBuilder()
            .setTitle('✅ Session Continued')
            .setDescription('Great! Your session is still active.')
            .setColor('#00FF00');
        await safeReply(interaction, { embeds: [embed], ephemeral: true });
        try { await interaction.message.delete(); } catch (e) {}
        return;
    }
    
    // Activity check end
    if (customId === 'activity_check_end') {
        sessionManager.deleteSession(session.userId);
        const embed = new EmbedBuilder()
            .setTitle('👋 Session Ended')
            .setDescription('Run `/scan` to start new session!')
            .setColor('#FF0000');
        await safeReply(interaction, { embeds: [embed], ephemeral: true });
        try { await interaction.message.delete(); } catch (e) {}
        return;
    }

    // Timeout check
    const interactionAge = Date.now() - interaction.createdTimestamp;
    if (interactionAge > 2800) {
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '⏱️ Timeout - click again!', ephemeral: true });
            }
        } catch (e) {}
        return;
    }

    if (!await InteractionValidator.canRespond(interaction)) return;
    session.resetInactivity();
    sessionManager.resetActivityTimer(session.userId, session.channelId);

    // Main switch
    switch (customId) {
        case 'chain_sol': session.selectedChain = 'SOL'; await session.showChainSelection(interaction); break;
        case 'chain_bsc': session.selectedChain = 'BSC'; await session.showChainSelection(interaction); break;
        case 'start_filter_setup': await session.startFilterSetup(interaction); break;
        case 'back_to_intro': await session.sendIntro(interaction); break;
        case 'back_to_categories': await session.showCategories(interaction); break;
        case 'back_to_filters': await session.showCategories(interaction); break;
        case 'view_filters': await showFilterSummary(interaction, session); break;
        case 'remove_filters': await session.showRemoveFilters(interaction); break;
        case 'clear_all_filters': session.filterBuilder.clear(); await session.showCategories(interaction); break;
        case 'configure_selected': await configureSelectedFilters(interaction, session); break;
        case 'proceed_to_sources': await session.showDataSourceSelection(interaction); break;
        case 'select_export_format': await session.showExportFormatSelection(interaction); break;
        case 'export_csv': session.exportFormat = 'csv'; await session.showResults(interaction); break;
        case 'export_excel': session.exportFormat = 'excel'; await session.showResults(interaction); break;
        case 'export_both': session.exportFormat = 'both'; await session.showResults(interaction); break;
        case 'export_results': await session.exportResults(interaction); break;
        case 'save_preset': await interaction.showModal(session.createSavePresetModal()); break;
        case 'load_preset': await session.showMyPresets(interaction); break;
        case 'new_analysis': sessionManager.deleteSession(session.userId); const ns = await sessionManager.getSession(interaction.user.id, interaction.channelId); await ns.sendIntro(interaction); break;
        case 'change_format': await session.showExportFormatSelection(interaction); break;
        case 'edit_filters_from_results': session.editingFromResults = true; await session.showCategories(interaction); break;
        case 'edit_sources_from_results': session.editingFromResults = true; await session.showDataSourceSelection(interaction); break;
        case 'update_results_from_edit': await session.showResults(interaction); break;
        case 'continue_filter_config': await handleContinueFilterConfig(interaction, session); break;
        case 'finish_filter_config': session.configuringMultipleFilters = false; session.filterBuilder.clearFilterQueue(); await session.showCategories(interaction); break;
        case 'new_session_after_export': await handleNewSessionAfterExport(interaction, session, sessionManager); break;
        default: await handlePresetActions(interaction, session, customId, presetService, logService); break;
    }
}

async function handleContinueFilterConfig(interaction, session) {
    if (!InteractionValidator.canShowModal(interaction)) {
        await safeReply(interaction, { content: '⏱️ Click again', ephemeral: true });
        return;
    }
    const nextFilter = session.filterBuilder.getNextFilterToConfig();
    if (nextFilter) {
        const modal = session.createSingleFilterModal(nextFilter, session.filterBuilder.currentFilterIndex, session.filterBuilder.multipleFiltersQueue.length);
        await interaction.showModal(modal);
    }
}

async function handleNewSessionAfterExport(interaction, session, sessionManager) {
    if (session.exportSessionTimer) clearTimeout(session.exportSessionTimer);
    sessionManager.deleteSession(session.userId);
    const newSession = await sessionManager.getSession(interaction.user.id, interaction.channelId);
    await safeReply(interaction, { content: '✨ Starting new session...', ephemeral: true });
    setTimeout(() => newSession.sendIntro(interaction), 1000);
}

async function handlePresetActions(interaction, session, customId, presetService, logService) {
    if (customId.startsWith('load_preset_')) {
        await loadPreset(interaction, session, customId.replace('load_preset_', ''), presetService, logService);
    } else if (customId.startsWith('delete_preset_')) {
        await deletePreset(interaction, session, customId.replace('delete_preset_', ''), presetService);
    }
}

async function showFilterSummary(interaction, session) {
    const filters = session.filterBuilder.selectedFilters;
    if (filters.length === 0) return await safeReply(interaction, { content: '❌ No filters', ephemeral: true });
    const embed = new EmbedBuilder().setTitle('🎯 Active Filters').setDescription(`Total: **${filters.length}**`).setColor(EMBED_COLOR);
    const grouped = session.filterBuilder.getGroupedFilterSummary();
    for (const [name, instances] of Object.entries(grouped).slice(0, 25)) {
        embed.addFields({ name: name, value: instances.map(i => i.display).join('\n').substring(0, 1024), inline: true });
    }
    await safeReply(interaction, { embeds: [embed], ephemeral: true });
}

async function configureSelectedFilters(interaction, session) {
    if (!InteractionValidator.canShowModal(interaction)) return await safeReply(interaction, { content: '⏱️ Click again', ephemeral: true });
    const metricsSystem = session.filterBuilder.getMetricsSystem();
    const category = metricsSystem[session.selectedCategory];
    const metrics = category.metrics.filter(m => session.filterBuilder.tempSelectedMetrics.includes(m.id));
    session.filterBuilder.setupMultipleFiltersConfiguration(session.selectedCategory, metrics);
    session.configuringMultipleFilters = true;
    const modal = session.createSingleFilterModal(session.filterBuilder.getNextFilterToConfig(), 0, metrics.length);
    await interaction.showModal(modal);
}

async function loadPreset(interaction, session, presetName, presetService, logService) {
    const presets = await presetService.loadUserPresets(interaction.user.id, session.selectedChain);
    const preset = presets[presetName];
    if (!preset) return await safeReply(interaction, { content: '❌ Not found', ephemeral: true });
    session.filterBuilder.loadFromPreset(preset);
    session.currentPresetName = presetName;
    await logService.logPresetUsage(interaction.user.id, interaction.user.username, presetName, preset.filters, session.selectedChain);
    const embed = new EmbedBuilder().setTitle('✅ Loaded').setDescription(`**${presetName}** loaded`).setColor('#00FF00');
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('proceed_to_sources').setLabel('Next').setStyle(ButtonStyle.Primary)
    );
    await safeReply(interaction, { embeds: [embed], components: [row], ephemeral: true });
}

async function deletePreset(interaction, session, presetName, presetService) {
    const deleted = await presetService.deleteUserPreset(interaction.user.id, presetName, session.selectedChain);
    if (deleted) {
        await safeReply(interaction, { content: `✅ Deleted **${presetName}**`, ephemeral: true });
        setTimeout(() => session.showMyPresets(interaction), 1500);
    } else {
        await safeReply(interaction, { content: '❌ Failed', ephemeral: true });
    }
}

module.exports = handleButtonInteraction;
