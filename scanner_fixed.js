// ========================================
// CASPER | SCANNER - VERSIONE MONOLITICA CON FIX
// ========================================
const {
    Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, AttachmentBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType
} = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const Papa = require('papaparse');
const ExcelJS = require('exceljs');
const EventEmitter = require('events');
const crypto = require('crypto');
const chokidar = require('chokidar');
require('dotenv').config();

// ========================================
// ERROR ISOLATION WRAPPER
// ========================================
class ErrorHandler {
    static async safeExecute(userId, username, operation, interaction = null) {
        try {
            return await operation();
        } catch (error) {
            console.error(`[USER_ERROR] User ${username} (${userId}):`, error);

            if (error.code === 10062 || error.message?.includes('Unknown interaction')) {
                console.log(`[TIMEOUT] User ${username} had interaction timeout - not critical`);
                return null;
            }

            await this.logError(userId, username, error);

            if (interaction && !interaction.replied && !interaction.deferred) {
                try {
                    const errorEmbed = new EmbedBuilder()
                        .setTitle('❌ An Error Occurred')
                        .setDescription('We encountered an issue processing your request.\n\n' +
                            '**Please contact support by opening a ticket.**\n' +
                            'Error details have been logged for review.')
                        .setColor('#FF0000')
                        .setFooter({ text: 'Error ID: ' + Date.now() })
                        .setTimestamp();

                    await safeReply(interaction, {
                        embeds: [errorEmbed],
                        ephemeral: true
                    });
                } catch (e) {
                    console.error('Failed to notify user of error:', e);
                }
            }

            return null;
        }
    }

    static async logError(userId, username, error) {
        try {
            const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
            if (!logChannel) return;

            const errorEmbed = new EmbedBuilder()
                .setTitle('⚠️ User Error Logged')
                .setDescription(`User **${username}** (${userId}) encountered an error`)
                .addFields(
                    { name: '❌ Error Message', value: error.message.substring(0, 1024), inline: false },
                    { name: '📍 Stack Trace', value: `\`\`\`${error.stack?.substring(0, 500) || 'No stack trace'}\`\`\``, inline: false },
                    { name: '⏰ Time', value: new Date().toLocaleString('it-IT'), inline: true },
                    { name: '🆔 Error ID', value: Date.now().toString(), inline: true }
                )
                .setColor('#FF0000')
                .setTimestamp();

            await logChannel.send({ embeds: [errorEmbed] });
        } catch (e) {
            console.error('Failed to log error to channel:', e);
        }
    }
}

// ========================================
// INTERACTION VALIDATOR
// ========================================
class InteractionValidator {
    static isExpired(interaction) {
        const interactionTime = interaction.createdTimestamp;
        const currentTime = Date.now();
        const timeDiff = currentTime - interactionTime;

        if (!interaction.replied && !interaction.deferred) {
            return timeDiff > 2000;
        }

        if (interaction.deferred || interaction.replied) {
            return timeDiff > 14 * 60 * 1000;
        }

        return timeDiff > 14 * 60 * 1000;
    }

    static async canRespond(interaction) {
        if (this.isExpired(interaction)) {
            const age = Date.now() - interaction.createdTimestamp;
            console.log(`[INTERACTION] ⏱️ Expired: ${age}ms old`);

            if (interaction.channel) {
                try {
                    const expiredEmbed = new EmbedBuilder()
                        .setTitle('⏱️ Taking Your Time? No Problem!')
                        .setDescription('Discord has a time limit for interactions (3 seconds).\n\n' +
                            '**What happened:** You took a bit longer to respond, and Discord closed the connection.\n\n' +
                            '**Solution:** Just click the button again! Your progress is saved. 😊')
                        .setColor('#FFA500')
                        .addFields({
                            name: '💡 Tip for Next Time',
                            value: 'Try to click buttons within 2-3 seconds, or the scanner will ask "Are you still there?" after 5 minutes of inactivity.',
                            inline: false
                        })
                        .setTimestamp();

                    await interaction.channel.send({
                        content: `<@${interaction.user.id}>`,
                        embeds: [expiredEmbed]
                    });
                } catch (e) {
                    console.error('[INTERACTION] Failed to send expired notification:', e.message);
                }
            }

            return false;
        }
        return true;
    }

