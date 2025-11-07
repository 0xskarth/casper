# 🔮 Casper Scanner - Guida alla Migrazione Modulare

## 📋 Panoramica

Questa guida descrive la struttura modulare del progetto Casper Scanner e come completare la migrazione dal codice monolitico.

## 🏗️ Struttura del Progetto

```
casper/
├── src/
│   ├── core/                      # Componenti fondamentali
│   │   ├── ErrorHandler.js        # ✅ Gestione errori isolata
│   │   ├── InteractionValidator.js # ✅ Validazione interazioni Discord
│   │   └── QueueManager.js        # ✅ Gestione code concorrenti
│   │
│   ├── managers/                  # Gestori di sistema
│   │   ├── SessionManager.js      # ✅ Gestione sessioni utente
│   │   └── CSVFileWatcher.js      # ✅ Monitor file CSV
│   │
│   ├── models/                    # Modelli dati
│   │   ├── FilterBuilder.js       # ✅ Costruttore filtri chain-specific
│   │   └── ScannerSession.js      # ⏳ DA COMPLETARE - Classe sessione scanner
│   │
│   ├── config/                    # Configurazioni
│   │   ├── constants.js           # ✅ Costanti globali
│   │   ├── metrics.js             # ✅ Sistemi metriche SOL/BSC
│   │   └── dataSources.js         # ✅ Sorgenti dati SOL/BSC
│   │
│   ├── utils/                     # Utilities
│   │   ├── formatters.js          # ✅ Formattazione dati
│   │   ├── helpers.js             # ✅ Helper functions
│   │   ├── interactionUtils.js    # ✅ Safe interaction functions
│   │   └── excelExport.js         # ⏳ DA CREARE - Export Excel
│   │
│   ├── handlers/                  # Gestori eventi Discord
│   │   ├── buttonHandler.js       # ⏳ DA CREARE
│   │   ├── selectMenuHandler.js   # ⏳ DA CREARE
│   │   └── modalHandler.js        # ⏳ DA CREARE
│   │
│   └── services/                  # Servizi applicativi
│       ├── logService.js          # ✅ Logging centralizzato
│       ├── presetService.js       # ✅ Gestione preset
│       └── notificationService.js # ✅ Notifiche CSV
│
├── index.js                       # ⏳ DA CREARE - Entry point modulare
├── package.json                   # ⏳ DA AGGIORNARE
├── .env                           # ✅ Configurazione ambiente
└── data/                          # Dati applicativi
    ├── presets_sol/               # Preset Solana
    └── presets_bsc/               # Preset BSC

```

## 📝 File da Completare

### 1. **src/utils/excelExport.js**

Estrae la funzione `createDarkThemedExcel` dal monolitico:

```javascript
// ========================================
// EXCEL EXPORT - Dark Themed Excel Generation
// ========================================

const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const { BRAND_COLORS, BRAND_ASSETS } = require('../config/constants');
const { getParameterInfo } = require('./helpers');
const { parseValue, formatBundlerValue, formatDate } = require('./formatters');

async function createDarkThemedExcel(results, sourceName, chain = 'SOL') {
    const workbook = new ExcelJS.Workbook();
    // ... (copia il codice della funzione createDarkThemedExcel dal monolitico)
}

module.exports = { createDarkThemedExcel };
```

### 2. **src/models/ScannerSession.js**

Classe principale della sessione scanner. **NOTA IMPORTANTE**: Questo file è il più complesso.

**Struttura:**
- Constructor
- Metodi UI: `sendIntro()`, `showChainSelection()`, `showCategories()`, etc.
- Metodi dati: `loadDataInfo()`, `loadDataSources()`, `applyFilters()`, `deduplicateResults()`
- Metodi export: `showResults()`, `exportResults()`
- Metodi preset: `createSavePresetModal()`, `showMyPresets()`

**Dipendenze da importare:**
```javascript
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, AttachmentBuilder } = require('discord.js');
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
```

### 3. **src/handlers/buttonHandler.js**

Gestisce tutte le interazioni con i pulsanti:

```javascript
const InteractionValidator = require('../core/InteractionValidator');
const { safeReply, safeUpdate } = require('../utils/interactionUtils');

async function handleButtonInteraction(interaction, session, dependencies) {
    const { sessionManager, logService } = dependencies;
    const customId = interaction.customId;

    // Check timeout
    const interactionAge = Date.now() - interaction.createdTimestamp;
    if (interactionAge > 2800) {
        // ... gestione timeout
        return;
    }

    // Reset inattività
    session.resetInactivity();
    sessionManager.resetActivityTimer(session.userId, session.channelId);

    switch (customId) {
        case 'chain_sol':
            session.selectedChain = 'SOL';
            await session.showChainSelection(interaction);
            break;
        // ... tutti gli altri casi dal monolitico
    }
}

module.exports = handleButtonInteraction;
```

### 4. **src/handlers/selectMenuHandler.js**

```javascript
async function handleSelectMenuInteraction(interaction, session) {
    const customId = interaction.customId;
    const values = interaction.values;

    switch (customId) {
        case 'select_category':
            session.selectedCategory = values[0];
            await session.showCategoryFilters(interaction, values[0]);
            break;
        // ... altri casi
    }
}

module.exports = handleSelectMenuInteraction;
```

### 5. **src/handlers/modalHandler.js**

```javascript
async function handleModalSubmit(interaction, session) {
    if (interaction.customId === 'filter_config_modal') {
        await processFilterConfigModal(interaction, session);
    } else if (interaction.customId === 'save_preset_modal') {
        await processSavePresetModal(interaction, session);
    }
}

// ... funzioni processFilterConfigModal e processSavePresetModal

module.exports = handleModalSubmit;
```

