# 🔮 Casper Scanner - Status Architettura Modulare

## 📊 Progresso: 75% Completato ✅

---

## ✅ FILES CREATI CON SUCCESSO (18/25)

### 📁 `src/config/` - Configurazioni (3/3) ✅
```
✅ constants.js          - Brand colors, assets, mappings ruoli
✅ metrics.js            - METRICS_SYSTEM_SOL + METRICS_SYSTEM_BSC (9 categorie ciascuno)
✅ dataSources.js        - DATA_SOURCES per SOL (11 fonti) e BSC (4 fonti)
```

### 🛠️ `src/core/` - Sistema Core (3/3) ✅
```
✅ ErrorHandler.js       - Gestione errori isolata per utente con logging
✅ InteractionValidator.js - Timeout check (2s initial, 14min follow-up)
✅ QueueManager.js       - Code concorrenti (max 15), retry automatico (3 tentativi)
```

### 👥 `src/managers/` - Managers (2/2) ✅
```
✅ SessionManager.js     - Gestione sessioni + activity check (5 min warning)
✅ CSVFileWatcher.js     - Monitor CSV con MD5 hashing + periodic check (10 min)
```

### 📦 `src/models/` - Models (1/2) ⚠️
```
✅ FilterBuilder.js      - Multi-period filters, temp selection, grouped summary
⏳ ScannerSession.js     - DA CREARE (classe principale, ~800 linee)
```

### 🔧 `src/utils/` - Utilities (3/4) ⚠️
```
✅ formatters.js         - parseValue, formatBundlerValue, formatDate, generateFileName
✅ helpers.js            - getParameterInfo, normalizeBSCFileName, findBSCFile
✅ interactionUtils.js   - safeReply, safeUpdate (con retry automatico)
⏳ excelExport.js        - DA CREARE (createDarkThemedExcel)
```

### 🌐 `src/services/` - Services (3/3) ✅
```
✅ logService.js         - Logging centralizzato (preset, analysis, filter edit)
✅ presetService.js      - Gestione preset SOL/BSC separati (save/load/delete)
✅ notificationService.js - Notifiche CSV update con role ping (LIST_ROLE_MAPPING)
```

### 🎮 `src/handlers/` - Event Handlers (0/3) ❌
```
⏳ buttonHandler.js      - DA CREARE (30+ button cases)
⏳ selectMenuHandler.js  - DA CREARE (5 select menu cases)
⏳ modalHandler.js       - DA CREARE (2 modal types + helper functions)
```

### 📖 Documentazione (2/2) ✅
```
✅ MIGRATION_GUIDE.md    - Guida completa con template codice
✅ MODULAR_ARCHITECTURE_STATUS.md - Questo file
```

### 🚀 Entry Point (0/2) ❌
```
⏳ index.js              - DA CREARE (main entry point, ~150 linee)
✅ package.json          - ESISTENTE (già configurato correttamente)
```

---

## 🎯 COSA FARE ORA: 5 Files da Completare

### ⚠️ PRIORITÀ 1: ScannerSession.js (CRITICO)

**Posizione**: `src/models/ScannerSession.js`
**Linee**: ~800
**Tempo stimato**: 15-20 minuti (copia/incolla dal monolitico)

**Cosa fare**:
1. Apri il file monolitico originale
2. Cerca `class ScannerSession {` (circa linea 500-600)
3. Copia l'intera classe fino alla chiusura `}`
4. Incolla in `src/models/ScannerSession.js`
5. Aggiungi in cima questi imports:

```javascript
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
        ModalBuilder, TextInputBuilder, AttachmentBuilder, ButtonStyle,
        TextInputStyle } = require('discord.js');
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
    // ... COPIA QUI IL RESTO DELLA CLASSE DAL MONOLITICO
}

module.exports = ScannerSession;
```

