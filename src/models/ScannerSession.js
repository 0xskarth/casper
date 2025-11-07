// ========================================
// SCANNER SESSION - Main Session Logic
// ========================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
    ModalBuilder, TextInputBuilder, AttachmentBuilder, ButtonStyle, TextInputStyle } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const Papa = require('papaparse');
const FilterBuilder = require('./FilterBuilder');
const { DATA_SOURCES } = require('../config/dataSources');
const { BRAND_ASSETS, EMBED_COLOR } = require('../config/constants');
const { safeReply, safeUpdate } = require('../utils/interactionUtils');
const { parseValue, formatBundlerValue, generateFileName } = require('../utils/formatters');
const { normalizeBSCFileName, findBSCFile, getParameterInfo } = require('../utils/helpers');
const { createDarkThemedExcel } = require('../utils/excelExport');

class ScannerSession {
    constructor(userId, channelId) {
        this.userId = userId;
        this.channelId = channelId;
        this.step = 'intro';
        this.selectedChain = null;
        this.selectedDataSources = [];
        this.csvData = {};
        this.dataInfo = {};
        this.filterBuilder = new FilterBuilder();
        this.selectedCategory = null;
        this.results = [];
        this.page = 0;
        this.exportFormat = null;
        this.currentPresetName = null;
        this.lastInteraction = Date.now();
        this.isProcessing = false;
        this.editingPreset = null;
        this.selectedPreset = null;
        this.editingFromResults = false;
        this.debugInfo = {};
        this.configuringMultipleFilters = false;
        this.activityCheckTimer = null;
        this.slowUserMode = false;
        this.exportSessionTimer = null;
    }

    resetInactivity() {
        this.lastInteraction = Date.now();

        if (this.exportSessionTimer) {
            clearTimeout(this.exportSessionTimer);
            this.exportSessionTimer = null;
            console.log(`[SESSION] Export timer cleared - user ${this.userId} is active again`);
        }

        console.log(`[SESSION] Reset inactivity for user ${this.userId}`);
    }

    async sendIntro(interaction) {
        const userAgent = interaction.member?.presence?.clientStatus?.mobile ? 'mobile' :
            interaction.member?.presence?.clientStatus?.desktop ? 'desktop' :
            interaction.member?.presence?.clientStatus?.web ? 'web' : null;

        if (userAgent === 'mobile') {
            await safeReply(interaction, {
                content: '📱 **Mobile Device Detected**\n\n' +
                    '⚠️ This application is currently optimized for **Mac/Windows desktop devices only**.\n' +
                    'We are actively working on mobile support. Please use a desktop computer for the best experience.\n\n' +
                    'Thank you for your understanding! 🙏',
                ephemeral: true
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('🔮 Casper | Scanner')
            .setDescription(`Welcome to **Casper Scanner** - Multi-Chain Trading Analysis\n\n` +
                `**Chains Supported:**\n` +
                `• 🟣 **Solana** - 11 data sources\n` +
                `• 🟡 **BSC** - 4 data sources\n\n` +
                `**Features:**\n` +
                `• 📊 Chain-specific filters (SOL/BSC)\n` +
                `• 📅 3 separate fields (Min/Max/Period)\n` +
                `• ✏️ Edit filters/sources from results\n` +
                `• 💾 Separate SOL & BSC presets\n` +
                `• 📑 Export results with chain indicator\n` +
                `• 💎 Universal wallet balance tracking\n` +
                `• 🔍 Advanced debug & validation\n\n` +
                `**Getting Started:**\n` +
                `1️⃣ Choose chain (SOL/BSC)\n` +
                `2️⃣ Setup chain-specific filters\n` +
                `3️⃣ Select data sources\n` +
                `4️⃣ Export results\n` +
                `5️⃣ Edit & refine without restart!`)
            .setColor(EMBED_COLOR)
            .setImage('attachment://banner.png')
            .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('chain_sol').setLabel('🟣 Solana').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('chain_bsc').setLabel('🟡 BSC').setStyle(ButtonStyle.Secondary)
            );

        const files = [];
        if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
            files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
        }
        if (await fs.pathExists(BRAND_ASSETS.banner)) {
            files.push(new AttachmentBuilder(BRAND_ASSETS.banner, { name: 'banner.png' }));
        }

        await safeReply(interaction, {
            embeds: [embed],
            components: [row],
            files: files,
            ephemeral: true
        });

        this.step = 'intro';
    }

    async showChainSelection(interaction) {
        const embed = new EmbedBuilder()
            .setTitle(`⛓️ ${this.selectedChain} Selected`)
            .setDescription(`Chain: **${this.selectedChain}**\n\n` +
                `🟣 **Solana** - ${Object.keys(DATA_SOURCES.SOL).length} sources available\n` +
                `🟡 **BSC** - ${Object.keys(DATA_SOURCES.BSC).length} sources available`)
            .setColor(EMBED_COLOR)
            .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('start_filter_setup').setLabel('🚀 Setup Filters').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('load_preset').setLabel(`📦 Load ${this.selectedChain} Preset`).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('back_to_intro').setLabel('◀ Back').setStyle(ButtonStyle.Secondary)
            );

        const files = [];
        if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
            files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
        }

