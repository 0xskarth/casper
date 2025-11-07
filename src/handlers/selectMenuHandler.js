// ========================================
// SELECT MENU HANDLER - Dropdown Interactions
// ========================================

async function handleSelectMenuInteraction(interaction, session, dependencies) {
    const { presetService } = dependencies;
    const customId = interaction.customId;
    const values = interaction.values;

    switch (customId) {
        case 'select_category':
            session.selectedCategory = values[0];
            await session.showCategoryFilters(interaction, values[0]);
            break;

        case 'toggle_filters':
            session.filterBuilder.setTempSelectedMetrics(session.selectedCategory, values);
            await session.showCategoryFilters(interaction, session.selectedCategory);
            break;

        case 'select_filters_to_remove':
            const indices = values.map(v => parseInt(v));
            session.filterBuilder.removeMultipleFilters(indices);
            await session.showCategories(interaction);
            break;

        case 'select_data_sources':
            session.selectedDataSources = values;
            await session.showDataSourceSelection(interaction);
            break;

        case 'select_preset_for_options':
            const presetName = values[0];
            await showPresetOptions(interaction, session, presetName, presetService);
            break;

        default:
            break;
    }
}

async function showPresetOptions(interaction, session, presetName, presetService) {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
    const fs = require('fs-extra');
    const { BRAND_ASSETS, EMBED_COLOR } = require('../config/constants');
    const { safeReply } = require('../utils/interactionUtils');

    const userPresets = await presetService.loadUserPresets(interaction.user.id, session.selectedChain);
    const preset = userPresets[presetName];

    if (!preset) {
        await safeReply(interaction, {
            content: '❌ Preset not found',
            ephemeral: true
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`📦 ${session.selectedChain} Preset: ${presetName}`)
        .setDescription(`Manage your ${session.selectedChain} preset`)
        .setColor(EMBED_COLOR)
        .addFields(
            { name: '⛓️ Chain', value: session.selectedChain, inline: true },
            { name: '🎯 Filters', value: preset.filters.length.toString(), inline: true },
            { name: '📅 Created', value: new Date(preset.createdAt).toLocaleDateString(), inline: true },
            { name: '🔄 Modified', value: new Date(preset.lastModified).toLocaleDateString(), inline: true }
        )
        .setFooter({ text: BRAND_ASSETS.footer })
        .setTimestamp();

    const filterPreview = preset.filters.slice(0, 5).map(f =>
        `• ${f.label}${f.period ? ` [${f.period}]` : ''}: ${f.min}-${f.max} ${f.unit}`
    ).join('\n');

    if (filterPreview) {
        embed.addFields({
            name: '📋 Filter Preview',
            value: filterPreview + (preset.filters.length > 5 ? `\n... and ${preset.filters.length - 5} more` : ''),
            inline: false
        });
    }

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`load_preset_${presetName}`)
                .setLabel('✅ Load Preset')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`delete_preset_${presetName}`)
                .setLabel('🗑️ Delete')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('load_preset')
                .setLabel('◀ Back')
                .setStyle(ButtonStyle.Secondary)
        );

    await safeReply(interaction, {
        embeds: [embed],
        components: [row],
        ephemeral: true
    });
}

module.exports = handleSelectMenuInteraction;