    static getAge(interaction) {
        return Date.now() - interaction.createdTimestamp;
    }

    static canShowModal(interaction) {
        const age = this.getAge(interaction);
        return age < 2500;
    }
}

// ========================================
// QUEUE MANAGER
// ========================================
class QueueManager extends EventEmitter {
    constructor() {
        super();
        this.queues = new Map();
        this.processing = new Map();
        this.rateLimits = new Map();
        this.maxConcurrent = 15;
        this.currentProcessing = 0;
        this.queueTimeout = 60000;
        this.rateLimit = 1000;
    }

    async addToQueue(userId, operation, priority = 0) {
        if (!this.queues.has(userId)) {
            this.queues.set(userId, []);
        }

        const queueItem = {
            operation,
            priority,
            timestamp: Date.now(),
            retries: 0,
            maxRetries: 3,
            id: `${userId}_${Date.now()}_${Math.random()}`
        };

        const queue = this.queues.get(userId);
        queue.push(queueItem);
        queue.sort((a, b) => b.priority - a.priority);

        setImmediate(() => this.processQueue(userId));

        return queueItem;
    }

    async processQueue(userId) {
        if (this.processing.get(userId)) return;
        if (this.currentProcessing >= this.maxConcurrent) {
            setTimeout(() => this.processQueue(userId), 500);
            return;
        }

        const lastProcess = this.rateLimits.get(userId) || 0;
        const timeSinceLastProcess = Date.now() - lastProcess;
        if (timeSinceLastProcess < this.rateLimit) {
            setTimeout(() => this.processQueue(userId), this.rateLimit - timeSinceLastProcess);
            return;
        }

        const queue = this.queues.get(userId);
        if (!queue || queue.length === 0) return;

        const queueItem = queue.shift();

        if (Date.now() - queueItem.timestamp > this.queueTimeout) {
            this.emit('timeout', { userId, item: queueItem });
            this.processQueue(userId);
            return;
        }

        this.processing.set(userId, true);
        this.currentProcessing++;
        this.rateLimits.set(userId, Date.now());

        try {
            await queueItem.operation();
            this.emit('success', { userId, item: queueItem });
        } catch (error) {
            console.error(`Queue error for user ${userId}:`, error);
            queueItem.retries++;

            if (queueItem.retries < queueItem.maxRetries) {
                setTimeout(() => {
                    queue.unshift(queueItem);
                    this.processQueue(userId);
                }, Math.pow(2, queueItem.retries) * 1000);
            } else {
                this.emit('error', { userId, item: queueItem, error });
            }
        } finally {
            this.processing.set(userId, false);
            this.currentProcessing--;
            setImmediate(() => this.processQueue(userId));
        }
    }

    getQueueSize(userId) {
        return this.queues.get(userId)?.length || 0;
    }

    getTotalQueued() {
        let total = 0;
        for (const queue of this.queues.values()) {
            total += queue.length;
        }
        return total;
    }

    clearUserQueue(userId) {
        this.queues.delete(userId);
        this.processing.delete(userId);
        this.rateLimits.delete(userId);
    }
}

// ========================================
// CSV FILE WATCHER
// ========================================
class CSVFileWatcher extends EventEmitter {
    constructor() {
        super();
        this.dataPath = './data';
        this.fileHashes = new Map();
        this.watcher = null;
        this.checkInterval = null;
    }

    async init() {
        await fs.ensureDir(this.dataPath);
        await this.loadInitialHashes();
        this.startWatching();
        this.startPeriodicCheck();
        console.log('📁 CSV File Watcher initialized');
    }

    async loadInitialHashes() {
        const files = await fs.readdir(this.dataPath);
        for (const file of files) {
            if (file.endsWith('.csv') || file.endsWith('.txt')) {
                const filePath = path.join(this.dataPath, file);
                const hash = await this.getFileHash(filePath);
                this.fileHashes.set(file, hash);
                console.log(`[DEBUG] Initial hash for ${file}: ${hash?.substring(0, 8)}`);
            }
        }
    }

