# 📚 Tutorial Completo - Implementazione Modulare

Questa guida ti accompagna passo-passo nella creazione della struttura modulare completa.

## 🎯 Sommario Problemi Risolti

### ✅ Problema 1: Multi-Utente Concorrente
**RISOLTO** tramite:
- SessionManager con lock per evitare race conditions
- QueueManager con code separate per utente
- Timeout management avanzato

### ✅ Problema 2: Chat Sussurro/Inattività
**RISOLTO** tramite:
- Tutto il bot lavora ora in DM privato
- Activity check inviato in DM invece che nel canale
- Gestione graceful di utenti con DM disabilitati

### ✅ Problema 3: Messaggio Activity Check Pubblico
**RISOLTO** tramite:
- `user.send()` invece di `channel.send()`
- Nessun messaggio pubblico nel canale
- Solo l'utente riceve le notifiche di inattività

### ✅ Problema 4: Avvio Sessione Limitato
**RISOLTO** tramite:
- Comando `/scan` funziona in guild E in DM
- `dm_permission: true` nei comandi
- Client con `partials: ['CHANNEL']` per supporto DM

---

## 📋 Checklist Implementazione

### ✅ Completati Automaticamente
- [x] index.js (entry point modulare)
- [x] events/ready.js (con registrazione comandi DM)
- [x] events/interactionCreate.js (con supporto DM)
- [x] managers/SessionManager.js (activity check in DM)
- [x] config/constants.js
- [x] package.json
- [x] .env.example
- [x] .gitignore
- [x] README.md
- [x] Struttura directory

### 📝 Da Completare Manualmente
Segui i passaggi sotto per creare i file rimanenti.

---

## 🔧 Passo 1: File di Utilità

### utils/parser.js

```javascript
// ========================================
// PARSER UTILITIES
// ========================================

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
    
    // Handle K, M, B suffixes
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
    } catch (e) { 
        return ''; 
    }
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

module.exports = {
    parseValue,
    formatBundlerValue,
    formatDate,
    generateFileName
};
```

**Salva in:** `utils/parser.js`

---

## 🔧 Passo 2: Managers Rimanenti

Vedi il file `MODULAR_IMPLEMENTATION.md` per:
- managers/QueueManager.js ✅ (già incluso)
- managers/CSVFileWatcher.js
- managers/ErrorHandler.js

---

## 🔧 Passo 3: Classi Principali

### classes/FilterBuilder.js

Questo è un file complesso. Per comodità, ti suggerisco di:

1. Aprire il tuo codice monolitico originale
2. Copiare la classe `FilterBuilder`
3. Incapsula in un modulo:

```javascript
class FilterBuilder {
    // ... tutto il codice della classe FilterBuilder ...
}

module.exports = FilterBuilder;
```

**Salva in:** `classes/FilterBuilder.js`

### classes/ScannerSession.js

Stesso procedimento per `ScannerSession`:

```javascript
const FilterBuilder = require('./FilterBuilder');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ... } = require('discord.js');

class ScannerSession {
    constructor(userId, channelId) {
        this.userId = userId;
        this.channelId = channelId;
        // ... resto della classe ...
    }
    
    // ✅ MODIFICA IMPORTANTE: sendIntro ora accetta isInDM
    async sendIntro(interaction, isInDM = false) {
        // ... codice sendIntro ...
        
        // Se in DM, usa messaggi appropriati
        if (isInDM) {
            embed.setDescription(
                'Benvenuto in Casper Scanner (modalità DM privata)...'
            );
        }
    }
    
    // ... tutti gli altri metodi ...
}

module.exports = ScannerSession;
```

**Salva in:** `classes/ScannerSession.js`

---

## 🔧 Passo 4: Handlers

### handlers/buttonHandler.js

```javascript
const { safeReply, safeUpdate } = require('../utils/interactionHelper');

module.exports = {
    async handle(interaction, session, client) {
        const customId = interaction.customId;
        
        // Activity check buttons
        if (customId === 'activity_check_yes') {
            session.resetInactivity();
            client.sessionManager.resetActivityTimer(session.userId);
            
            await safeReply(interaction, {
                content: '✅ Sessione confermata! Continua pure.',
                ephemeral: true
            });
            return;
        }
        
        if (customId === 'activity_check_end') {
            client.sessionManager.deleteSession(session.userId);
            await safeReply(interaction, {
                content: '👋 Sessione chiusa. Usa `/scan` per avviarne una nuova.',
                ephemeral: true
            });
            return;
        }
        
        // Reset inattività per ogni interazione
        session.resetInactivity();
        client.sessionManager.resetActivityTimer(session.userId);
        
        // Switch per tutti i button ID
        switch (customId) {
            case 'chain_sol':
                session.selectedChain = 'SOL';
                await session.showChainSelection(interaction);
                break;
            
            case 'chain_bsc':
                session.selectedChain = 'BSC';
                await session.showChainSelection(interaction);
                break;
            
            case 'start_filter_setup':
                await session.startFilterSetup(interaction);
                break;
            
            // ... aggiungi tutti gli altri case dal tuo codice originale
            
            default:
                console.log(`[BUTTON] Unknown button ID: ${customId}`);
                break;
        }
    }
};
```

**Salva in:** `handlers/buttonHandler.js`

### handlers/selectMenuHandler.js

