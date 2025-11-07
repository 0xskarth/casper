// ========================================
// NOTIFICATION SERVICE
// ========================================
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs-extra');
const { DATA_SOURCES } = require('../config/dataSources');
const { LIST_ROLE_MAPPING } = require('../config/constants');
const { normalizeBSCFileName } = require('../utils/fileHelper');
const { logToChannel } = require('../utils/logger');

async function notifyListUpdate(client, fileName, action = 'updated') {
    const NOTIFICATION_CHANNEL_ID = process.env.SHARE_CHANNEL_ID || '1385891707459211264';
    
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

        // Trova il source corrispondente
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

        const config = embedConfig[action] || { title: '📝 List Changed', color: '#71ff9e' };

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

module.exports = {
    notifyListUpdate
};