    async getFileHash(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf-8');
            const hash = crypto.createHash('md5')
                .update(content)
                .update(stats.mtime.toISOString())
                .digest('hex');
            return hash;
        } catch (error) {
            return null;
        }
    }

    startWatching() {
        this.watcher = chokidar.watch([
            path.join(this.dataPath, '*.csv'),
            path.join(this.dataPath, '*.txt')
        ], {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        this.watcher.on('add', async (filePath) => {
            const fileName = path.basename(filePath);
            console.log(`[CSV_UPDATE] 📄 New file detected: ${fileName}`);
            await logToChannel(null, {
                title: '📄 CSV Update',
                description: `New file detected: **${fileName}**`,
                color: '#00FFFF'
            });
            this.emit('csv-added', fileName);
            await this.updateFileHash(fileName);
        });

        this.watcher.on('change', async (filePath) => {
            const fileName = path.basename(filePath);
            const oldHash = this.fileHashes.get(fileName);
            const newHash = await this.getFileHash(filePath);

            if (oldHash !== newHash) {
                console.log(`[CSV_UPDATE] 📝 File updated: ${fileName}`);
                await logToChannel(null, {
                    title: '📝 CSV Update',
                    description: `File updated: **${fileName}**`,
                    fields: [
                        { name: 'Old Hash', value: oldHash?.substring(0, 8) || 'N/A', inline: true },
                        { name: 'New Hash', value: newHash?.substring(0, 8) || 'N/A', inline: true }
                    ],
                    color: '#00FFFF'
                });
                this.emit('csv-updated', fileName);
                this.fileHashes.set(fileName, newHash);
            }
        });

        this.watcher.on('unlink', async (filePath) => {
            const fileName = path.basename(filePath);
            console.log(`[CSV_UPDATE] 🗑️ File removed: ${fileName}`);
            await logToChannel(null, {
                title: '🗑️ CSV Removed',
                description: `File removed: **${fileName}**`,
                color: '#FF0000'
            });
            this.emit('csv-removed', fileName);
            this.fileHashes.delete(fileName);
        });
    }

    startPeriodicCheck() {
        this.checkInterval = setInterval(async () => {
            await this.checkAllFiles();
        }, 600000);
    }

    async checkAllFiles() {
        console.log('[DEBUG] 🔍 Performing periodic CSV check');
        const files = await fs.readdir(this.dataPath);
        const csvFiles = files.filter(f => f.endsWith('.csv') || f.endsWith('.txt'));
        let changedCount = 0;

        for (const file of csvFiles) {
            const filePath = path.join(this.dataPath, file);
            const currentHash = await this.getFileHash(filePath);
            const storedHash = this.fileHashes.get(file);

            if (currentHash !== storedHash) {
                changedCount++;
                console.log(`[CSV_UPDATE] 📝 Detected change in ${file} during periodic check`);
                this.emit('csv-updated', file);
                this.fileHashes.set(file, currentHash);
            }
        }

        if (changedCount > 0) {
            console.log(`[INFO] ✅ Periodic check complete: ${changedCount} files updated`);
            await logToChannel(null, {
                title: '🔍 Periodic Check Complete',
                description: `Updated ${changedCount} files`,
                color: '#00FF00'
            });
        }
    }

    async updateFileHash(fileName) {
        const filePath = path.join(this.dataPath, fileName);
        const hash = await this.getFileHash(filePath);
        this.fileHashes.set(fileName, hash);
    }

    stop() {
        if (this.watcher) {
            this.watcher.close();
        }
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        console.log('[INFO] 🛑 CSV File Watcher stopped');
    }
}

// ========================================
// SESSION MANAGER
// ========================================
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.locks = new Map();
        this.activityTimers = new Map();
        this.maxSessionAge = 30 * 60 * 1000;
        this.inactivityWarning = 5 * 60 * 1000;
        setInterval(() => this.cleanup(), 2 * 60 * 1000);
    }

    async getSession(userId, channelId = null) {
        while (this.locks.get(userId)) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        let session = this.sessions.get(userId);
        if (!session) {
            session = new ScannerSession(userId, channelId);
            this.sessions.set(userId, session);
        }

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

    resetActivityTimer(userId, channelId) {
        if (this.activityTimers.has(userId)) {
            clearTimeout(this.activityTimers.get(userId));
        }

        const timer = setTimeout(async () => {
            await this.sendActivityCheck(userId, channelId);
        }, this.inactivityWarning);

        this.activityTimers.set(userId, timer);
    }

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
            const channel = await client.channels.fetch(channelId);
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

        if (session?.exportSessionTimer) {
            clearTimeout(session.exportSessionTimer);
            session.exportSessionTimer = null;
            console.log(`[SESSION] Cleared export timer for user ${userId}`);
        }

        this.sessions.delete(userId);
        this.locks.delete(userId);
        queueManager.clearUserQueue(userId);

        console.log(`[SESSION] Deleted session for user ${userId}`);
    }
}