```javascript
module.exports = {
    async handle(interaction, session, client) {
        const customId = interaction.customId;
        const values = interaction.values;
        
        session.resetInactivity();
        client.sessionManager.resetActivityTimer(session.userId);
        
        switch (customId) {
            case 'select_category':
                session.selectedCategory = values[0];
                await session.showCategoryFilters(interaction, values[0]);
                break;
            
            // ... altri case ...
            
            default:
                console.log(`[SELECT] Unknown select menu: ${customId}`);
                break;
        }
    }
};
```

**Salva in:** `handlers/selectMenuHandler.js`

### handlers/modalHandler.js

```javascript
module.exports = {
    async handle(interaction, session, client) {
        const customId = interaction.customId;
        
        session.resetInactivity();
        client.sessionManager.resetActivityTimer(session.userId);
        
        if (customId === 'filter_config_modal') {
            await processFilterConfigModal(interaction, session);
        } else if (customId === 'save_preset_modal') {
            await processSavePresetModal(interaction, session);
        }
    }
};

// Helper functions
async function processFilterConfigModal(interaction, session) {
    // ... codice dal tuo file originale ...
}

async function processSavePresetModal(interaction, session) {
    // ... codice dal tuo file originale ...
}
```

**Salva in:** `handlers/modalHandler.js`

---

## 🔧 Passo 5: Services

Questi file contengono logica specifica per operazioni come export, preset, etc.

Esempio: **services/presetService.js**

```javascript
const fs = require('fs-extra');
const path = require('path');

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
            return await fs.readJson(userPresetsFile);
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
            await fs.writeJson(
                `./data/presets_${chain.toLowerCase()}/${userId}.json`, 
                userPresets, 
                { spaces: 2 }
            );
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting preset:', error);
        return false;
    }
}

module.exports = {
    saveUserPreset,
    loadUserPreset s,
    deleteUserPreset
};
```

**Salva in:** `services/presetService.js`

Applica lo stesso pattern per:
- `services/exportService.js` (funzioni export CSV/Excel)
- `services/dataService.js` (caricamento CSV)
- `services/notificationService.js` (notifiche Discord)

---

## 🔧 Passo 6: Config Files Rimanenti

### config/dataSources.js

Vedi `MODULAR_IMPLEMENTATION.md` per il codice completo.

### config/metrics.js

Copia `METRICS_SYSTEM_SOL` e `METRICS_SYSTEM_BSC` dal tuo file originale e esportali:

```javascript
const METRICS_SYSTEM_SOL = {
    // ... tutto il METRICS_SYSTEM_SOL ...
};

const METRICS_SYSTEM_BSC = {
    // ... tutto il METRICS_SYSTEM_BSC ...
};

module.exports = {
    METRICS_SYSTEM_SOL,
    METRICS_SYSTEM_BSC
};
```

**Salva in:** `config/metrics.js`

---

## 🚀 Passo 7: Testing

### Test Basico

Crea `test/test.js`:

```javascript
console.log('🧪 Testing modular structure...\n');

try {
    // Test imports
    const { client } = require('../index');
    const SessionManager = require('../managers/SessionManager');
    const QueueManager = require('../managers/QueueManager');
    const FilterBuilder = require('../classes/FilterBuilder');
    const { parseValue } = require('../utils/parser');
    const { DATA_SOURCES } = require('../config/dataSources');
    
    console.log('✅ All imports successful');
    console.log('✅ Module structure valid');
    console.log('\n🎉 Tests passed!\n');
    
    process.exit(0);
} catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
}
```

Esegui:
```bash
npm test
```

### Test Completo

1. **Setup .env**:
```bash
cp .env.example .env
# Modifica .env con i tuoi token
```

2. **Installa dipendenze**:
```bash
npm install
```

3. **Avvia il bot**:
```bash
npm start
```

4. **Test in Discord**:
- Prova `/scan` in un canale guild
- Prova `/scan` in DM con il bot
- Verifica che l'activity check arrivi in DM
- Testa multi-utente con amici

---

## 🐛 Troubleshooting

### Problema: "Cannot find module"
**Soluzione**: Verifica che tutti i file siano stati creati nei path corretti.

### Problema: "Cannot send messages to this user"
**Soluzione**: L'utente ha i DM disabilitati. Il bot chiude automaticamente la sessione.

### Problema: "Unknown interaction"
**Soluzione**: Timeout dell'interazione. Il sistema gestisce automaticamente con retry.

### Problema: CSV non trovato
**Soluzione**: Assicurati che i file CSV siano in `./data/` e che i nomi corrispondano esattamente a quelli in `DATA_SOURCES`.

---

## 📚 Prossimi Passi

1. ✅ Completa tutti i file mancanti
2. ✅ Testa localmente
3. ✅ Crea repository privato:
```bash
git init
git add .
git commit -m "Initial modular structure"
git remote add origin <your-repo-url>
git push -u origin main
```

4. ✅ Documenta modifiche specifiche per il tuo caso d'uso
5. ✅ Setup CI/CD se necessario

---

## 💡 Tips Finali

### Performance
- Il QueueManager gestisce fino a 15 operazioni concorrenti
- Session cleanup ogni 2 minuti
- Activity check dopo 5 minuti di inattività

### Sicurezza
- Tutte le interazioni sono ephemeral (private)
- No data storage di informazioni sensibili
- Preset salvati localmente per utente

### Manutenzione
- Log strutturati per debug facile
- Error isolation per evitare crash globali
- Moduli indipendenti per update selettivi

### Future Enhancements
- Aggiungere comandi admin
- Implementare cache per CSV grandi
- Aggiungere statistiche d'uso
- Implementare backup automatici preset

---

**Buon lavoro! 🚀**

Per domande o problemi, rivedi il README.md e MODULAR_IMPLEMENTATION.md.
