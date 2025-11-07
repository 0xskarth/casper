// ========================================
// LOGGER UTILITIES
// ========================================
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs-extra');
const { BRAND_ASSETS } = require('../config/constants');

async function logToChannel(client, content, embedData = null) {
    try {
        const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
        const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) return;

        if (embedData) {
            const embed = new EmbedBuilder()
                .setTitle(embedData.title || '📊 Scanner Log')
                .setDescription(embedData.description || content)
                .setColor(embedData.color || '#71ff9e')
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

async function logPresetUsage(client, userId, username, presetName, filters, chain) {
    const { getParameterInfo } = require('./parameterInfo');
    
    const filterDetails = filters.slice(0, 10).map(f => {
        const paramInfo = getParameterInfo(f.filterKey || f.id, chain);
        return `• **${f.label}**: ${f.min || paramInfo.min}-${f.max || paramInfo.max} ${paramInfo.unit}`;
    }).join('\n');

    await logToChannel(client, null, {
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

async function logAnalysisResults(client, userId, username, chain, sources, filters, resultCount, debugInfo = null) {
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

    await logToChannel(client, null, {
        title: `📈 ${chain} Analysis Completed`,
        description: `User **${username}** completed ${chain} analysis`,
        fields: fieldsToLog,
        color: '#71ff9e'
    });
}

async function logFilterEdit(client, userId, username, chain, action) {
    await logToChannel(client, null, {
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

module.exports = {
    logToChannel,
    logPresetUsage,
    logAnalysisResults,
    logFilterEdit
};