// ========================================
// INIZIALIZZAZIONE
// ========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],
    partials: ['CHANNEL'], // Required for DMs
    restRequestTimeout: 30000,
    retryLimit: 3
});

const queueManager = new QueueManager();
const sessionManager = new SessionManager();
const csvWatcher = new CSVFileWatcher();

client.userPresetsSOL = new Map();
client.userPresetsBSC = new Map();

const EMBED_COLOR = '#71ff9e';
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const BRAND_COLORS = {
    PRIMARY: 'FF71FF9E',
    SECONDARY: 'FF1A2332',
    TEXT: 'FFFFFFFF',
    SUBTEXT: 'FFB0B0B0',
    PROFIT: 'FF00FF88',
    LOSS: 'FFFF4444',
    HEADER: 'FF2D3E50',
    DARK_BACKGROUND: 'FF01080C',
    DARK_ALT: 'FF0D1218',
    HYPERLINK: 'FF60A5FA'
};

const BRAND_ASSETS = {
    logo: './assets/logo.png',
    banner: './assets/banner.png',
    footer: 'Casper | CT',
    footerLogo: './assets/logos.png'
};

// ========================================
// ROLE MAPPING & DATA SOURCES
// ========================================
const LIST_ROLE_MAPPING = {
    'bonk': '1428836143834726551',
    'pumpfun': '1428836081658499083',
    'trending': '1428836723852312728',
    'meteora': '1428836114755747951',
    'moonit': '1428836696321036539',
    'jupiter': '1428836483422224594',
    'trending_bsc': '1428836752017330310',
    'fourmeme': '1428836796141277214',
    'flap': '1428836774846795898',
    'xmode': '1428877533180592219'
};

const DATA_SOURCES = {
    'SOL': {
        'bonk': { name: 'Bonk', description: 'Bonk ecosystem analysis', file: 'bonk.csv', icon: '🐕' },
        'pumpfun': { name: 'PumpFun', description: 'PumpFun platform analysis', file: 'pumpfun.csv', icon: '🚀' },
        'trending': { name: 'Trending', description: 'Trending wallets analysis', file: 'trending.csv', icon: '📈' },
        'trendfun': { name: 'TrendFun', description: 'TrendFun platform analysis', file: 'trendfun.csv', icon: '🎨' },
        'boop': { name: 'Boop', description: 'Boop platform analysis', file: 'boop.csv', icon: '🎯' },
        'believe': { name: 'Believe', description: 'Believe platform analysis', file: 'believe.csv', icon: '✨' },
        'launchlab': { name: 'LaunchLab', description: 'LaunchLab platform analysis', file: 'launchlab.csv', icon: '🚀' },
        'heaven': { name: 'Heaven', description: 'Heaven platform analysis', file: 'heaven.csv', icon: '☁️' },
        'moonit': { name: 'MoonIt', description: 'MoonIt platform analysis', file: 'moonit.csv', icon: '🌙' },
        'meteora': { name: 'Meteora', description: 'Meteora DEX analysis', file: 'meteora.csv', icon: '💫' },
        'jupiter': { name: 'Jupiter', description: 'Jupiter aggregator analysis', file: 'jupiter.csv', icon: '🪐' }
    },
    'BSC': {
        'trending_bsc': {
            name: 'Trending BSC',
            description: 'Trending BSC wallets',
            file: 'trending_bsc.csv',
            icon: '📈'
        },
        'fourmeme': {
            name: 'FourMeme',
            description: 'FourMeme platform analysis',
            file: 'fourmeme_bsc.csv',
            icon: '4️⃣'
        },
        'flap': {
            name: 'Flap',
            description: 'Flap platform analysis',
            file: 'flap_bsc.csv',
            icon: '🦅'
        },
        'xmode': {
            name: 'Xmode',
            description: 'Xmode Smart Chain traders',
            file: 'xmode_bsc.csv',
            icon: '⚡'
        }
    }
};