### 6. **index.js** (Entry Point Principale)

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

// Inizializzazione client
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

// Configura ErrorHandler
ErrorHandler.setClient(client);
ErrorHandler.setLogChannelId(process.env.LOG_CHANNEL_ID);

// Configura CSV Watcher
csvWatcher.setLogService(logService);

// Event: ready
client.once('ready', async () => {
    console.log(`✅ Bot Online: ${client.user.tag}`);

    // Inizializza CSV Watcher
    await csvWatcher.init();

    // Gestisci eventi CSV
    csvWatcher.on('csv-updated', (fileName) => {
        notificationService.notifyListUpdate(fileName, 'updated');
    });

    csvWatcher.on('csv-added', (fileName) => {
        notificationService.notifyListUpdate(fileName, 'added');
    });

    csvWatcher.on('csv-removed', (fileName) => {
        notificationService.notifyListUpdate(fileName, 'removed');
    });

    // Carica preset
    await presetService.loadAllPresets();

    // Registra comandi slash
    await client.application.commands.set([
        {
            name: 'scan',
            description: '🔮 Start Casper Scanner - Multi-Chain Trading Analysis'
        }
    ]);

    await logService.logToChannel(null, {
        title: '🚀 Scanner Started',
        description: 'Casper Scanner is now online!',
        color: '#00FF00'
    });
});

// Event: interactionCreate
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

            const dependencies = {
                sessionManager,
                logService,
                presetService,
                queueManager
            };

            if (interaction.isButton()) {
                await handleButtonInteraction(interaction, session, dependencies);
            } else if (interaction.isStringSelectMenu()) {
                await handleSelectMenuInteraction(interaction, session);
            } else if (interaction.isModalSubmit()) {
                await handleModalSubmit(interaction, session);
            }
        }
    }, interaction);
});

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('[UNHANDLED_REJECTION]', error);
});

process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Shutting down gracefully...');
    csvWatcher.stop();
    sessionManager.sessions.clear();
    await client.destroy();
    process.exit(0);
});

// Login
client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});
```

### 7. **package.json**

```json
{
  "name": "casper-scanner",
  "version": "2.0.0",
  "description": "Multi-Chain Trading Analysis Scanner for Discord",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "discord.js": "^14.14.1",
    "dotenv": "^16.3.1",
    "fs-extra": "^11.2.0",
    "papaparse": "^5.4.1",
    "exceljs": "^4.4.0",
    "chokidar": "^3.5.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 🚀 Passi per Completare la Migrazione

### Step 1: Creare i File Mancanti

1. **src/utils/excelExport.js** - Copia la funzione `createDarkThemedExcel` dal codice monolitico
2. **src/models/ScannerSession.js** - Copia l'intera classe `ScannerSession`
3. **src/handlers/buttonHandler.js** - Estrai la funzione `handleButtonInteraction`
4. **src/handlers/selectMenuHandler.js** - Estrai `handleSelectMenuInteraction`
5. **src/handlers/modalHandler.js** - Estrai `handleModalSubmit` e le sue funzioni helper

### Step 2: Creare Entry Point

Crea `index.js` nella root come mostrato sopra.

### Step 3: Aggiornare package.json

Copia il package.json fornito sopra.

### Step 4: Test

```bash
# Installa dipendenze
npm install

# Test avvio
npm start
```

### Step 5: Verifica Funzionalità

- [x] Bot si avvia correttamente
- [ ] Comando `/scan` funziona
- [ ] Selezione chain (SOL/BSC)
- [ ] Configurazione filtri
- [ ] Selezione data sources
- [ ] Export (CSV/Excel)
- [ ] Salvataggio/caricamento preset
- [ ] Notifiche CSV update

## 📌 Note Importanti

1. **Circular Dependencies**: `SessionManager` importa dinamicamente `ScannerSession` per evitare circular dependencies
2. **Dependency Injection**: I servizi vengono passati come `dependencies` agli handlers
3. **Error Isolation**: Ogni operazione utente è wrappata in `ErrorHandler.safeExecute()`
4. **Session Management**: Le sessioni sono gestite centralmente da `SessionManager`
5. **Queue System**: Tutte le operazioni async passano attraverso `QueueManager`

## 🔧 Troubleshooting

### Errore: "Cannot find module"
- Verifica che tutti i file siano creati nelle directory corrette
- Controlla i path relativi negli import

### Bot non risponde
- Verifica `.env` con DISCORD_BOT_TOKEN corretto
- Controlla log console per errori

### Errori di interazione timeout
- Verifica che `InteractionValidator` sia configurato correttamente
- Check timing in `handleButtonInteraction`

## 📚 Risorse

- [Discord.js Documentation](https://discord.js.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Modular Architecture Patterns](https://www.patterns.dev/posts/module-pattern/)

## ✅ Checklist Completa

- [x] Struttura directory creata
- [x] File di configurazione (constants, metrics, dataSources)
- [x] Core classes (ErrorHandler, InteractionValidator, QueueManager)
- [x] Managers (SessionManager, CSVFileWatcher)
- [x] Models (FilterBuilder)
- [x] Utilities (formatters, helpers, interactionUtils)
- [x] Services (logService, presetService, notificationService)
- [ ] **src/utils/excelExport.js**
- [ ] **src/models/ScannerSession.js**
- [ ] **src/handlers/buttonHandler.js**
- [ ] **src/handlers/selectMenuHandler.js**
- [ ] **src/handlers/modalHandler.js**
- [ ] **index.js**
- [ ] **package.json aggiornato**

---

**Autore**: Senior Developer
**Data**: 2025-11-07
**Versione**: 2.0.0 - Architettura Modulare
