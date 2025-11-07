// ========================================
// FILTER BUILDER CLASS - CHAIN SPECIFIC
// ========================================
class FilterBuilder {
    constructor() {
        this.selectedFilters = [];
        this.pendingFilters = [];
        this.tempSelectedMetrics = [];
        this.tempCategory = null;
        this.chain = null;
        this.multipleFiltersQueue = []; // NUOVO: Queue per filtri multipli
        this.currentFilterIndex = 0;     // NUOVO: Indice corrente
    }

    setChain(chain) {
        this.chain = chain;
    }

    getMetricsSystem() {
        return this.chain === 'BSC' ? METRICS_SYSTEM_BSC : METRICS_SYSTEM_SOL;
    }

    getFiltersForRemoval() {
        return this.selectedFilters.map((filter, index) => ({
            id: index,
            label: filter.label,
            period: filter.period,
            min: filter.min,
            max: filter.max,
            unit: filter.unit,
            description: `${filter.label}${filter.period ? ` [${filter.period.toUpperCase()}]` : ''}: ${filter.min}-${filter.max} ${filter.unit}`
        }));
    }

    removeMultipleFilters(indices) {
        indices.sort((a, b) => b - a);
        for (const index of indices) {
            this.removeFilter(index);
        }
    }

    // NUOVO: Setup per configurazione multipla
    setupMultipleFiltersConfiguration(groupId, metrics, period = null) {
        this.multipleFiltersQueue = [];
        this.currentFilterIndex = 0;
        
        for (const metric of metrics) {
            this.multipleFiltersQueue.push({
                groupId,
                metricId: metric.id,
                label: metric.label,
                unit: metric.unit,
                defaultMin: metric.defaultMin,
                defaultMax: metric.defaultMax,
                period: period,
                uniqueId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
        }
    }

    // NUOVO: Get next filter da configurare
    getNextFilterToConfig() {
        if (this.currentFilterIndex < this.multipleFiltersQueue.length) {
            return this.multipleFiltersQueue[this.currentFilterIndex];
        }
        return null;
    }

    // NUOVO: Move to next filter
    moveToNextFilter() {
        this.currentFilterIndex++;
        return this.currentFilterIndex < this.multipleFiltersQueue.length;
    }

    // NUOVO: Clear filter queue
    clearFilterQueue() {
        this.multipleFiltersQueue = [];
        this.currentFilterIndex = 0;
    }

    addPendingFilters(groupId, metrics, period = null) {
        this.pendingFilters = [];
        for (const metric of metrics) {
            this.pendingFilters.push({
                groupId,
                metricId: metric.id,
                label: metric.label,
                unit: metric.unit,
                defaultMin: metric.defaultMin,
                defaultMax: metric.defaultMax,
                period: period,
                uniqueId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
        }
    }

    removeFilter(index) {
        if (index >= 0 && index < this.selectedFilters.length) {
            this.selectedFilters.splice(index, 1);
        }
    }

    getFiltersForProcessing() {
        const filters = {};
        for (const filter of this.selectedFilters) {
            filters[filter.filterKey] = {
                min: filter.min,
                max: filter.max,
                label: filter.label,
                unit: filter.unit,
                period: filter.period
            };
        }
        return filters;
    }

    loadFromPreset(preset) {
        this.selectedFilters = preset.filters || [];
        this.pendingFilters = [];
        this.tempSelectedMetrics = [];
        this.tempCategory = null;
        this.clearFilterQueue(); // NUOVO: Clear queue when loading preset
    }

    clear() {
        this.selectedFilters = [];
        this.pendingFilters = [];
        this.tempSelectedMetrics = [];
        this.tempCategory = null;
        this.clearFilterQueue(); // NUOVO: Clear queue when clearing all
    }

    getGroupedFilterSummary() {
        const grouped = {};
        for (const filter of this.selectedFilters) {
            const key = filter.label;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            const periodText = filter.period ? `[${filter.period.toUpperCase()}]` : '';
            const min = filter.min !== null ? `≥${filter.min}` : 'no min';
            const max = filter.max !== null ? `≤${filter.max}` : 'unlimited';
            grouped[key].push({
                period: filter.period,
                display: `${periodText} ${min} - ${max} ${filter.unit}`,
                filter: filter
            });
        }

        for (const key in grouped) {
            grouped[key].sort((a, b) => {
                const periodOrder = { '1d': 1, '7d': 2, '30d': 3, null: 4 };
                return (periodOrder[a.period] || 4) - (periodOrder[b.period] || 4);
            });
        }

        return grouped;
    }

    setTempSelectedMetrics(category, metricIds) {
        this.tempCategory = category;
        this.tempSelectedMetrics = metricIds;
    }

    getTempSelectedMetrics() {
        return {
            category: this.tempCategory,
            metrics: this.tempSelectedMetrics
        };
    }

    clearTempSelectedMetrics() {
        this.tempSelectedMetrics = [];
        this.tempCategory = null;
    }

    getFilterSummary() {
        if (this.selectedFilters.length === 0) {
            return { count: 0, details: 'No filters active' };
        }

        const grouped = this.getGroupedFilterSummary();
        const lines = [];
        
        for (const [metricName, instances] of Object.entries(grouped)) {
            if (instances.length === 1) {
                lines.push(`• **${metricName}**: ${instances[0].display}`);
            } else {
                lines.push(`• **${metricName}**:`);
                for (const inst of instances) {
                    lines.push(`  └─ ${inst.display}`);
                }
            }
        }

        return {
            count: this.selectedFilters.length,
            details: lines.join('\n')
        };
    }
}

// ========================================
// FUNZIONI HELPER
// ========================================
function getParameterInfo(fieldName, chain) {
    const metricsSystem = chain === 'BSC' ? METRICS_SYSTEM_BSC : METRICS_SYSTEM_SOL;
    
    for (const category of Object.values(metricsSystem)) {
        const metric = category.metrics.find(m => m.id === fieldName);
        if (metric) {
            return {
                min: metric.defaultMin,
                max: metric.defaultMax,
                unit: metric.unit,
                description: metric.label,
                format: metric.unit === '$' ? 'currency' :
                    metric.unit === '%' ? 'percent_no_divide' :
                    metric.unit === 'SOL' || metric.unit === 'BNB' ? 'native' :
                    metric.unit === 'BOOL' ? 'boolean' : 'number'
            };
        }
    }

    for (const period of TIME_PERIODS) {
        const fieldWithoutPeriod = fieldName.replace(`${period}_`, '');
        for (const category of Object.values(metricsSystem)) {
            const metric = category.metrics.find(m => m.id === fieldWithoutPeriod);
            if (metric) {
                return {
                    min: metric.defaultMin,
                    max: metric.defaultMax,
                    unit: metric.unit,
                    description: `${period} ${metric.label}`,
                    format: metric.unit === '$' ? 'currency' :
                        metric.unit === '%' ? 'percent_no_divide' :
                        metric.unit === 'SOL' || metric.unit === 'BNB' ? 'native' :
                        metric.unit === 'BOOL' ? 'boolean' : 'number'
                };
            }
        }
    }

    return { min: 0, max: 100000, unit: 'value', description: fieldName, format: 'number' };
}

function parseValue(value) {
    if (value === null || value === 'null' || value === undefined || value === '' || value === 'undefined') {
        return 0;
    }
    
    if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
    }
    
    let strValue = String(value).trim();
    
    if (strValue.toLowerCase() === 'yes' || strValue.toLowerCase() === 'true') return 1;
    if (strValue.toLowerCase() === 'no' || strValue.toLowerCase() === 'false') return 0;
    
    strValue = strValue.replace(/^["']|["']$/g, '').trim();
    
    if (strValue === '' || strValue === 'null' || strValue === 'undefined') return 0;
    
    if (strValue.endsWith('K') || strValue.endsWith('k')) {
        const num = parseFloat(strValue.slice(0, -1));
        return isNaN(num) ? 0 : num * 1000;
    }
    if (strValue.endsWith('M') || strValue.endsWith('m')) {
        const num = parseFloat(strValue.slice(0, -1));
        return isNaN(num) ? 0 : num * 1000000;
    }
    if (strValue.endsWith('B') || strValue.endsWith('b')) {
        const num = parseFloat(strValue.slice(0, -1));
        return isNaN(num) ? 0 : num * 1000000000;
    }
    
    strValue = strValue.replace(/[$,€£¥]/g, '');
    
    if (strValue.endsWith('%')) {
        strValue = strValue.slice(0, -1).trim();
    }
    
    const parsed = parseFloat(strValue);
    return isNaN(parsed) ? 0 : parsed;
}

function formatBundlerValue(value) {
    const val = parseValue(value);
    return val === 1 ? 'Yes' : 'No';
}

function formatDate(dateString) {
    if (!dateString || dateString === 'null' || dateString === '-') return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) { return ''; }
}

function generateFileName(prefix = 'casper', chain = '', extension = 'csv') {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const chainPrefix = chain ? `_${chain}` : '';
    return `${prefix}${chainPrefix}_${year}${month}${day}_${hours}${minutes}${seconds}.${extension}`;
}

// ========================================
// NORMALIZE BSC FILE NAMES
// ========================================
function normalizeBSCFileName(fileName) {
    const normalizedName = fileName.toLowerCase();
    const nameWithoutExt = normalizedName.replace(/\.(csv|txt)$/, '');

    const fileMap = {
        'trending_bsc': ['trending_bsc', 'trending_BSC', 'trending_Bsc', 'TrendingBSC', 'trendingbsc'],
        'fourmeme_bsc': ['fourmeme_bsc', 'fourmeme_BSC', 'Fourmeme_bsc', 'Fourmeme_BSC', 'fourmeme', 'FourMeme'],
        'flap_bsc': ['flap_bsc', 'flap_BSC', 'Flap_bsc', 'Flap_BSC', 'flap', 'Flap'],
        'xmode_bsc': ['xmode_bsc', 'xmode_BSC', 'Xmode_bsc', 'Xmode_BSC', 'xmode', 'Xmode', 'binance_bsc', 'binance_BSC']
    };

    for (const [standardName, variations] of Object.entries(fileMap)) {
        for (const variation of variations) {
            if (nameWithoutExt.includes(variation.toLowerCase())) {
                return standardName;
            }
        }
    }

    return nameWithoutExt;
}

// ========================================
// FIND BSC FILE
// ========================================
async function findBSCFile(sourceKey, fileName) {
    const dataPath = './data';
    const baseName = normalizeBSCFileName(fileName);
    
    const possibleNames = [
        fileName,
        `${baseName}.csv`,
        `${baseName}.txt`,
        `${baseName}_bsc.csv`,
        `${baseName}_BSC.csv`,
        `${baseName.charAt(0).toUpperCase() + baseName.slice(1)}_bsc.csv`,
        `${baseName.charAt(0).toUpperCase() + baseName.slice(1)}_BSC.csv`,
        `${baseName}_bsc.txt`,
        `${baseName}_BSC.txt`,
        `${baseName.replace('_bsc', '')}.csv`,
        `${baseName.replace('_bsc', '')}.txt`,
        'binance_bsc.csv',
        'binance_BSC.csv'
    ];

    const uniqueNames = [...new Set(possibleNames)];

    console.log(`[BSC_SEARCH] Looking for ${sourceKey}:`);
    console.log(`[BSC_SEARCH] Base name: ${baseName}`);
    console.log(`[BSC_SEARCH] Trying ${uniqueNames.length} variations...`);

    for (const name of uniqueNames) {
        const filePath = path.join(dataPath, name);
        if (await fs.pathExists(filePath)) {
            console.log(`[BSC_SEARCH] ✅ FOUND: ${name}`);
            return filePath;
        }
    }

    console.log(`[BSC_SEARCH] ❌ NOT FOUND: Tried all variations`);
    return null;
}

// ========================================
// FUNZIONI INTERAZIONE SICURE - AGGIORNATE
// ========================================
async function safeReply(interaction, options, retries = 3) {
    // ✅ FORCE EPHEMERAL sempre
    if (options.ephemeral === undefined) {
        options.ephemeral = true;
    }
    
    // ✅ Check timeout con log dettagliato
    if (!await InteractionValidator.canRespond(interaction)) {
        const age = Date.now() - interaction.createdTimestamp;
        console.log(`[SAFE_REPLY] ⏱️ Interaction too old (${age}ms), skipping reply`);
        return null;
    }

    for (let i = 0; i < retries; i++) {
        try {
            if (!await InteractionValidator.canRespond(interaction)) {
                console.log('[INTERACTION] Interaction expired during retry');
                return null;
            }
            
            if (interaction.deferred) {
                return await interaction.editReply(options);
            } else if (interaction.replied) {
                return await interaction.followUp({ ...options, ephemeral: true });
            } else {
                return await interaction.reply(options);
            }
        } catch (error) {
            if (error.code === 10062) {
                console.log('[INTERACTION] Interaction expired (10062)');
                return null;
            }
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    return null;
}

async function safeUpdate(interaction, options, retries = 3) {
    // ✅ FORCE EPHEMERAL sempre
    if (options.ephemeral === undefined) {
        options.ephemeral = true;
    }
    
    if (!await InteractionValidator.canRespond(interaction)) {
        return null;
    }

    for (let i = 0; i < retries; i++) {
        try {
            if (!await InteractionValidator.canRespond(interaction)) {
                console.log('[INTERACTION] Interaction expired during retry');
                return null;
            }
            
            if (interaction.deferred || interaction.replied) {
                return await interaction.editReply(options);
            } else {
                if (interaction.isButton?.() || interaction.isStringSelectMenu?.() || interaction.isModalSubmit?.()) {
                    return await interaction.update(options);
                } else {
                    return await interaction.reply(options);
                }
            }
        } catch (error) {
            if (error.code === 10062) {
                console.log('[INTERACTION] Interaction expired (10062)');
                return null;
            }
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    return null;
}

// ========================================
// FUNZIONI DI LOGGING
// ========================================
async function logToChannel(content, embedData = null) {
    try {
        const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) return;

        if (embedData) {
            const embed = new EmbedBuilder()
                .setTitle(embedData.title || '📊 Scanner Log')
                .setDescription(embedData.description || content)
                .setColor(embedData.color || EMBED_COLOR)
                .setTimestamp()
                .setFooter({ text: embedData.footer || BRAND_ASSETS.footer });

            if (embedData.fields) embed.addFields(embedData.fields);

            const files = [];
            if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
                embed.setFooter({ text: embedData.footer || BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' });
                files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
            }

            await logChannel.send({ embeds: [embed], files: files });
        } else {
            await logChannel.send(content);
        }
    } catch (error) {
        console.error('Failed to log to channel:', error);
    }
}

async function logPresetUsage(userId, username, presetName, filters, chain) {
    const filterDetails = filters.slice(0, 10).map(f => {
        const paramInfo = getParameterInfo(f.filterKey || f.id, chain);
        return `• **${f.label}**: ${f.min || paramInfo.min}-${f.max || paramInfo.max} ${paramInfo.unit}`;
    }).join('\n');

    await logToChannel(null, {
        title: `💾 ${chain} Preset Loaded`,
        description: `User **${username}** loaded ${chain} preset: **${presetName}**`,
        fields: [
            { name: '📊 Filters Applied', value: filterDetails.substring(0, 1000) || 'No filters', inline: false },
            { name: '👤 User ID', value: userId, inline: true },
            { name: '⛓️ Chain', value: chain, inline: true },
            { name: '⏰ Time', value: new Date().toLocaleString('it-IT'), inline: true }
        ],
        color: '#00ff00'
    });
}

async function logAnalysisResults(userId, username, chain, sources, filters, resultCount, debugInfo = null) {
    const filterDetails = filters.map(f => {
        const periodText = f.period ? `[${f.period.toUpperCase()}] ` : '';
        return `• ${periodText}**${f.label}**: ${f.min ?? 'no min'} - ${f.max ?? 'no max'} ${f.unit}`;
    }).slice(0, 20).join('\n');

    const fieldsToLog = [
        { name: '⛓️ Chain', value: chain, inline: true },
        { name: '📁 Data Sources', value: sources.join(', ').substring(0, 1024), inline: false },
        { name: '🎯 Total Filters', value: filters.length.toString(), inline: true },
        { name: '📊 Results Found', value: resultCount.toString(), inline: true },
        { name: '👤 User', value: `${username} (${userId})`, inline: false }
    ];

    if (filterDetails) {
        fieldsToLog.push({
            name: '⚙️ Filter Configuration',
            value: filterDetails.substring(0, 1024),
            inline: false
        });

        if (filters.length > 20) {
            fieldsToLog.push({
                name: '📋 Additional Filters',
                value: `... and ${filters.length - 20} more filters`,
                inline: false
            });
        }
    }

    if (debugInfo) {
        fieldsToLog.push({
            name: '🔍 Debug Info',
            value: `Total Records: ${debugInfo.totalRecords || 0}\nFiltered Out: ${debugInfo.filteredOut || 0}\nMissing Fields: ${debugInfo.missingFields?.slice(0, 3).join(', ') || 'None'}`,
            inline: false
        });
    }

    fieldsToLog.push({
        name: '⏳ Queue Status',
        value: `Processing: ${queueManager.currentProcessing}/${queueManager.maxConcurrent} | Queued: ${queueManager.getTotalQueued()}`,
        inline: false
    });

    await logToChannel(null, {
        title: `📈 ${chain} Analysis Completed`,
        description: `User **${username}** completed ${chain} analysis`,
        fields: fieldsToLog,
        color: EMBED_COLOR
    });
}

async function logFilterEdit(userId, username, chain, action) {
    await logToChannel(null, {
        title: '✏️ Filters Edited',
        description: `User **${username}** edited filters from results`,
        fields: [
            { name: '⛓️ Chain', value: chain, inline: true },
            { name: '🎯 Action', value: action, inline: true },
            { name: '👤 User ID', value: userId, inline: true },
            { name: '⏰ Time', value: new Date().toLocaleString('it-IT'), inline: true }
        ],
        color: '#FFA500'
    });
}

// ========================================
// NOTIFICA AGGIORNAMENTI CSV
// ========================================
async function notifyListUpdate(fileName, action = 'updated') {
    const NOTIFICATION_CHANNEL_ID = '1415668627444731955';
    
    try {
        const notificationChannel = client.channels.cache.get(NOTIFICATION_CHANNEL_ID);
        if (!notificationChannel) {
            console.error('[CSV_NOTIFY] Channel not found');
            return;
        }

        const normalizedFileName = normalizeBSCFileName(fileName);
        let listName = normalizedFileName;
        let listIcon = '📊';
        let chain = 'Unknown';
        let sourceKey = null;

        for (const [chainKey, sources] of Object.entries(DATA_SOURCES)) {
            for (const [key, source] of Object.entries(sources)) {
                if (source.file === normalizedFileName || 
                    normalizeBSCFileName(source.file) === normalizedFileName) {
                    listName = source.name;
                    listIcon = source.icon;
                    chain = chainKey;
                    sourceKey = key;
                    break;
                }
            }
            if (sourceKey) break;
        }

        const roleId = LIST_ROLE_MAPPING[sourceKey];

        const embedConfig = {
            'updated': { title: '📊 List Updated', color: '#2effa2' },
            'added': { title: '✅ New List Added', color: '#2effa2' },
            'removed': { title: '🗑️ List Removed', color: '#FF0000' }
        };

        const config = embedConfig[action] || { title: '📝 List Changed', color: EMBED_COLOR };

        const embed = new EmbedBuilder()
            .setTitle(config.title)
            .setDescription(`${listIcon} **${listName}** (${chain})`)
            .setColor(config.color)
            .setImage('attachment://wallets.png')
            .setTimestamp()
            .setFooter({ text: 'Casper | CT' });

        const files = [];
        const walletsBannerPath = './assets/wallets.png';
        if (await fs.pathExists(walletsBannerPath)) {
            files.push(new AttachmentBuilder(walletsBannerPath, { name: 'wallets.png' }));
        }

        let messageContent = '';
        if (roleId) {
            messageContent = `<@&${roleId}>`;
            console.log(`[CSV_NOTIFY] Pinging role ${roleId} for ${listName}`);
        } else {
            console.log(`[CSV_NOTIFY] No role mapped for ${sourceKey} (${listName})`);
        }

        await notificationChannel.send({
            content: messageContent || undefined,
            embeds: [embed],
            files: files,
            allowedMentions: roleId ? { roles: [roleId] } : undefined
        });

        console.log(`[CSV_NOTIFY] Notification sent for ${normalizedFileName} (${action})`);
    } catch (error) {
        console.error('[CSV_NOTIFY] Error sending notification:', error);
    }
}

// ========================================
// GESTIONE PRESET - CHAIN SPECIFIC
// ========================================
async function saveUserPreset(userId, presetName, filters, chain) {
    try {
        const presetsPath = `./data/presets_${chain.toLowerCase()}`;
        await fs.ensureDir(presetsPath);

        const userPresetsFile = path.join(presetsPath, `${userId}.json`);
        
        let userPresets = {};
        if (await fs.pathExists(userPresetsFile)) {
            userPresets = await fs.readJson(userPresetsFile);
        }

        userPresets[presetName] = {
            name: presetName,
            filters: filters,
            chain: chain,
            createdAt: userPresets[presetName]?.createdAt || new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        await fs.writeJson(userPresetsFile, userPresets, { spaces: 2 });
        
        if (chain === 'BSC') {
            client.userPresetsBSC.set(userId, userPresets);
        } else {
            client.userPresetsSOL.set(userId, userPresets);
        }

        return true;
    } catch (error) {
        console.error('Error saving preset:', error);
        return false;
    }
}

async function loadUserPresets(userId, chain) {
    try {
        const presetsPath = `./data/presets_${chain.toLowerCase()}`;
        const userPresetsFile = path.join(presetsPath, `${userId}.json`);

        if (await fs.pathExists(userPresetsFile)) {
            const presets = await fs.readJson(userPresetsFile);
            if (chain === 'BSC') {
                client.userPresetsBSC.set(userId, presets);
            } else {
                client.userPresetsSOL.set(userId, presets);
            }
            return presets;
        }
        return {};
    } catch (error) {
        console.error('Error loading presets:', error);
        return {};
    }
}

async function deleteUserPreset(userId, presetName, chain) {
    try {
        const userPresets = await loadUserPresets(userId, chain);
        if (userPresets[presetName]) {
            delete userPresets[presetName];
            await fs.writeJson(`./data/presets_${chain.toLowerCase()}/${userId}.json`, userPresets, { spaces: 2 });
            if (chain === 'BSC') {
                client.userPresetsBSC.set(userId, userPresets);
            } else {
                client.userPresetsSOL.set(userId, userPresets);
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting preset:', error);
        return false;
    }
}