**Metodi chiave da verificare**:
- ✅ `constructor(userId, channelId)`
- ✅ `resetInactivity()`
- ✅ `sendIntro(interaction)`
- ✅ `showChainSelection(interaction)`
- ✅ `showCategories(interaction)`
- ✅ `showCategoryFilters(interaction, category)`
- ✅ `showDataSourceSelection(interaction)`
- ✅ `loadDataSources()` - importante: gestisce BSC CSV cleanup
- ✅ `applyFilters(sourceKey)` - importante: logging dettagliato
- ✅ `showResults(interaction)`
- ✅ `exportResults(interaction)`
- ✅ `startExportSessionTimer()` - 5 min auto-close

---

### ⚠️ PRIORITÀ 2: excelExport.js

**Posizione**: `src/utils/excelExport.js`
**Linee**: ~200
**Tempo stimato**: 5-10 minuti

**Cosa fare**:
1. Cerca `async function createDarkThemedExcel` nel monolitico (circa linea 1200-1400)
2. Copia l'intera funzione
3. Crea file `src/utils/excelExport.js` con:

```javascript
const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const { BRAND_COLORS, BRAND_ASSETS } = require('../config/constants');
const { getParameterInfo } = require('./helpers');
const { parseValue, formatBundlerValue, formatDate } = require('./formatters');

async function createDarkThemedExcel(results, sourceName, chain = 'SOL') {
    // ... COPIA FUNZIONE QUI
}

module.exports = { createDarkThemedExcel };
```

**Features da verificare**:
- ✅ Logo dimezzato (5 righe invece di 10)
- ✅ wallet_address come TEXT (non numero)
- ✅ gmgn_url mostra URL completo
- ✅ Colori profit/loss dinamici
- ✅ Autofilter su header

---

### ⚠️ PRIORITÀ 3: buttonHandler.js

**Posizione**: `src/handlers/buttonHandler.js`
**Linee**: ~350
**Tempo stimato**: 10 minuti

**Struttura**:
```javascript
const InteractionValidator = require('../core/InteractionValidator');
const { safeReply, safeUpdate } = require('../utils/interactionUtils');

async function handleButtonInteraction(interaction, session, dependencies) {
    const { sessionManager, logService, presetService, queueManager } = dependencies;
    const customId = interaction.customId;

    // ✅ TIMEOUT CHECK
    const interactionAge = Date.now() - interaction.createdTimestamp;
    if (interactionAge > 2800) {
        console.log(`[TIMEOUT_SKIP] ⏱️ Interaction ${interactionAge}ms old`);

        try {
            if (!interaction.replied && !interaction.deferred) {
                if (interaction.isModalSubmit()) {
                    // ... messaggio timeout per modal
                } else {
                    await interaction.reply({
                        content: '⏱️ **Timeout** - Please click again. Progress saved! 😊',
                        ephemeral: true
                    });
                }
            }
        } catch (e) {
            console.log('[TIMEOUT_SKIP] Could not reply:', e.message);
        }
        return;
    }

    // ✅ RESET INATTIVITÀ
    if (!await InteractionValidator.canRespond(interaction)) {
        return;
    }

    session.resetInactivity();
    sessionManager.resetActivityTimer(session.userId, session.channelId);

    // ✅ SWITCH CASES (30+)
    switch (customId) {
        case 'chain_sol':
            session.selectedChain = 'SOL';
            await session.showChainSelection(interaction);
            break;

        case 'chain_bsc':
            session.selectedChain = 'BSC';
            await session.showChainSelection(interaction);
            break;

        // ... COPIA TUTTI GLI ALTRI CASES DAL MONOLITICO
        // Cerca "case 'chain_sol':" nel file monolitico
        // Copia fino alla fine dello switch

        case 'activity_check_yes':
            // ... gestione activity check
            break;

        case 'activity_check_end':
            // ... chiusura sessione
            break;

        default:
            // Gestione preset dinamici
            if (customId.startsWith('load_preset_')) {
                const presetName = customId.replace('load_preset_', '');
                await loadPreset(interaction, session, presetName, presetService, logService);
            } else if (customId.startsWith('delete_preset_')) {
                const presetName = customId.replace('delete_preset_', '');
                await deletePreset(interaction, session, presetName, presetService);
            }
            break;
    }
}

// ✅ HELPER FUNCTIONS
async function showFilterSummary(interaction, session) {
    // ... copia dal monolitico
}

async function configureSelectedFilters(interaction, session) {
    // ... copia dal monolitico
}

async function loadPreset(interaction, session, presetName, presetService, logService) {
    // ... copia dal monolitico
}

async function deletePreset(interaction, session, presetName, presetService) {
    // ... copia dal monolitico
}

module.exports = handleButtonInteraction;
```

