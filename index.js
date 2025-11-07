// ========================================
// CASPER | SCANNER - MODULAR ENTRY POINT
// ========================================
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

// Import managers
const SessionManager = require('./managers/SessionManager');
const QueueManager = require('./managers/QueueManager');
const CSVFileWatcher = require('./managers/CSVFileWatcher');
const ErrorHandler = require('./managers/ErrorHandler');

// Import services
const { notifyListUpdate } = require('./services/notificationService');
const { logToChannel } = require('./utils/logger');

// ========================================
// CLIENT INITIALIZATION
// ========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],
    partials: ['CHANNEL'], // ✅ Required for DM support
    restRequestTimeout: 30000,
    retryLimit: 3
});

// ========================================
// GLOBAL MANAGERS
// ========================================
const sessionManager = new SessionManager(client);
const queueManager = new QueueManager();
const csvWatcher = new CSVFileWatcher();

// Attach to client for global access
client.sessionManager = sessionManager;
client.queueManager = queueManager;
client.csvWatcher = csvWatcher;
client.userPresetsSOL = new Map();
client.userPresetsBSC = new Map();

// ========================================
// LOAD EVENTS
// ========================================
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// ========================================
// CSV WATCHER EVENTS
// ========================================
csvWatcher.on('csv-updated', (fileName) => {
    notifyListUpdate(client, fileName, 'updated');
});

csvWatcher.on('csv-added', (fileName) => {
    notifyListUpdate(client, fileName, 'added');
});

csvWatcher.on('csv-removed', (fileName) => {
    notifyListUpdate(client, fileName, 'removed');
});

// ========================================
// ERROR HANDLING
// ========================================
process.on('unhandledRejection', (error) => {
    console.error('[UNHANDLED_REJECTION]', error);
    ErrorHandler.logError(client, 'SYSTEM', 'SYSTEM', error);
});

process.on('uncaughtException', (error) => {
    console.error('[UNCAUGHT_EXCEPTION]', error);
    ErrorHandler.logError(client, 'SYSTEM', 'SYSTEM', error);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Shutting down gracefully...');
    
    csvWatcher.stop();
    sessionManager.cleanup();
    await client.destroy();
    
    console.log('[SHUTDOWN] ✅ Shutdown complete');
    process.exit(0);
});

// ========================================
// LOGIN
// ========================================
client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});

module.exports = { client, sessionManager, queueManager, csvWatcher };