// ========================================
// SESSION MANAGER - User Session Management with Activity Check
// ========================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class SessionManager {
    constructor(client, queueManager) {
        this.sessions = new Map();
        this.locks = new Map();
        this.activityTimers = new Map();
        this.maxSessionAge = 30 * 60 * 1000;
        this.inactivityWarning = 5 * 60 * 1000; // Warning dopo 5 minuti
        this.client = client;
        this.queueManager = queueManager;

        // Cleanup periodico ogni 2 minuti
        setInterval(() => this.cleanup(), 2 * 60 * 1000);
    }

    async getSession(userId, channelId = null) {
        while (this.locks.get(userId)) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        let session = this.sessions.get(userId);
        if (!session) {
            // Dinamicamente importa ScannerSession per evitare circular dependency
            const ScannerSession = require('../models/ScannerSession');
            session = new ScannerSession(userId, channelId);
            this.sessions.set(userId, session);
        }

        // Aggiorna lastInteraction e reset activity timer
        session.lastInteraction = Date.now();
        this.resetActivityTimer(userId, channelId);

        return session;
    }

    async withLock(userId, operation) {
        this.locks.set(userId, true);
        try {
            return await operation();
        } finally {
            this.locks.delete(userId);
        }
    }

    // Reset activity timer
    resetActivityTimer(userId, channelId) {
        if (this.activityTimers.has(userId)) {
            clearTimeout(this.activityTimers.get(userId));
        }

        const timer = setTimeout(async () => {
            await this.sendActivityCheck(userId, channelId);
        }, this.inactivityWarning);

        this.activityTimers.set(userId, timer);
    }

    // Invia activity check
    async sendActivityCheck(userId, channelId) {
        const session = this.sessions.get(userId);
        if (!session) return;

        const timeSinceLastInteraction = Date.now() - session.lastInteraction;

        if (timeSinceLastInteraction < this.inactivityWarning - 10000) {
            console.log(`[ACTIVITY_CHECK] User ${userId} recently active, skipping`);
            return;
        }

        console.log(`[ACTIVITY_CHECK] Sending to user ${userId}`);

        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setTitle('⏰ Are You Still There?')
                .setDescription('Your scanner session has been inactive for 5 minutes.\n\n' +
                    '**Click "Yes" within 60 seconds to continue**, or your session will be closed automatically.')
                .setColor('#FFA500')
                .setFooter({ text: 'Session will expire in 60 seconds...' })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('activity_check_yes')
                        .setLabel('✅ Yes, I\'m Here')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('👋'),
                    new ButtonBuilder()
                        .setCustomId('activity_check_end')
                        .setLabel('❌ End Session')
                        .setStyle(ButtonStyle.Danger)
                );

            const message = await channel.send({
                content: `<@${userId}>`,
                embeds: [embed],
                components: [row]
            });

            const cleanupTimer = setTimeout(() => {
                this.deleteSession(userId);

                message.edit({
                    content: `<@${userId}> ⏱️ **Session Expired**`,
                    embeds: [new EmbedBuilder()
                        .setTitle('❌ Session Closed')
                        .setDescription('Your scanner session has been closed due to inactivity.\n\n' +
                            'Run `/scan` to start a new session.')
                        .setColor('#FF0000')
                        .setTimestamp()],
                    components: []
                }).catch(() => {});

                console.log(`[ACTIVITY_CHECK] Session closed for user ${userId}`);
            }, 60000);

            session.activityCheckTimer = cleanupTimer;

        } catch (error) {
            console.error('[ACTIVITY_CHECK] Error:', error);
        }
    }

    cleanup() {
        const now = Date.now();
        for (const [userId, session] of this.sessions.entries()) {
            if (now - session.lastInteraction > this.maxSessionAge) {
                console.log(`[CLEANUP] Removing expired session for user ${userId}`);
                this.deleteSession(userId);
            }
        }
    }

    deleteSession(userId) {
        if (this.activityTimers.has(userId)) {
            clearTimeout(this.activityTimers.get(userId));
            this.activityTimers.delete(userId);
        }

        const session = this.sessions.get(userId);
        if (session?.activityCheckTimer) {
            clearTimeout(session.activityCheckTimer);
        }

        // Pulisci export timer
        if (session?.exportSessionTimer) {
            clearTimeout(session.exportSessionTimer);
            session.exportSessionTimer = null;
            console.log(`[SESSION] Cleared export timer for user ${userId}`);
        }

        this.sessions.delete(userId);
        this.locks.delete(userId);

        if (this.queueManager) {
            this.queueManager.clearUserQueue(userId);
        }

        console.log(`[SESSION] Deleted session for user ${userId}`);
    }
}

module.exports = SessionManager;