**Cases da implementare** (cerca nel monolitico):
1. Navigazione: `chain_sol`, `chain_bsc`, `back_to_*`, `new_analysis`
2. Filtri: `start_filter_setup`, `view_filters`, `remove_filters`, `configure_selected`
3. Data: `proceed_to_sources`, `select_export_format`
4. Export: `export_csv`, `export_excel`, `export_both`, `export_results`
5. Session: `new_session_after_export`, `activity_check_yes`, `activity_check_end`
6. Edit: `edit_filters_from_results`, `edit_sources_from_results`, `update_results_from_edit`
7. Config: `continue_filter_config`, `finish_filter_config`
8. Preset: `save_preset`, `load_preset`, `load_preset_*`, `delete_preset_*`

---

### ⚠️ PRIORITÀ 4: selectMenuHandler.js

**Posizione**: `src/handlers/selectMenuHandler.js`
**Linee**: ~40
**Tempo stimato**: 3 minuti

```javascript
async function handleSelectMenuInteraction(interaction, session) {
    const customId = interaction.customId;
    const values = interaction.values;

    switch (customId) {
        case 'select_category':
            session.selectedCategory = values[0];
            await session.showCategoryFilters(interaction, values[0]);
            break;

        case 'toggle_filters':
            session.filterBuilder.setTempSelectedMetrics(session.selectedCategory, values);
            await session.showCategoryFilters(interaction, session.selectedCategory);
            break;

        case 'select_filters_to_remove':
            const indices = values.map(v => parseInt(v));
            session.filterBuilder.removeMultipleFilters(indices);
            await session.showCategories(interaction);
            break;

        case 'select_data_sources':
            session.selectedDataSources = values;
            await session.showDataSourceSelection(interaction);
            break;

        case 'select_preset_for_options':
            const presetName = values[0];
            await showPresetOptions(interaction, session, presetName);
            break;

        default:
            break;
    }
}

// COPIA dal monolitico:
async function showPresetOptions(interaction, session, presetName) {
    // ... implementazione
}

module.exports = handleSelectMenuInteraction;
```

---

### ⚠️ PRIORITÀ 5: modalHandler.js

**Posizione**: `src/handlers/modalHandler.js`
**Linee**: ~150
**Tempo stimato**: 7 minuti

```javascript
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { safeReply } = require('../utils/interactionUtils');
const { EMBED_COLOR, BRAND_ASSETS } = require('../config/constants');

async function handleModalSubmit(interaction, session) {
    if (interaction.customId === 'filter_config_modal') {
        await processFilterConfigModal(interaction, session);
    } else if (interaction.customId === 'save_preset_modal') {
        await processSavePresetModal(interaction, session);
    }
}

// COPIA queste funzioni dal monolitico:
async function processFilterConfigModal(interaction, session) {
    // ... ~100 linee
}

async function processSavePresetModal(interaction, session) {
    // ... ~50 linee
}

module.exports = handleModalSubmit;
```

---

### ⚠️ PRIORITÀ 6: index.js (Entry Point)