        await safeUpdate(interaction, { embeds: [embed], components: [row], files: files, ephemeral: true });
        this.step = 'chain_selected';
    }

    async startFilterSetup(interaction) {
        this.filterBuilder.setChain(this.selectedChain);
        await this.showCategories(interaction);
    }

    async showCategories(interaction, forceEphemeral = false) {
        const metricsSystem = this.filterBuilder.getMetricsSystem();

        const embed = new EmbedBuilder()
            .setTitle(`🎯 ${this.selectedChain} Filter Categories`)
            .setDescription(`Choose a category for **${this.selectedChain}** filters:\n\n` +
                `⛓️ **Chain:** ${this.selectedChain}\n` +
                `📌 **Active Filters:** ${this.filterBuilder.selectedFilters.length > 0 ?
                    `${this.filterBuilder.selectedFilters.length} selected` : 'None'}\n` +
                `💡 **Tip:** Each chain has specific filter sets!\n` +
                (this.editingFromResults ? '\n✏️ **Editing Mode** - Changes will update your results' : ''))
            .setColor(EMBED_COLOR)
            .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
            .setTimestamp();

        if (this.filterBuilder.selectedFilters.length > 0) {
            const grouped = this.filterBuilder.getGroupedFilterSummary();
            const filterLines = [];
            let count = 0;

            for (const [metricName, instances] of Object.entries(grouped)) {
                if (count >= 5) break;
                if (instances.length === 1) {
                    filterLines.push(`• ${metricName}: ${instances[0].display}`);
                } else {
                    filterLines.push(`• ${metricName}:`);
                    for (const inst of instances.slice(0, 3)) {
                        filterLines.push(`  ${inst.display}`);
                    }
                    if (instances.length > 3) {
                        filterLines.push(`  ... and ${instances.length - 3} more`);
                    }
                }
                count++;
            }

            const totalGroups = Object.keys(grouped).length;
            if (totalGroups > 5) {
                filterLines.push(`... and ${totalGroups - 5} more filter types`);
            }

            embed.addFields({
                name: '✅ Current Filters',
                value: filterLines.join('\n'),
                inline: false
            });
        }

        const options = [];
        for (const [category, data] of Object.entries(metricsSystem)) {
            options.push({
                label: data.label.replace(data.emoji, '').trim(),
                description: `${data.metrics.length} filters available`,
                value: category,
                emoji: data.emoji
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_category')
            .setPlaceholder(`Choose a ${this.selectedChain} filter category...`)
            .addOptions(options);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('view_filters').setLabel('👁️ View Filters').setStyle(ButtonStyle.Primary)
                    .setDisabled(this.filterBuilder.selectedFilters.length === 0),
                new ButtonBuilder().setCustomId('remove_filters').setLabel('🗑️ Remove Filter').setStyle(ButtonStyle.Secondary)
                    .setDisabled(this.filterBuilder.selectedFilters.length === 0),
                new ButtonBuilder().setCustomId('clear_all_filters').setLabel('🗑️ Clear All').setStyle(ButtonStyle.Danger)
                    .setDisabled(this.filterBuilder.selectedFilters.length === 0)
            );

        const nextButtonLabel = this.editingFromResults ?
            `🔄 Update Results (${this.filterBuilder.selectedFilters.length} filters)` :
            `📁 Next: Data (${this.filterBuilder.selectedFilters.length} filters)`;

        const nextButtonId = this.editingFromResults ?
            'update_results_from_edit' :
            'proceed_to_sources';

        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('save_preset').setLabel(`💾 Save ${this.selectedChain} Preset`).setStyle(ButtonStyle.Primary)
                    .setDisabled(this.filterBuilder.selectedFilters.length === 0),
                new ButtonBuilder().setCustomId(nextButtonId)
                    .setLabel(nextButtonLabel)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(this.filterBuilder.selectedFilters.length === 0)
            );

        const files = [];
        if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
            files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
        }

        await safeUpdate(interaction, {
            embeds: [embed],
            components: [row1, row2, row3],
            files: files,
            ephemeral: true
        });
        this.step = 'selecting_filters';
    }

    async showCategoryFilters(interaction, category) {
        const metricsSystem = this.filterBuilder.getMetricsSystem();
        const categoryData = metricsSystem[category];

        const embed = new EmbedBuilder()
            .setTitle(`${categoryData.emoji} ${categoryData.label} (${this.selectedChain})`)
            .setDescription(`Select ${this.selectedChain} filters to apply:\n\n` +
                `${categoryData.supportsPeriod ?
                    '📅 **Note:** You can set different periods (1d/7d/30d) for each filter' :
                    '⚠️ **Note:** This category does not support time periods'}`)
            .setColor(EMBED_COLOR)
            .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
            .setTimestamp();

        const options = [];
        for (const metric of categoryData.metrics) {
            const existingFilters = this.filterBuilder.selectedFilters.filter(f => {
                return f.metricId === metric.id ||
                    f.filterKey === metric.id ||
                    f.filterKey === `1d_${metric.id}` ||
                    f.filterKey === `7d_${metric.id}` ||
                    f.filterKey === `30d_${metric.id}`;
            });

            const isSelected = existingFilters.length > 0;
            const isTempSelected = this.filterBuilder.tempSelectedMetrics.includes(metric.id) &&
                this.filterBuilder.tempCategory === category;

            let statusText = '';
            if (isSelected) {
                const periodCounts = {};
                for (const f of existingFilters) {
                    const p = f.period || 'all';
                    periodCounts[p] = (periodCounts[p] || 0) + 1;
                }
                const periodTexts = Object.entries(periodCounts).map(([period, count]) => {
                    return count > 1 ? `${period}(${count}x)` : period;
                });
                statusText = `✅ Active (${periodTexts.join(', ')})`;
            } else if (isTempSelected) {
                statusText = '🔵 Selected';
            } else {
                statusText = '⬜ Available';
            }

            embed.addFields({
                name: `${statusText} ${metric.label}`,
                value: `📊 Unit: **${metric.unit}** | Default: **${metric.defaultMin}-${metric.defaultMax}**`,
                inline: true
            });

            options.push({
                label: metric.label,
                description: `${metric.unit} | ${metric.defaultMin}-${metric.defaultMax}`.substring(0, 100),
                value: metric.id,
                default: isTempSelected
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('toggle_filters')
            .setPlaceholder('Select filters to configure...')
            .setMinValues(0).setMaxValues(options.length)
            .addOptions(options);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);

        const hasTempSelected = this.filterBuilder.tempSelectedMetrics.length > 0 &&
            this.filterBuilder.tempCategory === category;

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('back_to_categories').setLabel('◀ Back').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('configure_selected').setLabel('⚙️ Configure Values')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!hasTempSelected)
            );

        const files = [];
        if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
            files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
        }

        await safeUpdate(interaction, { embeds: [embed], components: [row1, row2], files: files, ephemeral: true });
    }

    createSingleFilterModal(filter, currentIndex, totalFilters) {
        const modal = new ModalBuilder()
            .setCustomId('filter_config_modal')
            .setTitle(`⚙️ Filter ${currentIndex + 1} of ${totalFilters}`);

        const metricsSystem = this.filterBuilder.getMetricsSystem();
        const category = metricsSystem[this.selectedCategory];
        const supportsPeriod = category && category.supportsPeriod;

        const minField = new TextInputBuilder()
            .setCustomId(`filter_min_${filter.metricId}`)
            .setLabel(`${filter.label} - MIN Value`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`Enter minimum value (e.g. ${filter.defaultMin})`)
            .setRequired(false)
            .setValue(filter.defaultMin.toString());

        modal.addComponents(new ActionRowBuilder().addComponents(minField));

        const maxField = new TextInputBuilder()
            .setCustomId(`filter_max_${filter.metricId}`)
            .setLabel(`${filter.label} - MAX Value`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`Enter maximum value (e.g. ${filter.defaultMax})`)
            .setRequired(false)
            .setValue(filter.defaultMax.toString());

        modal.addComponents(new ActionRowBuilder().addComponents(maxField));

        if (supportsPeriod) {
            const periodField = new TextInputBuilder()
                .setCustomId(`filter_period_${filter.metricId}`)
                .setLabel(`${filter.label} - Period (days)`)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter: 1 for 1d, 7 for 7d, 30 for 30d, or multiple: 1,7,30')
                .setRequired(false)
                .setValue('7');

            modal.addComponents(new ActionRowBuilder().addComponents(periodField));
        }

        return modal;
    }

    createFilterConfigModal(filters) {
        const modal = new ModalBuilder()
            .setCustomId('filter_config_modal')
            .setTitle(`⚙️ ${this.selectedChain} Filter Configuration`);

        const metricsSystem = this.filterBuilder.getMetricsSystem();
        const category = metricsSystem[this.selectedCategory];
        const supportsPeriod = category && category.supportsPeriod;

        const filterToShow = filters[0];
        if (!filterToShow) return modal;

        const minField = new TextInputBuilder()
            .setCustomId(`filter_min_${filterToShow.metricId}`)
            .setLabel(`${filterToShow.label} - MIN Value`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`Enter minimum value (e.g. ${filterToShow.defaultMin})`)
            .setRequired(false)
            .setValue(filterToShow.defaultMin.toString());

        modal.addComponents(new ActionRowBuilder().addComponents(minField));

        const maxField = new TextInputBuilder()
            .setCustomId(`filter_max_${filterToShow.metricId}`)
            .setLabel(`${filterToShow.label} - MAX Value`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`Enter maximum value (e.g. ${filterToShow.defaultMax})`)
            .setRequired(false)
            .setValue(filterToShow.defaultMax.toString());

        modal.addComponents(new ActionRowBuilder().addComponents(maxField));

        if (supportsPeriod) {
            const periodField = new TextInputBuilder()
                .setCustomId(`filter_period_${filterToShow.metricId}`)
                .setLabel(`${filterToShow.label} - Period (days)`)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter: 1 for 1d, 7 for 7d, 30 for 30d, or multiple: 1,7,30')
                .setRequired(false)
                .setValue('7');

            modal.addComponents(new ActionRowBuilder().addComponents(periodField));
        }

        return modal;
    }

    async showRemoveFilters(interaction) {
        const filters = this.filterBuilder.getFiltersForRemoval();

        if (filters.length === 0) {
            await safeReply(interaction, {
                content: '❌ No filters to remove',
                ephemeral: true
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`🗑️ Remove ${this.selectedChain} Filters`)
            .setDescription(`Select ${this.selectedChain} filters to remove:\n\n` +
                '📅 **Note:** Filters show their period [1D/7D/30D] if applicable')
            .setColor('#FF0000')
            .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
            .setTimestamp();

        const options = filters.map(filter => ({
            label: filter.label + (filter.period ? ` [${filter.period.toUpperCase()}]` : ''),
            description: filter.description.substring(0, 100),
            value: filter.id.toString()
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_filters_to_remove')
            .setPlaceholder('Select filters to remove...')
            .setMinValues(1)
            .setMaxValues(Math.min(options.length, 25))
            .addOptions(options.slice(0, 25));

        const row1 = new ActionRowBuilder().addComponents(selectMenu);

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('back_to_categories').setLabel('◀ Cancel').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('clear_all_filters').setLabel('🗑️ Remove All').setStyle(ButtonStyle.Danger)
            );

        const files = [];
        if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
            files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
        }

        await safeUpdate(interaction, { embeds: [embed], components: [row1, row2], files: files, ephemeral: true });
    }

    async showDataSourceSelection(interaction) {
        if (!this.selectedChain) {
            await safeReply(interaction, {
                content: '⚠️ Please select a chain first!',
                ephemeral: true
            });
            return;
        }

        await this.loadDataInfo();

        const chainSources = DATA_SOURCES[this.selectedChain];
        const chainEmoji = this.selectedChain === 'SOL' ? '🟣' : '🟡';
        const validDataSources = this.selectedDataSources.filter(key => key in chainSources);
        this.selectedDataSources = validDataSources;

        const embed = new EmbedBuilder()
            .setTitle(`📁 Data Sources - ${chainEmoji} ${this.selectedChain}`)
            .setDescription(`Choose ${this.selectedChain} data sources to analyze with your **${this.filterBuilder.selectedFilters.length}** active filters:\n\n` +
                `✅ **Selected:** ${validDataSources.length > 0 ?
                    validDataSources.map(key => chainSources[key].name).join(', ') :
                    'None selected yet'}` +
                (this.editingFromResults ? '\n\n✏️ **Editing Mode** - Changes will update your results' : ''))
            .setColor(EMBED_COLOR)
            .setImage('attachment://banner.png')
            .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
            .setTimestamp();

        const options = [];
        for (const [key, source] of Object.entries(chainSources)) {
            const walletCount = this.dataInfo[key]?.count || 0;
            const isSelected = validDataSources.includes(key);

            embed.addFields({
                name: `${isSelected ? '✅' : ''} ${source.icon} ${source.name}`,
                value: `📊 **${walletCount.toLocaleString()}** wallets\n${source.description}`,
                inline: true
            });

            options.push({
                label: source.name,
                description: `${walletCount.toLocaleString()} wallets available`,
                value: key,
                emoji: source.icon,
                default: isSelected
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_data_sources')
            .setPlaceholder(`Select ${this.selectedChain} data sources...`)
            .setMinValues(1).setMaxValues(options.length)
            .addOptions(options);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);

        const backButton = new ButtonBuilder()
            .setCustomId('back_to_filters')
            .setLabel('◀ Back')
            .setStyle(ButtonStyle.Secondary);

        const continueButton = this.editingFromResults ?
            new ButtonBuilder()
                .setCustomId('update_results_from_edit')
                .setLabel('🔄 Update Results')
                .setStyle(ButtonStyle.Success)
                .setDisabled(validDataSources.length === 0) :
            new ButtonBuilder()
                .setCustomId('select_export_format')
                .setLabel('📑 Continue to Format')
                .setStyle(ButtonStyle.Success)
                .setDisabled(validDataSources.length === 0);

        const row2 = new ActionRowBuilder()
            .addComponents(backButton, continueButton);

        const files = [];
        if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
            files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
        }
        if (await fs.pathExists(BRAND_ASSETS.banner)) {
            files.push(new AttachmentBuilder(BRAND_ASSETS.banner, { name: 'banner.png' }));
        }

        await safeUpdate(interaction, { embeds: [embed], components: [row1, row2], files: files, ephemeral: true });
        this.step = 'selecting_sources';
    }

    async showExportFormatSelection(interaction) {
        const chainSources = DATA_SOURCES[this.selectedChain];
        const chainEmoji = this.selectedChain === 'SOL' ? '🟣' : '🟡';
        const validDataSources = this.selectedDataSources.filter(key => key in chainSources);

        const embed = new EmbedBuilder()
            .setTitle(`📑 Export Format - ${this.selectedChain}`)
            .setDescription(`Select Export Format for ${this.selectedChain} data:\n\n` +
                `⛓️ **Chain:** ${chainEmoji} ${this.selectedChain}\n` +
                `📊 **Selected Data:** ${validDataSources.map(key => chainSources[key].name).join(', ')}\n` +
                `🎯 **Active Filters:** ${this.filterBuilder.selectedFilters.length}`)
            .setColor(EMBED_COLOR)
            .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
            .setTimestamp()
            .addFields(
                { name: '📄 CSV', value: `Standard ${this.selectedChain} CSV file\n• Easy to import\n• Universal compatibility`, inline: true },
                { name: '📊 Excel', value: `${this.selectedChain} Excel\n• Professional design\n• Auto-formatting`, inline: true },
                { name: '📦 Both', value: `CSV + Excel\n• ${this.selectedChain} Complete Export\n• Maximum flexibility`, inline: true }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('export_csv').setLabel('📄 CSV').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('export_excel').setLabel('📊 Excel').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('export_both').setLabel('📦 Both').setStyle(ButtonStyle.Success)
            );

        const files = [];
        if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
            files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
        }

        await safeUpdate(interaction, { embeds: [embed], components: [row], files: files, ephemeral: true });
    }

    async loadDataInfo() {
        const dataPath = './data';
        await fs.ensureDir(dataPath);
        const chainSources = DATA_SOURCES[this.selectedChain];

        for (const [sourceKey, source] of Object.entries(chainSources)) {
            const normalizedFile = this.selectedChain === 'BSC' ?
                normalizeBSCFileName(source.file) :
                source.file;

            const filePath = path.join(dataPath, normalizedFile);

            if (await fs.pathExists(filePath)) {
                const content = await fs.readFile(filePath, 'utf-8');
                const lines = content.split('\n').filter(line => line.trim());
                const walletCount = Math.max(0, lines.length - 1);
                this.dataInfo[sourceKey] = { count: walletCount };
            } else {
                if (this.selectedChain === 'BSC') {
                    const foundFile = await findBSCFile(sourceKey, source.file);
                    if (foundFile) {
                        const content = await fs.readFile(foundFile, 'utf-8');
                        const lines = content.split('\n').filter(line => line.trim());
                        const walletCount = Math.max(0, lines.length - 1);
                        this.dataInfo[sourceKey] = { count: walletCount };
                    } else {
                        this.dataInfo[sourceKey] = { count: 0 };
                    }
                } else {
                    this.dataInfo[sourceKey] = { count: 0 };
                }
            }
        }
    }

    async loadDataSources() {
        console.log('\n[LOAD_DATA] ========================================');
        console.log('[LOAD_DATA] Chain:', this.selectedChain);
        console.log('[LOAD_DATA] Sources to load:', this.selectedDataSources);

        const dataPath = './data';
        await fs.ensureDir(dataPath);

        const chainSources = DATA_SOURCES[this.selectedChain];
        if (!chainSources) {
            console.error('[LOAD_DATA] ❌ ERROR: Chain sources not found for', this.selectedChain);
            console.error('[LOAD_DATA] Available chains:', Object.keys(DATA_SOURCES));
            throw new Error(`Invalid chain: ${this.selectedChain}`);
        }

        console.log('[LOAD_DATA] ✅ Chain sources found:', Object.keys(chainSources).length, 'sources available');
        this.csvData = {};

        for (const sourceKey of this.selectedDataSources) {
            const source = chainSources[sourceKey];
            if (!source) {
                console.error(`[LOAD_DATA] ❌ ERROR: Source "${sourceKey}" not found in chain ${this.selectedChain}`);
                console.error('[LOAD_DATA] Available sources:', Object.keys(chainSources));
                continue;
            }

            console.log(`[LOAD_DATA] 📂 Loading ${source.name} (${source.icon})...`);

            const normalizedFile = this.selectedChain === 'BSC' ?
                normalizeBSCFileName(source.file) :
                source.file;

            let filePath = path.join(dataPath, normalizedFile);

            if (this.selectedChain === 'BSC' && !(await fs.pathExists(filePath))) {
                filePath = await findBSCFile(sourceKey, source.file) || filePath;
            }

            if (await fs.pathExists(filePath)) {
                let content = await fs.readFile(filePath, 'utf-8');

                // Fix BSC CSV: Remove empty first column if exists
                if (this.selectedChain === 'BSC') {
                    const lines = content.split('\n');
                    const cleanedLines = lines.map(line => {
                        if (line.startsWith(',')) {
                            return line.substring(1);
                        }
                        return line;
                    });
                    content = cleanedLines.join('\n');
                    console.log(`[BSC_FIX] Cleaned BSC CSV for ${source.name}`);
                }

                const parsed = Papa.parse(content, {
                    header: true,
                    dynamicTyping: false,
                    skipEmptyLines: true,
                    transformHeader: (header) => {
                        return header.trim().replace(/^["']|["']$/g, '');
                    }
                });

                if (parsed.data.length > 0) {
                    const firstRow = parsed.data[0];
                    if (!firstRow.wallet_address && !firstRow.address) {
                        console.error(`[ERROR] No wallet_address found in ${source.name}`);
                        console.log('[DEBUG] Available fields:', Object.keys(firstRow).slice(0, 10));
                    } else {
                        const processedData = parsed.data.map(row => {
                            const cleanRow = {};
                            for (const [key, value] of Object.entries(row)) {
                                if (typeof value === 'string') {
                                    cleanRow[key] = value.trim().replace(/^["']|["']$/g, '');
                                } else {
                                    cleanRow[key] = value;
                                }
                            }

                            if ('bundler' in cleanRow) {
                                cleanRow.bundler = formatBundlerValue(cleanRow.bundler);
                            }
                            return cleanRow;
                        });

                        console.log(`[SUCCESS] Loaded ${source.name}: ${processedData.length} records`);
                        console.log(`[DEBUG] Available columns in ${source.name}:`, Object.keys(processedData[0]).slice(0, 10));
                        this.csvData[sourceKey] = processedData;
                    }
                } else {
                    console.error(`[ERROR] No data parsed from ${source.name}`);
                }
            } else {
                console.error(`[ERROR] File not found: ${filePath}`);
            }
        }
        console.log('[LOAD_DATA] ======================================== END\n');
    }

    async applyFilters(sourceKey) {
        const data = this.csvData[sourceKey];
        if (!data || data.length === 0) {
            console.log(`[FILTER] No data for ${sourceKey}`);
            return [];
        }

        const totalRecords = data.length;
        let results = [...data];
        const filters = this.filterBuilder.getFiltersForProcessing();
        const missingFields = [];
        const filterStats = {};

        console.log(`\n[FILTER_START] ========== Applying ${Object.keys(filters).length} filters to ${sourceKey} ==========`);
        console.log(`[FILTER] Chain: ${this.selectedChain}`);
        console.log(`[FILTER] Starting with ${totalRecords} records`);

        const sampleRow = data[0];
        const availableFields = Object.keys(sampleRow);
        console.log(`[FILTER] Available fields (first 20):`, availableFields.slice(0, 20));

        for (const filterKey of Object.keys(filters)) {
            if (!(filterKey in sampleRow)) {
                missingFields.push(filterKey);
                console.warn(`[WARNING] ⚠️ Field '${filterKey}' NOT FOUND in CSV!`);
                console.warn(`[SUGGESTION] Available similar fields:`, availableFields.filter(f => f.includes(filterKey.split('_').pop())));
            } else {
                console.log(`[VALIDATION] ✓ Field '${filterKey}' exists in CSV`);
            }
        }

        let filterNumber = 0;
        for (const [filterKey, config] of Object.entries(filters)) {
            filterNumber++;
            const beforeCount = results.length;

            console.log(`\n[FILTER_${filterNumber}] ----------------------------------------`);
            console.log(`[FILTER_${filterNumber}] Applying: ${filterKey}`);
            console.log(`[FILTER_${filterNumber}] Range: ${config.min} to ${config.max} ${config.unit || ''}`);
            console.log(`[FILTER_${filterNumber}] Starting records: ${beforeCount}`);

            const sampleValues = results.slice(0, 5).map(row => {
                const rawValue = row[filterKey];
                const parsedValue = parseValue(rawValue);
                return `${rawValue} → ${parsedValue}`;
            });
            console.log(`[FILTER_${filterNumber}] Sample values:`, sampleValues);

            results = results.filter(row => {
                if (!(filterKey in row)) {
                    console.warn(`[FILTER_${filterNumber}] SKIP: Field '${filterKey}' not in row`);
                    return false;
                }

                const rawValue = row[filterKey];
                const fieldValue = parseValue(rawValue);

                if (config.min !== null && config.min !== undefined && fieldValue < config.min) {
                    return false;
                }

                if (config.max !== null && config.max !== undefined && fieldValue > config.max) {
                    return false;
                }

                return true;
            });

            const afterCount = results.length;
            const filtered = beforeCount - afterCount;
            filterStats[filterKey] = { before: beforeCount, after: afterCount, filtered: filtered };

            console.log(`[FILTER_${filterNumber}] ✓ Completed: ${beforeCount} → ${afterCount} records (removed ${filtered})`);

            if (afterCount === 0) {
                console.log(`[FILTER_${filterNumber}] ⚠️ NO RECORDS LEFT after this filter!`);
                break;
            }
        }

        console.log(`\n[FILTER_END] ========== Filtering Complete for ${sourceKey} (${this.selectedChain}) ==========`);
        console.log(`[FILTER_END] Final result: ${totalRecords} → ${results.length} records`);
        console.log(`[FILTER_END] Total filtered out: ${totalRecords - results.length}`);

        if (missingFields.length > 0) {
            console.log(`[FILTER_END] ⚠️ Missing fields detected: ${missingFields.join(', ')}`);
        }

        this.debugInfo[sourceKey] = {
            totalRecords,
            finalCount: results.length,
            filteredOut: totalRecords - results.length,
            missingFields,
            filterStats
        };

        return results;
    }

    async deduplicateResults(allResultsArray) {
        const uniqueWallets = new Map();

        for (const results of allResultsArray) {
            for (const wallet of results) {
                const address = wallet.wallet_address || wallet.address;
                if (!uniqueWallets.has(address)) {
                    uniqueWallets.set(address, wallet);
                } else {
                    const existing = uniqueWallets.get(address);
                    const existingTime = new Date(existing.last_trade_timestamp || 0).getTime();
                    const newTime = new Date(wallet.last_trade_timestamp || 0).getTime();
                    if (newTime > existingTime) {
                        uniqueWallets.set(address, wallet);
                    }
                }
            }
        }

        return Array.from(uniqueWallets.values());
    }

    async showResults(interaction) {
        if (this.isProcessing) {
            await safeReply(interaction, {
                content: '⏳ Already processing. Please wait...',
                ephemeral: true
            });
            return;
        }

        // Validazione critica
        if (!this.selectedChain) {
            console.error('[RESULTS_ERROR] No chain selected!');
            await safeReply(interaction, {
                content: '❌ **Error**: No chain selected.\n\nPlease start over with `/scan`',
                ephemeral: true
            });
            this.editingFromResults = false;
            return;
        }

        if (!this.selectedDataSources || this.selectedDataSources.length === 0) {
            console.error('[RESULTS_ERROR] No data sources selected!');
            await safeReply(interaction, {
                content: '❌ **Error**: No data sources selected.\n\nPlease select at least one data source.',
                ephemeral: true
            });
            this.editingFromResults = false;
            setTimeout(async () => {
                await this.showDataSourceSelection(interaction);
            }, 1500);
            return;
        }

        const chainSources = DATA_SOURCES[this.selectedChain];
        if (!chainSources) {
            console.error('[RESULTS_ERROR] Invalid chain:', this.selectedChain);
            await safeReply(interaction, {
                content: `❌ **Error**: Invalid chain "${this.selectedChain}".\n\nPlease start over.`,
                ephemeral: true
            });
            this.editingFromResults = false;
            return;
        }

        for (const sourceKey of this.selectedDataSources) {
            if (!chainSources[sourceKey]) {
                console.error('[RESULTS_ERROR] Invalid source:', sourceKey, 'for chain', this.selectedChain);
                await safeReply(interaction, {
                    content: `❌ **Error**: Invalid data source "${sourceKey}" for chain ${this.selectedChain}.\n\nPlease reselect your data sources.`,
                    ephemeral: true
                });
                this.editingFromResults = false;
                setTimeout(async () => {
                    await this.showDataSourceSelection(interaction);
                }, 1500);
                return;
            }
        }

        console.log('[RESULTS] ✅ Validation passed');
        console.log('[RESULTS] Chain:', this.selectedChain);
        console.log('[RESULTS] Sources:', this.selectedDataSources);
        console.log('[RESULTS] Filters:', this.filterBuilder.selectedFilters.length);

        this.isProcessing = true;

        // Carica globale queueManager dalla dependency injection
        const queueManager = global.queueManager;

        const operation = async () => {
            try {
                const InteractionValidator = require('../core/InteractionValidator');

                if (!await InteractionValidator.canRespond(interaction)) {
                    console.log('[RESULTS] Interaction expired before processing');
                    return;
                }

                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferUpdate();
                }

                const loadingEmbed = new EmbedBuilder()
                    .setTitle(`⏳ Processing ${this.selectedChain}...`)
                    .setDescription(`🔍 Analyzing ${this.selectedChain} data with your filters...\n⚙️ Validating fields...\n🔄 Removing duplicates...\nThis may take a few moments.`)
                    .setColor(EMBED_COLOR)
                    .setFooter({ text: 'Please wait...' });

                await interaction.editReply({ embeds: [loadingEmbed], components: [], files: [], ephemeral: true });

                await this.loadDataSources();

                const chainEmoji = this.selectedChain === 'SOL' ? '🟣' : '🟡';
                const chainSources = DATA_SOURCES[this.selectedChain];

                const embed = new EmbedBuilder()
                    .setTitle(`📊 ${this.selectedChain} Analysis Completed`)
                    .setDescription(`✅ ${this.selectedChain} analysis completed!\n\n` +
                        `⛓️ **Chain:** ${chainEmoji} ${this.selectedChain}\n` +
                        `📑 **Export:** ${this.exportFormat === 'both' ? 'CSV + Excel' :
                            this.exportFormat === 'excel' ? 'Excel' : 'CSV'}\n` +
                        `🎯 **Filters Applied:** ${this.filterBuilder.selectedFilters.length}\n` +
                        `${this.currentPresetName ? `📦 **${this.selectedChain} Preset:** ${this.currentPresetName}` : ''}`)
                    .setColor(EMBED_COLOR)
                    .setImage('attachment://banner.png')
                    .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
                    .setTimestamp();

                let totalResultsBeforeDedupe = 0;
                const allResultsArray = [];
                const allResults = {};

                this.debugInfo = {};

                for (const sourceKey of this.selectedDataSources) {
                    const results = await this.applyFilters(sourceKey);
                    allResultsArray.push(results);
                    totalResultsBeforeDedupe += results.length;
                }

                let finalResults;
                if (this.selectedDataSources.length > 1) {
                    finalResults = await this.deduplicateResults(allResultsArray);
                    const duplicatesRemoved = totalResultsBeforeDedupe - finalResults.length;
                    if (duplicatesRemoved > 0) {
                        embed.setDescription(embed.data.description +
                            `\n🔄 **Duplicates Removed:** ${duplicatesRemoved}`);
                    }
                } else {
                    finalResults = allResultsArray[0] || [];
                }

                if (this.selectedDataSources.length === 1) {
                    allResults[this.selectedDataSources[0]] = finalResults;
                } else {
                    allResults['combined'] = finalResults;
                }

                this.results = allResults;
                const totalResults = finalResults.length;

                const debugMessages = [];
                for (const [sourceKey, debugInfo] of Object.entries(this.debugInfo)) {
                    if (debugInfo.missingFields && debugInfo.missingFields.length > 0) {
                        debugMessages.push(`⚠️ **${sourceKey}**: Missing fields: ${debugInfo.missingFields.slice(0, 3).join(', ')}`);
                    }
                    if (debugInfo.filteredOut > debugInfo.totalRecords * 0.9) {
                        debugMessages.push(`⚠️ **${sourceKey}**: ${Math.round(debugInfo.filteredOut / debugInfo.totalRecords * 100)}% filtered out`);
                    }
                }

                if (debugMessages.length > 0) {
                    embed.addFields({
                        name: '🔍 Debug Info',
                        value: debugMessages.join('\n').substring(0, 1024),
                        inline: false
                    });
                }

                if (this.selectedDataSources.length > 1) {
                    embed.addFields({
                        name: `📊 Combined Results`,
                        value: `✅ **${totalResults.toLocaleString()}** unique wallets\n` +
                            `📁 Sources: ${this.selectedDataSources.length}`,
                        inline: false
                    });
                } else {
                    const source = chainSources[this.selectedDataSources[0]];
                    embed.addFields({
                        name: `${source.icon} ${source.name}`,
                        value: `✅ **${totalResults.toLocaleString()}** matches`,
                        inline: true
                    });
                }

                if (finalResults?.length > 0) {
                    embed.addFields({
                        name: `\n📈 Top 3 ${this.selectedChain} Results Preview`,
                        value: '━━━━━━━━━━━━━━━━━━━━━',
                        inline: false
                    });

                    const sortedResults = [...finalResults].sort((a, b) => {
                        const profitKeys = Object.keys(a).filter(k => k.includes('profit'));
                        if (profitKeys.length > 0) {
                            return parseValue(b[profitKeys[0]]) - parseValue(a[profitKeys[0]]);
                        }
                        return 0;
                    });

                    sortedResults.slice(0, 3).forEach((row, index) => {
                        const profitKey = Object.keys(row).find(k => k.includes('profit'));
                        const winrateKey = Object.keys(row).find(k => k.includes('winrate'));
                        const tradesKey = Object.keys(row).find(k => k.includes('trades') || k.includes('buy'));
                        const balanceKey = this.selectedChain === 'SOL' ? 'sol_balance' : 'bnb_balance';

                        const profit = profitKey ? parseValue(row[profitKey]) : 0;
                        const winrate = winrateKey ? parseValue(row[winrateKey]) : 0;
                        const trades = tradesKey ? parseValue(row[tradesKey]) : 0;
                        const balance = parseValue(row[balanceKey]);

                        const balanceUnit = this.selectedChain === 'SOL' ? 'SOL' : 'BNB';

                        embed.addFields({
                            name: `🏅 Rank #${index + 1}`,
                            value: `💰 **${profit.toFixed(2)}**\n📊 WR: **${winrate.toFixed(1)}%**\n📈 Trades: **${trades}**\n💎 Balance: **${balance.toFixed(4)} ${balanceUnit}**`,
                            inline: true
                        });
                    });
                }

                const row1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('export_results')
                            .setLabel(`📥 Export ${this.selectedChain} ${this.exportFormat === 'both' ? 'CSV + Excel' :
                                this.exportFormat === 'excel' ? 'Excel' : 'CSV'}`)
                            .setStyle(ButtonStyle.Primary).setDisabled(totalResults === 0),
                        new ButtonBuilder().setCustomId('save_preset')
                            .setLabel(`💾 Save ${this.selectedChain} Config`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('change_format')
                            .setLabel('📑 Change Format')
                            .setStyle(ButtonStyle.Secondary)
                    );

                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('edit_filters_from_results')
                            .setLabel('✏️ Edit Filters')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('⚙️'),
                        new ButtonBuilder()
                            .setCustomId('edit_sources_from_results')
                            .setLabel('📁 Edit Sources')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('new_analysis')
                            .setLabel('🔄 New Analysis')
                            .setStyle(ButtonStyle.Secondary)
                    );

                const files = [];
                if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
                    files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
                }
                if (await fs.pathExists(BRAND_ASSETS.banner)) {
                    files.push(new AttachmentBuilder(BRAND_ASSETS.banner, { name: 'banner.png' }));
                }

                this.editingFromResults = false;

                await interaction.editReply({
                    embeds: [embed],
                    components: [row1, row2],
                    files: files,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Error in showResults:', error);
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription(`Failed to analyze ${this.selectedChain} data: ${error.message}\n\nPlease check console for details.`)
                    .setColor('#FF0000')
                    .setFooter({ text: BRAND_ASSETS.footer });

                await safeUpdate(interaction, { embeds: [errorEmbed], components: [], ephemeral: true });
            } finally {
                this.isProcessing = false;
            }
        };

        if (queueManager) {
            await queueManager.addToQueue(this.userId, operation, 1);
        } else {
            await operation();
        }
    }

    async exportResults(interaction) {
        const queueManager = global.queueManager;

        const operation = async () => {
            try {
                await safeReply(interaction, {
                    content: `📥 Preparing ${this.selectedChain} export...`,
                    ephemeral: true
                });

                const attachments = [];

                for (const [sourceKey, results] of Object.entries(this.results)) {
                    if (results?.length > 0) {
                        let sourcePrefix;
                        if (sourceKey === 'combined') {
                            sourcePrefix = `casper_${this.selectedChain}_combined_${this.selectedDataSources.length}_sources`;
                        } else {
                            sourcePrefix = `casper_${this.selectedChain}_${sourceKey}`;
                        }

                        if (this.exportFormat === 'csv' || this.exportFormat === 'both') {
                            const csvData = results.map(row => {
                                const processedRow = { ...row };
                                if ('bundler' in processedRow) {
                                    processedRow.bundler = formatBundlerValue(processedRow.bundler);
                                }
                                return processedRow;
                            });

                            const csv = Papa.unparse(csvData, {
                                quotes: false,
                                delimiter: ',',
                                newline: '\n'
                            });

                            const buffer = Buffer.from(csv, 'utf-8');
                            attachments.push(new AttachmentBuilder(buffer, {
                                name: generateFileName(sourcePrefix, this.selectedChain, 'csv')
                            }));
                        }

                        if (this.exportFormat === 'excel' || this.exportFormat === 'both') {
                            const sourceName = sourceKey === 'combined' ?
                                `Combined ${this.selectedChain} (${this.selectedDataSources.join(', ')})` :
                                DATA_SOURCES[this.selectedChain][sourceKey]?.name || sourceKey;

                            const workbook = await createDarkThemedExcel(results, sourceName, this.selectedChain);
                            const buffer = await workbook.xlsx.writeBuffer();

                            attachments.push(new AttachmentBuilder(buffer, {
                                name: generateFileName(sourcePrefix + '_dark', this.selectedChain, 'xlsx')
                            }));
                        }
                    }
                }

                if (attachments.length > 0) {
                    const formatText = this.exportFormat === 'both' ? 'CSV and Excel files' :
                        this.exportFormat === 'excel' ? 'Excel file(s)' : 'CSV file(s)';
                    const chainEmoji = this.selectedChain === 'SOL' ? '🟣' : '🟡';

                    const exportEmbed = new EmbedBuilder()
                        .setTitle('✅ Export Complete!')
                        .setDescription(`📥 **${this.selectedChain} Export Ready!**\n\n` +
                            `⛓️ **Chain:** ${chainEmoji} ${this.selectedChain}\n` +
                            `📊 **Format:** ${formatText}\n` +
                            `📋 **Parameters:** All included\n` +
                            `🔄 **Duplicates:** Removed\n\n` +
                            `📁 **Files:** casper_${this.selectedChain}_[source]_YYYYMMDD_HHMMSS`)
                        .setColor('#00FF00')
                        .setFooter({ text: '⏱️ Session will close in 5 minutes if inactive' })
                        .setTimestamp();

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('new_session_after_export')
                                .setLabel('🔄 New Session')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('✨'),
                            new ButtonBuilder()
                                .setCustomId('export_results')
                                .setLabel('📥 Export Again')
                                .setStyle(ButtonStyle.Secondary)
                        );

                    await interaction.editReply({
                        embeds: [exportEmbed],
                        files: attachments,
                        components: [row],
                        ephemeral: true
                    });

                    this.startExportSessionTimer();

                } else {
                    await interaction.editReply({
                        content: '❌ No results to export.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('Error in exportResults:', error);
                await safeReply(interaction, {
                    content: '❌ Export failed. Please try again.',
                    ephemeral: true
                });
            }
        };

        if (queueManager) {
            await queueManager.addToQueue(this.userId, operation, 2);
        } else {
            await operation();
        }
    }

    startExportSessionTimer() {
        if (this.exportSessionTimer) {
            clearTimeout(this.exportSessionTimer);
        }

        console.log(`[EXPORT_TIMER] Starting 5-minute auto-close timer for user ${this.userId}`);

        this.exportSessionTimer = setTimeout(async () => {
            console.log(`[EXPORT_TIMER] 5 minutes elapsed, closing session for user ${this.userId}`);

            try {
                // Dinamicamente importa client per evitare circular dependency
                const client = global.discordClient;
                if (client) {
                    const channel = await client.channels.fetch(this.channelId);
                    if (channel) {
                        const embed = new EmbedBuilder()
                            .setTitle('⏱️ Session Closed')
                            .setDescription('Your export session has been closed after 5 minutes of inactivity.\n\n' +
                                '✅ **Your exported files are still available above!**\n\n' +
                                'Run `/scan` to start a new analysis session.')
                            .setColor('#FFA500')
                            .setFooter({ text: 'Thank you for using Casper Scanner!' })
                            .setTimestamp();

                        await channel.send({
                            content: `<@${this.userId}>`,
                            embeds: [embed]
                        });
                    }
                }
            } catch (error) {
                console.error('[EXPORT_TIMER] Error sending closure notification:', error);
            }

            // Elimina la sessione usando sessionManager globale
            const sessionManager = global.sessionManager;
            if (sessionManager) {
                sessionManager.deleteSession(this.userId);
            }
        }, 5 * 60 * 1000); // 5 minuti
    }

    createSavePresetModal() {
        const modal = new ModalBuilder()
            .setCustomId('save_preset_modal')
            .setTitle(`💾 Save ${this.selectedChain} Filter Preset`);

        const nameInput = new TextInputBuilder()
            .setCustomId('preset_name')
            .setLabel(`${this.selectedChain} Preset Name`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`My ${this.selectedChain} Custom Filters`)
            .setRequired(true)
            .setMaxLength(50);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('preset_description')
            .setLabel('Description (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(`Describe this ${this.selectedChain} preset...`)
            .setRequired(false)
            .setMaxLength(200);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(descriptionInput)
        );

        return modal;
    }

    async showMyPresets(interaction) {
        if (!this.selectedChain) {
            await safeReply(interaction, {
                content: '⚠️ Please select a chain first (SOL or BSC) to view presets!',
                ephemeral: true
            });
            return;
        }

        // Carica presets tramite presetService globale
        const presetService = global.presetService;
        const userPresets = await presetService.loadUserPresets(this.userId, this.selectedChain);

        if (Object.keys(userPresets).length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`📦 My ${this.selectedChain} Presets`)
                .setDescription(`You have no saved ${this.selectedChain} presets yet.\n\nCreate one by setting up filters and clicking "💾 Save ${this.selectedChain} Preset"`)
                .setColor(EMBED_COLOR)
                .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('back_to_intro').setLabel('◀ Back').setStyle(ButtonStyle.Secondary)
                );

            const files = [];
            if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
                files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
            }

            await safeUpdate(interaction, { embeds: [embed], components: [row], files: files, ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`📦 My ${this.selectedChain} Saved Presets`)
            .setDescription(`Select a ${this.selectedChain} preset to load:`)
            .setColor(EMBED_COLOR)
            .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
            .setTimestamp();

        const options = [];
        for (const [name, preset] of Object.entries(userPresets)) {
            embed.addFields({
                name: `📌 ${name}`,
                value: `Filters: ${preset.filters.length} | Created: ${new Date(preset.createdAt).toLocaleDateString()}`,
                inline: true
            });

            options.push({
                label: name.substring(0, 100),
                description: `${preset.filters.length} filters`,
                value: name
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_preset_for_options')
            .setPlaceholder(`Select a ${this.selectedChain} preset...`)
            .addOptions(options.slice(0, 25));

        const row1 = new ActionRowBuilder().addComponents(selectMenu);

        const row2 = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId('back_to_intro').setLabel('◀ Back').setStyle(ButtonStyle.Secondary));

        const files = [];
        if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
            files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
        }

        await safeUpdate(interaction, { embeds: [embed], components: [row1, row2], files: files, ephemeral: true });
    }
}

module.exports = ScannerSession;