// ========================================
// METRICS SYSTEM - CHAIN SPECIFIC
// ========================================
const METRICS_SYSTEM_SOL = {
    'profit_loss': {
        label: '💰 Profit & Loss',
        emoji: '💰',
        description: 'Profit and loss metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'realized_profit', label: 'Realized Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 },
            { id: 'unrealized_profit_total', label: 'Unrealized Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 },
            { id: 'realized_profit_pct', label: 'Realized Profit %', unit: '%', defaultMin: -100, defaultMax: 10000 },
            { id: 'total_profit', label: 'Total Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 },
            { id: 'total_profit_pct', label: 'Total Profit %', unit: '%', defaultMin: -100, defaultMax: 10000 }
        ]
    },
    'pnl_distribution': {
        label: '📊 PnL Distribution',
        emoji: '📊',
        description: 'Profit distribution across tokens',
        supportsPeriod: true,
        metrics: [
            { id: 'pnl_lt_minus50', label: 'Heavy Loss (<-50%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_minus50_0', label: 'Loss (-50% to 0%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_0_2x', label: 'Profit (0% to 2x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_2x_5x', label: 'Good Profit (2x-5x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_gt_5x', label: 'Great Profit (>5x)', unit: '#', defaultMin: 0, defaultMax: 1000 }
        ]
    },
    'marketcap': {
        label: '🎯 Market Cap Trading',
        emoji: '🎯',
        description: 'Trading by market cap size',
        supportsPeriod: true,
        metrics: [
            { id: 'mcap_gt_500k', label: 'Large Cap (>500k)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'mcap_100k_500k', label: 'Mid Cap (100k-500k)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'mcap_lt_100k', label: 'Small Cap (<100k)', unit: '#', defaultMin: 0, defaultMax: 1000 }
        ]
    },
    'trading_activity': {
        label: '📈 Trading Activity',
        emoji: '📈',
        description: 'Trading patterns and frequency',
        supportsPeriod: true,
        metrics: [
            { id: 'buy', label: 'Buy Count', unit: '#', defaultMin: 0, defaultMax: 10000 },
            { id: 'sell', label: 'Sell Count', unit: '#', defaultMin: 0, defaultMax: 10000 },
            { id: 'trades', label: 'Total Trades', unit: '#', defaultMin: 0, defaultMax: 20000 },
            { id: 'unique_tokens', label: 'Unique Tokens', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'avg_buy_per_token', label: 'Avg Buy per Token', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'avg_sell_per_token', label: 'Avg Sell per Token', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'avg_holding_period_min', label: 'Avg Hold Time (minutes)', unit: 'min', defaultMin: 0, defaultMax: 10000 },
            { id: 'transfer_in', label: 'Transfers In', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'transfer_out', label: 'Transfers Out', unit: '#', defaultMin: 0, defaultMax: 1000 }
        ]
    },
    'performance': {
        label: '🏆 Performance',
        emoji: '🏆',
        description: 'Success metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'winrate', label: 'Win Rate', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'token_active', label: 'Active Tokens', unit: '#', defaultMin: 0, defaultMax: 100 }
        ]
    },
    'volume': {
        label: '💹 Volume & Liquidity',
        emoji: '💹',
        description: 'Trading volumes',
        supportsPeriod: true,
        metrics: [
            { id: 'total_volume', label: 'Total Volume', unit: '$', defaultMin: 0, defaultMax: 10000000 },
            { id: 'total_bought_cost', label: 'Total Bought', unit: '$', defaultMin: 0, defaultMax: 10000000 },
            { id: 'total_sold_income', label: 'Total Sold', unit: '$', defaultMin: 0, defaultMax: 10000000 },
            { id: 'avg_buy_cost', label: 'Avg Buy Cost', unit: '$', defaultMin: 0, defaultMax: 100000 },
            { id: 'avg_sell_cost', label: 'Avg Sell Cost', unit: '$', defaultMin: 0, defaultMax: 100000 }
        ]
    },
    'risk': {
        label: '⚡ Risk Indicators',
        emoji: '⚡',
        description: 'Risk metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'quick_trades', label: 'Quick Trade Count', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'quick_trades_ratio', label: 'Quick Trade %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'honeypot_tokens', label: 'Honeypot Tokens', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'honeypot_ratio', label: 'Honeypot %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'no_buy_hold', label: 'No Buy Hold', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'no_buy_hold_ratio', label: 'No Buy Hold %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'sell_pass_buy', label: 'Sell > Buy', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'sell_pass_buy_ratio', label: 'Sell > Buy %', unit: '%', defaultMin: 0, defaultMax: 100 }
        ]
    },
    'fees': {
        label: '💸 Fees',
        emoji: '💸',
        description: 'Transaction costs',
        supportsPeriod: true,
        metrics: [
            { id: 'total_fee_usd', label: 'Total Fees', unit: '$', defaultMin: 0, defaultMax: 10000 }
        ]
    },
    'wallet_info': {
        label: '💎 Wallet Info',
        emoji: '💎',
        description: 'Wallet balance and information',
        supportsPeriod: false,
        metrics: [
            { id: 'sol_balance', label: 'SOL Balance', unit: 'SOL', defaultMin: 0, defaultMax: 10000 },
            { id: 'bundler', label: 'Is Bundler', unit: 'BOOL', defaultMin: 0, defaultMax: 1 }
        ]
    }
};

