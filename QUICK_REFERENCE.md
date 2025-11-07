# ⚡ Quick Reference - Casper Scanner

## 🚀 Comandi Rapidi

### Setup Iniziale
```bash
cd casper-scanner
npm install
cp .env.example .env
nano .env  # Inserisci DISCORD_BOT_TOKEN e LOG_CHANNEL_ID
```

### Avvio Bot
```bash
npm start           # Produzione
npm run dev         # Development (auto-restart)
npm test            # Test imports
```

### Git Setup
```bash
git init
git add .
git commit -m "Initial modular structure v2.0"
git branch -M main
git remote add origin <your-private-repo-url>
git push -u origin main
```

---

## 📁 Path Files Importanti

### Core
- `index.js` - Entry point
- `.env` - Configurazione (NON committare!)
- `package.json` - Dipendenze

### Eventi
- `events/ready.js` - Inizializzazione bot
- `events/interactionCreate.js` - Handler interazioni

### Managers
- `managers/SessionManager.js` - Gestione sessioni utente
- `managers/QueueManager.js` - Code operazioni
- `managers/CSVFileWatcher.js` - Monitor CSV
- `managers/ErrorHandler.js` - Error isolation

### Config
- `config/constants.js` - Costanti globali
- `config/dataSources.js` - Sorgenti dati SOL/BSC
- `config/metrics.js` - Metriche filtri

### Classes
- `classes/ScannerSession.js` - Sessione utente
- `classes/FilterBuilder.js` - Costruzione filtri

### Services
- `services/presetService.js` - Gestione preset
- `services/exportService.js` - Export CSV/Excel
- `services/dataService.js` - Caricamento dati
- `services/notificationService.js` - Notifiche Discord

### Handlers
- `handlers/buttonHandler.js` - Button clicks
- `handlers/selectMenuHandler.js` - Menu selezione
- `handlers/modalHandler.js` - Modal submits

### Utils
- `utils/parser.js` - Parsing valori
- `utils/fileHelper.js` - Operazioni file
- `utils/validation.js` - Validazione interazioni
- `utils/logger.js` - Logging
- `utils/interactionHelper.js` - Helper interazioni

---

## 🐛 Debug Tips

### Check Logs
```bash
# Tutti i log hanno formato:
# [MODULO] Messaggio

# Esempi:
# [SESSION] User 123456789 started session
# [BUTTON] Processing chain_sol
# [DM] Sending activity check to user 123456789
# [ERROR] User error logged for user 123456789
```

### Test Singolo Modulo
```javascript
// In Node REPL
node
> const SessionManager = require('./managers/SessionManager')
> // Test il modulo
```

### Verifica Imports
```bash
npm test
```

---

## 📊 Monitoraggio

### Log Locations
1. **Console** - Tutti i log di sistema
2. **Discord Log Channel** - Errori critici e statistiche
3. **DM Utente** - Notifiche personali

### Metriche Chiave
- Sessioni attive: `sessionManager.sessions.size`
- Code totali: `queueManager.getTotalQueued()`
- Operazioni concorrenti: `queueManager.currentProcessing`

---

## 🔧 Troubleshooting

### Bot Non Si Avvia
```bash
# Verifica token
cat .env | grep DISCORD_BOT_TOKEN

# Verifica dipendenze
npm install --force

# Verifica sintassi
node index.js
```

### Comandi Non Appaiono
- Attendi 1-5 minuti (propagazione Discord)
- Verifica bot ha permessi
- Re-invita bot con scope `applications.commands`

### "Cannot send messages to user"
- L'utente ha DM disabilitati
- Il bot chiude automaticamente la sessione
- Nessuna azione richiesta

### "Unknown interaction"
- Timeout interazione (>3 secondi)
- Gestito automaticamente
- L'utente riceve messaggio di riprovare

### CSV Non Trovato
```bash
# Verifica path
ls -la data/*.csv

# Verifica nome file in dataSources.js
cat config/dataSources.js | grep file:
```

---

## 📋 Checklist Pre-Deploy

- [ ] `.env` configurato correttamente
- [ ] Tutti i file compilati (vedi GUIDA_ITALIANA.md)
- [ ] Assets copiati in `/assets/`
- [ ] CSV copiati in `/data/`
- [ ] `npm install` eseguito
- [ ] `npm test` passa
- [ ] Test locale con `/scan`
- [ ] Test DM con bot
- [ ] Activity check testato (attendi 5 min)
- [ ] Multi-utente testato

---

## 🎯 Modifiche Comuni

### Cambiare Timeout Activity Check
```javascript
// managers/SessionManager.js
this.inactivityWarning = 5 * 60 * 1000; // 5 minuti
// Cambia a: 10 * 60 * 1000 per 10 minuti
```

### Aggiungere Nuovo Filtro
```javascript
// config/metrics.js
// Aggiungi in METRICS_SYSTEM_SOL o METRICS_SYSTEM_BSC:
{
    id: 'nuovo_filtro',
    label: 'Nuovo Filtro',
    unit: '$',
    defaultMin: 0,
    defaultMax: 1000
}
```

### Aggiungere Nuova Sorgente Dati
```javascript
// config/dataSources.js
'SOL': {
    // ... esistenti ...
    'nuova_source': {
        name: 'Nuova Source',
        description: 'Descrizione',
        file: 'nuova_source.csv',
        icon: '🆕'
    }
}
```

---

## 🔑 Environment Variables

### Required
```env
DISCORD_BOT_TOKEN=your_token_here
LOG_CHANNEL_ID=your_channel_id_here
```

### Optional
```env
NODE_ENV=production
MAX_CONCURRENT_OPS=15
SESSION_TIMEOUT_MIN=30
ACTIVITY_CHECK_MIN=5
```

---

## 📦 NPM Scripts

```json
{
  "start": "node index.js",        // Produzione
  "dev": "nodemon index.js",       // Development
  "test": "node test/test.js"      // Test
}
```

---

## 🔐 Sicurezza

### Files Da NON Committare
- `.env` (token sensibili)
- `data/*.csv` (dati privati)
- `data/presets_*/*.json` (preset utenti)
- `node_modules/`

### Git Check
```bash
# Verifica .gitignore
cat .gitignore

# Verifica cosa verrà committato
git status

# Se .env appare, rimuovilo
git rm --cached .env
```

---

## 📞 Supporto Rapido

### Documentazione
1. `GUIDA_ITALIANA.md` - Guida completa in italiano
2. `TUTORIAL.md` - Tutorial step-by-step
3. `SUMMARY.md` - Riepilogo dettagliato
4. `README.md` - Documentazione tecnica
5. Questo file - Quick reference

### Ordine di Lettura Consigliato
1. `GUIDA_ITALIANA.md` (START HERE)
2. `TUTORIAL.md` (per implementazione)
3. `QUICK_REFERENCE.md` (questo file, per comandi)
4. `SUMMARY.md` (per dettagli tecnici)

---

## ⚡ Tips & Tricks

### Restart Veloce
```bash
# Ctrl+C per fermare
# Poi:
npm start
```

### Clear Session Manualmente
```javascript
// In console Discord come admin
// Usa comando custom se implementato
```

### Backup Rapido
```bash
# Backup preset
cp -r data/presets_* backup/

# Backup CSV
cp data/*.csv backup/
```

### Update Rapido
```bash
git add .
git commit -m "Update: descrizione"
git push
```

---

**Quick Reference v2.0**  
*Ultimo aggiornamento: 2025*
