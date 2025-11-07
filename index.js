const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const ErrorHandler = require('./src/core/ErrorHandler');
const QueueManager = require('./src/core/QueueManager');
const SessionManager = require('./src/managers/SessionManager');
const CSVFileWatcher = require('./src/managers/CSVFileWatcher');
const LogService = require('./src/services/logService');
const PresetService = require('./src/services/presetService');
const NotificationService = require('./src/services/notificationService');
const handleButtonInteraction = require('./src/handlers/buttonHandler');
const handleSelectMenuInteraction = require('./src/handlers/selectMenuHandler');
const handleModalSubmit = require('./src/handlers/modalHandler');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
    restRequestTimeout: 30000,
    retryLimit: 3
});

const queueManager = new QueueManager();
const sessionManager = new SessionManager(client, queueManager);
const csvWatcher = new CSVFileWatcher('./data');
const logService = new LogService(client, process.env.LOG_CHANNEL_ID);
const presetService = new PresetService();
const notificationService = new NotificationService(client, '1415668627444731955');

global.discordClient = client;
global.queueManager = queueManager;
global.sessionManager = sessionManager;
global.presetService = presetService;

ErrorHandler.setClient(client);
ErrorHandler.setLogChannelId(process.env.LOG_CHANNEL_ID);
csvWatcher.setLogService(logService);

client.once('ready', async () => {
    console.log('✅ Bot Online:', client.user.tag);
    await csvWatcher.init();
    csvWatcher.on('csv-updated', (f) => notificationService.notifyListUpdate(f, 'updated'));
    csvWatcher.on('csv-added', (f) => notificationService.notifyListUpdate(f, 'added'));
    csvWatcher.on('csv-removed', (f) => notificationService.notifyListUpdate(f, 'removed'));
    await presetService.loadAllPresets();
    await client.application.commands.set([{ name: 'scan', description: '🔮 Start Casper Scanner - Multi-Chain Trading Analysis' }]);
    await logService.logToChannel(null, { title: '🚀 Scanner Started', description: 'Casper Scanner online!', color: '#00FF00' });
});

client.on('interactionCreate', async (interaction) => {
    await ErrorHandler.safeExecute(interaction.user.id, interaction.user.username, async () => {
        if (interaction.isCommand()) {
            if (interaction.commandName === 'scan') {
                const session = await sessionManager.getSession(interaction.user.id, interaction.channelId);
                await session.sendIntro(interaction);
            }
        } else {
            const session = await sessionManager.getSession(interaction.user.id, interaction.channelId);
            const deps = { sessionManager, logService, presetService, queueManager };
            if (interaction.isButton()) await handleButtonInteraction(interaction, session, deps);
            else if (interaction.isStringSelectMenu()) await handleSelectMenuInteraction(interaction, session, deps);
            else if (interaction.isModalSubmit()) await handleModalSubmit(interaction, session, deps);
        }
    }, interaction);
});

process.on('unhandledRejection', (e) => console.error('[ERROR]', e));
process.on('SIGINT', async () => { csvWatcher.stop(); await client.destroy(); process.exit(0); });

client.login(process.env.DISCORD_BOT_TOKEN).catch(e => { console.error('❌ Login failed:', e); process.exit(1); });