const METRICS_SYSTEM_BSC = {
    'profit_loss': {
        label: '💰 Profit & Loss',
        emoji: '💰',
        description: 'Profit and loss metrics',
        supportsPeriod: false,
        metrics: [
            { id: 'total_profit', label: 'Total Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 },
            { id: 'total_profit_pct', label: 'Total Profit %', unit: '%', defaultMin: -100, defaultMax: 10000 },
            { id: 'unrealized_profit_total', label: 'Unrealized Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 }
        ]
    },
    'historic_pnl': {
        label: '📊 Historic PnL Distribution',
        emoji: '📊',
        description: 'Historic profit distribution',
        supportsPeriod: false,
        metrics: [
            { id: 'historic_pnl_lt_minus50', label: 'Heavy Loss (<-50%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'historic_pnl_minus50_0', label: 'Loss (-50% to 0%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'historic_pnl_0_2x', label: 'Profit (0% to 2x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'historic_pnl_2x_5x', label: 'Good Profit (2x-5x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'historic_pnl_gt_5x', label: 'Great Profit (>5x)', unit: '#', defaultMin: 0, defaultMax: 1000 }
        ]
    },
    'period_metrics': {
        label: '📅 Period Metrics',
        emoji: '📅',
        description: 'Time-based metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'realized_profit', label: 'Realized Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 },
            { id: 'realized_profit_pct', label: 'Realized Profit %', unit: '%', defaultMin: -100, defaultMax: 10000 },
            { id: 'pnl_lt_nd5', label: 'Heavy Loss (<-50%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_nd5_0x', label: 'Loss (-50% to 0%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_0_2x', label: 'Profit (0% to 2x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_2x_5x', label: 'Good Profit (2x-5x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_gt_5x', label: 'Great Profit (>5x)', unit: '#', defaultMin: 0, defaultMax: 1000 }
        ]
    },
    'trading_activity': {
        label: '📈 Trading Activity',
        emoji: '📈',
        description: 'Trading patterns',
        supportsPeriod: true,
        metrics: [
            { id: 'buy', label: 'Buy Count', unit: '#', defaultMin: 0, defaultMax: 10000 },
            { id: 'sell', label: 'Sell Count', unit: '#', defaultMin: 0, defaultMax: 10000 },
            { id: 'trades', label: 'Total Trades', unit: '#', defaultMin: 0, defaultMax: 20000 },
            { id: 'unique_tokens', label: 'Unique Tokens', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'avg_buy_per_token', label: 'Avg Buy per Token', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'avg_sell_per_token', label: 'Avg Sell per Token', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'avg_buy_cost', label: 'Avg Buy Cost', unit: '$', defaultMin: 0, defaultMax: 100000 },
            { id: 'avg_sell_cost', label: 'Avg Sell Cost', unit: '$', defaultMin: 0, defaultMax: 100000 }
        ]
    },
    'performance': {
        label: '🏆 Performance',
        emoji: '🏆',
        description: 'Success metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'winrate', label: 'Win Rate', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'token_active', label: 'Active Tokens', unit: '#', defaultMin: 0, defaultMax: 100 }
        ]
    },
    'volume': {
        label: '💹 Volume',
        emoji: '💹',
        description: 'Trading volumes',
        supportsPeriod: true,
        metrics: [
            { id: 'total_volume', label: 'Total Volume', unit: '$', defaultMin: 0, defaultMax: 10000000 },
            { id: 'total_bought_cost', label: 'Total Bought', unit: '$', defaultMin: 0, defaultMax: 10000000 },
            { id: 'total_sold_income', label: 'Total Sold', unit: '$', defaultMin: 0, defaultMax: 10000000 }
        ]
    },
    'risk': {
        label: '⚡ Risk Indicators',
        emoji: '⚡',
        description: 'Risk metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'quick_trades', label: 'Quick Trade Count', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'quick_trades_ratio', label: 'Quick Trade %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'honeypot_tokens', label: 'Honeypot Tokens', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'honeypot_ratio', label: 'Honeypot %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'no_buy_hold_ratio', label: 'No Buy Hold %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'sell_pass_buy_ratio', label: 'Sell > Buy %', unit: '%', defaultMin: 0, defaultMax: 100 }
        ]
    },
    'fees': {
        label: '💸 Fees',
        emoji: '💸',
        description: 'Transaction costs',
        supportsPeriod: true,
        metrics: [
            { id: 'total_fee_usd', label: 'Total Fees', unit: '$', defaultMin: 0, defaultMax: 10000 }
        ]
    },
    'wallet_info': {
        label: '💎 Wallet Info',
        emoji: '💎',
        description: 'Wallet balance',
        supportsPeriod: false,
        metrics: [
            { id: 'bnb_balance', label: 'BNB Balance', unit: 'BNB', defaultMin: 0, defaultMax: 10000 },
            { id: 'bundler', label: 'Is Bundler', unit: 'BOOL', defaultMin: 0, defaultMax: 1 }
        ]
    },
    'historic_info': {
        label: '📚 Historic Info',
        emoji: '📚',
        description: 'Historic metrics',
        supportsPeriod: false,
        metrics: [
            { id: 'winrate_historic', label: 'Historic Win Rate', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'historic_unique_tokens', label: 'Historic Tokens', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'historic_token_active', label: 'Historic Active', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'historic_avg_holding_period_min', label: 'Historic Hold Time (min)', unit: 'min', defaultMin: 0, defaultMax: 10000 },
            { id: 'historic_no_buy_hold', label: 'Historic No Buy Hold', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'historic_sell_pass_buy', label: 'Historic Sell > Buy', unit: '#', defaultMin: 0, defaultMax: 100 }
        ]
    }
};

const TIME_PERIODS = ['1d', '7d', '30d'];

// ========================================
// FILTER BUILDER CLASS
// ========================================
class FilterBuilder {
    constructor() {
        this.selectedFilters = [];
        this.pendingFilters = [];
        this.tempSelectedMetrics = [];
        this.tempCategory = null;
        this.chain = null;
        this.multipleFiltersQueue = [];
        this.currentFilterIndex = 0;
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

    getNextFilterToConfig() {
        if (this.currentFilterIndex < this.multipleFiltersQueue.length) {
            return this.multipleFiltersQueue[this.currentFilterIndex];
        }
        return null;
    }

    moveToNextFilter() {
        this.currentFilterIndex++;
        return this.currentFilterIndex < this.multipleFiltersQueue.length;
    }

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
        this.clearFilterQueue();
    }

    clear() {
        this.selectedFilters = [];
        this.pendingFilters = [];
        this.tempSelectedMetrics = [];
        this.tempCategory = null;
        this.clearFilterQueue();
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

// Continue nella parte 2...
