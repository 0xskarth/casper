// ========================================
// MODAL HANDLER - Form Submissions
// ========================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { safeReply } = require('../utils/interactionUtils');
const { EMBED_COLOR, BRAND_ASSETS } = require('../config/constants');

async function handleModalSubmit(interaction, session, dependencies) {
    const { presetService, logService } = dependencies;

    if (interaction.customId === 'filter_config_modal') {
        await processFilterConfigModal(interaction, session);
    } else if (interaction.customId === 'save_preset_modal') {
        await processSavePresetModal(interaction, session, presetService, logService);
    }
}

async function processFilterConfigModal(interaction, session) {
    try {
        const deferStart = Date.now();
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }
        console.log(`[MODAL_DEFER] Deferred in ${Date.now() - deferStart}ms`);

        const metricsSystem = session.filterBuilder.getMetricsSystem();
        const category = metricsSystem[session.selectedCategory];
        const supportsPeriod = category && category.supportsPeriod;

        const fields = {};
        interaction.fields.fields.forEach((field, key) => {
            fields[key] = field.value;
        });

        let processedMetricId = null;
        let minValue = null;
        let maxValue = null;
        let periods = [];

        for (const [key, value] of Object.entries(fields)) {
            if (key.startsWith('filter_min_')) {
                processedMetricId = key.replace('filter_min_', '');
                minValue = value ? parseFloat(value) : null;
            } else if (key.startsWith('filter_max_')) {
                maxValue = value ? parseFloat(value) : null;
            } else if (key.startsWith('filter_period_') && value && supportsPeriod) {
                const periodValues = value.split(',').map(p => p.trim());
                for (const pv of periodValues) {
                    if (pv === '1' || pv === '1d') periods.push('1d');
                    else if (pv === '7' || pv === '7d') periods.push('7d');
                    else if (pv === '30' || pv === '30d') periods.push('30d');
                }
            }
        }

        if (periods.length === 0 && supportsPeriod) {
            periods = [null];
        } else if (periods.length === 0) {
            periods = [null];
        }

        const metric = category.metrics.find(m => m.id === processedMetricId);
        if (!metric) {
            throw new Error(`Metric ${processedMetricId} not found`);
        }

        for (const period of periods) {
            const filterKey = period ? `${period}_${processedMetricId}` : processedMetricId;

            const filter = {
                filterKey: filterKey,
                metricId: processedMetricId,
                groupId: session.selectedCategory,
                label: metric.label,
                unit: metric.unit,
                min: minValue !== null ? minValue : metric.defaultMin,
                max: maxValue !== null ? maxValue : metric.defaultMax,
                period: period,
                uniqueId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            session.filterBuilder.selectedFilters.push(filter);
        }

        console.log(`[MODAL_PROCESS] Filter configured: ${metric.label}`);

        if (session.configuringMultipleFilters) {
            const hasMore = session.filterBuilder.moveToNextFilter();
            const currentIndex = session.filterBuilder.currentFilterIndex;
            const totalFilters = session.filterBuilder.multipleFiltersQueue.length;

            if (hasMore) {
                const progressEmbed = new EmbedBuilder()
                    .setTitle('⚙️ Filter Configuration Progress')
                    .setDescription(`✅ Configured: **${metric.label}**\n\n` +
                        `📊 Progress: **${currentIndex}/${totalFilters}** filters configured\n\n` +
                        `Click **Configure Next** to continue, or **Finish** to complete.`)
                    .setColor(EMBED_COLOR)
                    .addFields({
                        name: '⏱️ Tip',
                        value: 'Take your time! Each filter is saved automatically.',
                        inline: false
                    })
                    .setFooter({ text: `Filter ${currentIndex} of ${totalFilters}` });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('continue_filter_config')
                            .setLabel(`⚙️ Configure Next (${totalFilters - currentIndex} remaining)`)
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('▶️'),
                        new ButtonBuilder()
                            .setCustomId('finish_filter_config')
                            .setLabel('✅ Finish & Review')
                            .setStyle(ButtonStyle.Success)
                    );

                await interaction.editReply({
                    embeds: [progressEmbed],
                    components: [row],
                    ephemeral: true
                });
            } else {
                session.configuringMultipleFilters = false;
                session.filterBuilder.clearFilterQueue();
                session.filterBuilder.clearTempSelectedMetrics();

                const completeEmbed = new EmbedBuilder()
                    .setTitle('✅ All Filters Configured!')
                    .setDescription(`Successfully configured **${totalFilters}** filters.\n\n` +
                        `Return to filter categories to review or add more.`)
                    .setColor('#00FF00')
                    .setFooter({ text: 'Configuration complete!' });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('back_to_categories')
                            .setLabel('◀ Back to Filters')
                            .setStyle(ButtonStyle.Primary)
                    );

                await interaction.editReply({
                    embeds: [completeEmbed],
                    components: [row],
                    ephemeral: true
                });
            }
        } else {
            session.filterBuilder.clearTempSelectedMetrics();

            const singleEmbed = new EmbedBuilder()
                .setTitle('✅ Filter Configured')
                .setDescription(`**${metric.label}** has been configured successfully.`)
                .setColor('#00FF00');

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back_to_categories')
                        .setLabel('◀ Back to Filters')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.editReply({
                embeds: [singleEmbed],
                components: [row],
                ephemeral: true
            });
        }

    } catch (error) {
        console.error('[MODAL_ERROR] Error processing filter config:', error);

        try {
            if (!interaction.replied && !interaction.deferred) {
                await safeReply(interaction, {
                    content: `❌ Error configuring filter: ${error.message}\n\nPlease try again.`,
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: `❌ Error configuring filter: ${error.message}\n\nPlease try again.`,
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error('[MODAL_ERROR] Failed to send error message:', replyError);
        }
    }
}

async function processSavePresetModal(interaction, session, presetService, logService) {
    const presetName = interaction.fields.getTextInputValue('preset_name');
    const description = interaction.fields.getTextInputValue('preset_description') || '';

    if (!presetName) {
        await safeReply(interaction, {
            content: '❌ Preset name is required',
            ephemeral: true
        });
        return;
    }

    const filters = session.filterBuilder.selectedFilters;
    if (filters.length === 0) {
        await safeReply(interaction, {
            content: '❌ No filters to save',
            ephemeral: true
        });
        return;
    }

    const saved = await presetService.saveUserPreset(interaction.user.id, presetName, filters, session.selectedChain);

    if (saved) {
        const embed = new EmbedBuilder()
            .setTitle(`✅ ${session.selectedChain} Preset Saved`)
            .setDescription(`Preset **${presetName}** has been saved with **${filters.length}** filters`)
            .setColor('#00FF00')
            .addFields(
                { name: '⛓️ Chain', value: session.selectedChain, inline: true },
                { name: '🎯 Filters', value: filters.length.toString(), inline: true },
                { name: '📝 Description', value: description || 'No description', inline: false }
            )
            .setFooter({ text: BRAND_ASSETS.footer })
            .setTimestamp();

        await safeReply(interaction, {
            embeds: [embed],
            ephemeral: true
        });

        if (logService) {
            await logService.logToChannel(null, {
                title: `💾 ${session.selectedChain} Preset Saved`,
                description: `User **${interaction.user.username}** saved preset: **${presetName}**`,
                fields: [
                    { name: '⛓️ Chain', value: session.selectedChain, inline: true },
                    { name: '🎯 Filters', value: filters.length.toString(), inline: true }
                ],
                color: '#00FF00'
            });
        }
    } else {
        await safeReply(interaction, {
            content: '❌ Failed to save preset',
            ephemeral: true
        });
    }
}

module.exports = handleModalSubmit;