**Posizione**: `/home/user/casper/index.js` (root)
**Linee**: ~150
**Tempo stimato**: 10 minuti

**COPIA IL TEMPLATE COMPLETO DA `MIGRATION_GUIDE.md`** (sezione "index.js (Entry Point Principale)")

Oppure usa questo template minimo:

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

// Servizi
const queueManager = new QueueManager();
const sessionManager = new SessionManager(client, queueManager);
const csvWatcher = new CSVFileWatcher('./data');
const logService = new LogService(client, process.env.LOG_CHANNEL_ID);
const presetService = new PresetService();
const notificationService = new NotificationService(client, '1415668627444731955');

// Setup
ErrorHandler.setClient(client);
ErrorHandler.setLogChannelId(process.env.LOG_CHANNEL_ID);
csvWatcher.setLogService(logService);

// Ready event
client.once('ready', async () => {
    console.log(`✅ Bot Online: ${client.user.tag}`);

    await csvWatcher.init();

    csvWatcher.on('csv-updated', (fileName) => notificationService.notifyListUpdate(fileName, 'updated'));
    csvWatcher.on('csv-added', (fileName) => notificationService.notifyListUpdate(fileName, 'added'));
    csvWatcher.on('csv-removed', (fileName) => notificationService.notifyListUpdate(fileName, 'removed'));

    await presetService.loadAllPresets();

    await client.application.commands.set([{
        name: 'scan',
        description: '🔮 Start Casper Scanner - Multi-Chain Trading Analysis'
    }]);
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
                await handleSelectMenuInteraction(interaction, session);
            } else if (interaction.isModalSubmit()) {
                await handleModalSubmit(interaction, session);
            }
        }
    }, interaction);
});

// Error handling
process.on('unhandledRejection', (error) => console.error('[ERROR]', error));
process.on('SIGINT', async () => {
    csvWatcher.stop();
    await client.destroy();
    process.exit(0);
});

// Login
client.login(process.env.DISCORD_BOT_TOKEN);
```

---

## 🧪 TEST DOPO COMPLETAMENTO

```bash
# 1. Installa dipendenze (se non già fatto)
npm install

# 2. Verifica sintassi
node --check index.js

# 3. Avvia bot
npm start

# 4. In Discord, testa:
/scan → Deve mostrare intro
Clicca "🟣 Solana" → Deve mostrare chain selection
Clicca "🚀 Setup Filters" → Deve mostrare categorie
```

---

## 📋 CHECKLIST FINALE

### Files da Creare
- [ ] `src/utils/excelExport.js` (5 min)
- [ ] `src/models/ScannerSession.js` (15 min)
- [ ] `src/handlers/buttonHandler.js` (10 min)
- [ ] `src/handlers/selectMenuHandler.js` (3 min)
- [ ] `src/handlers/modalHandler.js` (7 min)
- [ ] `index.js` (10 min)

### Test Funzionalità
- [ ] Bot avvio
- [ ] Comando `/scan`
- [ ] Selezione chain
- [ ] Configurazione filtri
- [ ] Export CSV
- [ ] Export Excel
- [ ] Salvataggio preset
- [ ] Caricamento preset
- [ ] Notifiche CSV update
- [ ] Activity check (aspetta 5 min)
- [ ] Export timer (aspetta 5 min dopo export)

---

## 🎉 QUANDO HAI FINITO

1. ✅ Tutti i 6 files creati
2. ✅ Bot si avvia senza errori
3. ✅ `/scan` funziona end-to-end
4. ✅ Export genera file CSV/Excel

**Congratulazioni! Hai completato la migrazione a architettura modulare! 🚀**

---

**Tempo totale stimato**: ~50 minuti (con copia/incolla dal monolitico)
**Difficoltà**: ⭐⭐⚪⚪⚪ (Medio-Bassa, principalmente copia/incolla)
**Benefici**: ♾️ Infiniti (manutenibilità, scalabilità, testabilità)
