# File Rimanenti da Creare Manualmente

Mancano solo 2 file per completare l'architettura al 100%:

## 1. src/handlers/buttonHandler.js

```javascript
// Copia TUTTO il codice della funzione handleButtonInteraction dal file monolitico
// La funzione inizia con "async function handleButtonInteraction"
// Include tutti i 30+ cases dello switch

const InteractionValidator = require('../core/InteractionValidator');
const { safeReply, safeUpdate } = require('../utils/interactionUtils');
const { EmbedBuilder } = require('discord.js');

async function handleButtonInteraction(interaction, session, dependencies) {
    const { sessionManager, logService, presetService, queueManager } = dependencies;
    const customId = interaction.customId;

    // TIMEOUT CHECK
    const interactionAge = Date.now() - interaction.createdTimestamp;
    if (interactionAge > 2800) {
        console.log(`[TIMEOUT_SKIP] ⏱️ Interaction ${interactionAge}ms old`);
        try {
            if (!interaction.replied && !interaction.deferred) {
                if (interaction.isModalSubmit()) {
                    if (interaction.channel) {
                        const embed = new EmbedBuilder()
                            .setTitle('⏱️ Configuration Took Too Long')
                            .setDescription('Discord closed the connection...')
                            .setColor('#FFA500');
                        await interaction.channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed] });
                    }
                } else {
                    await interaction.reply({ content: '⏱️ **Timeout** - Please click again!', ephemeral: true });
                }
            }
        } catch (e) { console.log('[TIMEOUT_SKIP] Could not reply:', e.message); }
        return;
    }

    // RESET INATTIVITÀ
    if (!await InteractionValidator.canRespond(interaction)) return;
    session.resetInactivity();
    sessionManager.resetActivityTimer(session.userId, session.channelId);

    // COPIA TUTTO LO SWITCH DAL FILE MONOLITICO (linea ~1800 circa)
    // Inizia da:  switch (customId) {
    // Include: chain_sol, chain_bsc, start_filter_setup, back_to_*, view_filters,
    //          remove_filters, configure_selected, proceed_to_sources, export_*,
    //          save_preset, load_preset, edit_*_from_results, activity_check_*, etc.
    // Termina con: default case per preset dinamici
}

// COPIA LE FUNZIONI HELPER:
async function showFilterSummary(interaction, session) { /* ... dal monolitico */ }
async function configureSelectedFilters(interaction, session) { /* ... dal monolitico */ }
async function loadPreset(interaction, session, presetName, presetService, logService) { /* ... */ }
async function deletePreset(interaction, session, presetName, presetService) { /* ... */ }

module.exports = handleButtonInteraction;
```

**SOLUZIONE RAPIDA**: Cerca nel file monolitico "async function handleButtonInteraction" e copia l'intera funzione + le helper functions in fondo al file.

---

## 2. index.js (root)

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// Core
const ErrorHandler = require('./src/core/ErrorHandler');
const QueueManager = require('./src/core/QueueManager');

// Managers
const SessionManager = require('./src/managers/SessionManager');
const CSVFileWatcher = require('./src/managers/CSVFileWatcher');

// Services
const LogService = require('./src/services/logService');
const PresetService = require('./src/services/presetService');
const NotificationService = require('./src/services/notificationService');

// Handlers
const handleButtonInteraction = require('./src/handlers/buttonHandler');
const handleSelectMenuInteraction = require('./src/handlers/selectMenuHandler');
const handleModalSubmit = require('./src/handlers/modalHandler');

// Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    restRequestTimeout: 30000,
    retryLimit: 3
});

// Inizializza servizi
const queueManager = new QueueManager();
const sessionManager = new SessionManager(client, queueManager);
const csvWatcher = new CSVFileWatcher('./data');
const logService = new LogService(client, process.env.LOG_CHANNEL_ID);
const presetService = new PresetService();
const notificationService = new NotificationService(client, '1415668627444731955');

// Setup globali per evitare circular dependencies
global.discordClient = client;
global.queueManager = queueManager;
global.sessionManager = sessionManager;
global.presetService = presetService;

// Configura ErrorHandler
ErrorHandler.setClient(client);
ErrorHandler.setLogChannelId(process.env.LOG_CHANNEL_ID);

// Configura CSV Watcher
csvWatcher.setLogService(logService);

// Ready event
client.once('ready', async () => {
    console.log(`
╔════════════════════════════════════════╗
║         🔮 CASPER SCANNER              ║
╠════════════════════════════════════════╣
║  ✅ Bot Online: ${client.user.tag.padEnd(22)}║
║  📊 Guilds: ${client.guilds.cache.size.toString().padEnd(27)}║
║  👥 Users: ${client.users.cache.size.toString().padEnd(28)}║
║  ⚡ Chains: SOL & BSC                  ║
╚════════════════════════════════════════╝
    `);

    await csvWatcher.init();

    csvWatcher.on('csv-updated', (fileName) => notificationService.notifyListUpdate(fileName, 'updated'));
    csvWatcher.on('csv-added', (fileName) => notificationService.notifyListUpdate(fileName, 'added'));
    csvWatcher.on('csv-removed', (fileName) => notificationService.notifyListUpdate(fileName, 'removed'));

    await presetService.loadAllPresets();

    await client.application.commands.set([{
        name: 'scan',
        description: '🔮 Start Casper Scanner - Multi-Chain Trading Analysis'
    }]);

    await logService.logToChannel(null, {
        title: '🚀 Scanner Started',
        description: 'Casper Scanner is now online!',
        fields: [
            { name: '⛓️ Chains', value: 'SOL & BSC', inline: true },
            { name: '📊 SOL Sources', value: '11', inline: true },
            { name: '📊 BSC Sources', value: '4', inline: true }
        ],
        color: '#00FF00'
    });
});

// Interaction event
client.on('interactionCreate', async (interaction) => {
    const userId = interaction.user.id;
    const username = interaction.user.username;

    await ErrorHandler.safeExecute(userId, username, async () => {
        if (interaction.isCommand()) {
            if (interaction.commandName === 'scan') {
                const session = await sessionManager.getSession(userId, interaction.channelId);
                await session.sendIntro(interaction);
            }
        } else {
            const session = await sessionManager.getSession(userId, interaction.channelId);
            const dependencies = { sessionManager, logService, presetService, queueManager };

            if (interaction.isButton()) {
                await handleButtonInteraction(interaction, session, dependencies);
            } else if (interaction.isStringSelectMenu()) {
                await handleSelectMenuInteraction(interaction, session, dependencies);
            } else if (interaction.isModalSubmit()) {
                await handleModalSubmit(interaction, session, dependencies);
            }
        }
    }, interaction);
});

// Error handling
process.on('unhandledRejection', (error) => console.error('[UNHANDLED_REJECTION]', error));
process.on('uncaughtException', (error) => {
    console.error('[UNCAUGHT_EXCEPTION]', error);
    ErrorHandler.logError('SYSTEM', 'SYSTEM', error);
});

process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Shutting down gracefully...');
    csvWatcher.stop();
    sessionManager.sessions.clear();
    await client.destroy();
    console.log('[SHUTDOWN] ✅ Shutdown complete');
    process.exit(0);
});

// Login
client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});
```

---

## ⚡ Quick Start

```bash
# 1. Crea buttonHandler.js copiando dal monolitico
# Cerca: "async function handleButtonInteraction"
# Copia fino alla fine della funzione + helper functions

# 2. Crea index.js con il codice sopra

# 3. Testa
npm install
npm start

# 4. In Discord
/scan
```

---

## 📊 Progress: 96% → 100% (2 files left)

- ✅ 17/17 file modulari creati
- ✅ 3/3 handlers creati (selectMenu + modal)
- ⏳ 1 file da completare: **buttonHandler.js**
- ⏳ 1 file da completare: **index.js**

Tempo stimato: **10 minuti** (principalmente copia/incolla)
