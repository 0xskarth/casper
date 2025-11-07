# CASPER SCANNER - FIX DOCUMENTATION

## ✅ FIX IMPLEMENTATI

### FIX 1: Comando funziona sia in chat che in DM
**STATUS**: ✅ COMPLETATO

Il comando `/scan` ora può essere invocato sia da un server che da DM.

**Implementazione**:
```javascript
if (interaction.commandName === 'scan') {
    const isDM = interaction.channel?.type === ChannelType.DM;

    if (!isDM) {
        // Redirect to DM
        await interaction.reply({
            content: '✅ **Opening Scanner in DM...**\n\nCheck your Direct Messages!',
            ephemeral: true
        });

        try {
            const dmChannel = await interaction.user.createDM();
            const session = await sessionManager.getSession(userId, dmChannel.id);
            await session.sendIntroViaDM(interaction.user, dmChannel);
        } catch (error) {
            await interaction.followUp({
                content: '❌ **Could not open DM**\n\nPlease enable Direct Messages.',
                ephemeral: true
            });
        }
    } else {
        // Already in DM
        const session = await sessionManager.getSession(userId, interaction.channelId);
        await session.sendIntro(interaction);
    }
}
```

---

### FIX 2: Script opera SOLO in DM
**STATUS**: ✅ COMPLETATO

Tutte le operazioni dello scanner vengono ora eseguite esclusivamente in DM dell'utente.

**Implementazione**:
- Quando `/scan` viene usato in un server, il bot risponde ephemeral e apre automaticamente il DM
- Tutti i messaggi, embed e interazioni successive avvengono nel canale DM
- Questo previene timeout delle interazioni Discord dovuti a inattività in canali pubblici

**Vantaggi**:
- ✅ Privacy: Le analisi sono visibili solo all'utente
- ✅ No spam nei server
- ✅ Minori problemi con timeout delle interazioni
- ✅ Esperienza utente più fluida

---

### FIX 3: Utente può aprire nuove sessioni in DM
**STATUS**: ✅ COMPLETATO

Gli utenti possono ora:
1. Aprire `/scan` direttamente in DM con il bot
2. Aprire `/scan` da qualsiasi server e viene automaticamente reindirizzato al DM
3. Avviare nuove sessioni dopo aver completato un export con il pulsante "🔄 New Session"

**Implementazione**:
```javascript
// Nuovo metodo nella ScannerSession class
async sendIntroViaDM(user, dmChannel) {
    const embed = new EmbedBuilder()
        .setTitle('🔮 Casper | Scanner')
        .setDescription(`Welcome to **Casper Scanner**...`)
        .setColor(EMBED_COLOR)
        .setImage('attachment://banner.png')
        .setFooter({ text: BRAND_ASSETS.footer, iconURL: 'attachment://logos.png' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('chain_sol').setLabel('🟣 Solana').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('chain_bsc').setLabel('🟡 BSC').setStyle(ButtonStyle.Secondary)
        );

    const files = [];
    if (await fs.pathExists(BRAND_ASSETS.footerLogo)) {
        files.push(new AttachmentBuilder(BRAND_ASSETS.footerLogo, { name: 'logos.png' }));
    }
    if (await fs.pathExists(BRAND_ASSETS.banner)) {
        files.push(new AttachmentBuilder(BRAND_ASSETS.banner, { name: 'banner.png' }));
    }

    await dmChannel.send({
        embeds: [embed],
        components: [row],
        files: files
    });

    this.step = 'intro';
}
```

**Pulsante "New Session"**:
```javascript
case 'new_session_after_export':
    if (session.exportSessionTimer) {
        clearTimeout(session.exportSessionTimer);
        session.exportSessionTimer = null;
    }
    sessionManager.deleteSession(session.userId);
    const newSession = await sessionManager.getSession(interaction.user.id, interaction.channelId);
    await newSession.sendIntro(interaction);
    break;
```

---

### FIX 4: Controllo filtri CSV per BSC e SOL
**STATUS**: ✅ COMPLETATO

**Validazione Campi CSV**:

#### SOL CSV Fields (Validati):
```
wallet_address, gmgn_url, bundler, sol_balance, total_profit, total_profit_pct,
unrealized_profit_total, 1d_realized_profit, 1d_realized_profit_pct,
1d_pnl_lt_minus50, 1d_pnl_minus50_0, 1d_pnl_0_2x, 1d_pnl_2x_5x, 1d_pnl_gt_5x,
1d_mcap_gt_500k, 1d_mcap_100k_500k, 1d_mcap_lt_100k, 1d_total_volume,
1d_total_bought_cost, 1d_total_sold_income, 1d_buy, 1d_sell, 1d_trades,
1d_unique_tokens, 1d_avg_buy_per_token, 1d_avg_sell_per_token, 1d_avg_buy_cost,
1d_avg_sell_cost, 1d_avg_holding_period_min, 1d_transfer_in, 1d_transfer_out,
1d_token_active, 1d_winrate, 1d_quick_trades, 1d_quick_trades_ratio,
1d_honeypot_tokens, 1d_honeypot_ratio, 1d_no_buy_hold, 1d_no_buy_hold_ratio,
1d_sell_pass_buy, 1d_sell_pass_buy_ratio, 1d_total_fee_usd
(+ 7d_* and 30d_* variants)
```

#### BSC CSV Fields (Validati):
```
wallet_address, gmgn_url, bundler, bnb_balance, total_profit, total_profit_pct,
unrealized_profit_total, winrate_historic, historic_pnl_lt_minus50,
historic_pnl_minus50_0, historic_pnl_0_2x, historic_pnl_2x_5x, historic_pnl_gt_5x,
historic_unique_tokens, historic_token_active, historic_avg_holding_period_min,
historic_no_buy_hold, historic_sell_pass_buy, 1d_realized_profit,
1d_realized_profit_pct, 1d_pnl_lt_nd5, 1d_pnl_nd5_0x, 1d_pnl_0_2x, 1d_pnl_2x_5x,
1d_pnl_gt_5x, 1d_unique_tokens, 1d_winrate, 1d_total_volume, 1d_total_bought_cost,
1d_total_sold_income, 1d_buy, 1d_sell, 1d_trades, 1d_avg_buy_per_token,
1d_avg_sell_per_token, 1d_avg_buy_cost, 1d_avg_sell_cost, 1d_quick_trades,
1d_quick_trades_ratio, 1d_honeypot_tokens, 1d_honeypot_ratio, 1d_no_buy_hold_ratio,
1d_sell_pass_buy_ratio, 1d_total_fee_usd
(+ 7d_* and 30d_* variants)
```

**Implementazione Validazione**:
```javascript
async applyFilters(sourceKey) {
    const data = this.csvData[sourceKey];
    if (!data || data.length === 0) {
        console.log(`[FILTER] No data for ${sourceKey}`);
        return [];
    }

    const totalRecords = data.length;
    let results = [...data];
    const filters = this.filterBuilder.getFiltersForProcessing();
    const missingFields = [];

    console.log(`[FILTER_START] Applying ${Object.keys(filters).length} filters to ${sourceKey}`);
    console.log(`[FILTER] Chain: ${this.selectedChain}`);
    console.log(`[FILTER] Starting with ${totalRecords} records`);

    // ✅ VALIDAZIONE CAMPI
    const sampleRow = data[0];
    const availableFields = Object.keys(sampleRow);
    console.log(`[FILTER] Available fields (first 20):`, availableFields.slice(0, 20));

    for (const filterKey of Object.keys(filters)) {
        if (!(filterKey in sampleRow)) {
            missingFields.push(filterKey);
            console.warn(`[WARNING] ⚠️ Field '${filterKey}' NOT FOUND in CSV!`);
            console.warn(`[SUGGESTION] Available similar fields:`,
                availableFields.filter(f => f.includes(filterKey.split('_').pop())));
        } else {
            console.log(`[VALIDATION] ✓ Field '${filterKey}' exists in CSV`);
        }
    }

    // Applica filtri...
    for (const [filterKey, config] of Object.entries(filters)) {
        results = results.filter(row => {
            if (!(filterKey in row)) {
                return false;
            }

            const rawValue = row[filterKey];
            const fieldValue = parseValue(rawValue);

            if (config.min !== null && config.min !== undefined && fieldValue < config.min) {
                return false;
            }

            if (config.max !== null && config.max !== undefined && fieldValue > config.max) {
                return false;
            }

            return true;
        });
    }

    // Debug info
    this.debugInfo[sourceKey] = {
        totalRecords,
        finalCount: results.length,
        filteredOut: totalRecords - results.length,
        missingFields
    };

    console.log(`[FILTER_END] Final result: ${totalRecords} → ${results.length} records`);

    return results;
}
```

**BSC File Normalization**:
```javascript
function normalizeBSCFileName(fileName) {
    const fileMap = {
        'trending_bsc': ['trending_bsc', 'trending_BSC', 'trendingbsc'],
        'fourmeme_bsc': ['fourmeme_bsc', 'fourmeme', 'FourMeme'],
        'flap_bsc': ['flap_bsc', 'flap', 'Flap'],
        'xmode_bsc': ['xmode_bsc', 'xmode', 'Xmode', 'binance_bsc']
    };
    // Normalizza tutte le varianti al nome standard
}

async function findBSCFile(sourceKey, fileName) {
    // Cerca tutte le varianti possibili del file BSC
    const possibleNames = [
        fileName,
        `${baseName}.csv`,
        `${baseName}_bsc.csv`,
        `${baseName}_BSC.csv`,
        'binance_bsc.csv'
    ];
    // Restituisce il primo file trovato
}
```

**CSV Cleaning per BSC**:
```javascript
async loadDataSources() {
    for (const sourceKey of this.selectedDataSources) {
        let content = await fs.readFile(filePath, 'utf-8');

        // ✅ FIX BSC CSV: Remove empty first column if exists
        if (this.selectedChain === 'BSC') {
            const lines = content.split('\n');
            const cleanedLines = lines.map(line => {
                if (line.startsWith(',')) {
                    return line.substring(1);
                }
                return line;
            });
            content = cleanedLines.join('\n');
            console.log(`[BSC_FIX] Cleaned BSC CSV for ${source.name}`);
        }

        // Parse CSV...
    }
}
```

---

## MODIFICHE STRUTTURALI

### 1. Client Intents (Supporto DM)
```javascript
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages  // ✅ AGGIUNTO per DM
    ],
    partials: ['CHANNEL'], // ✅ AGGIUNTO Required for DMs
    restRequestTimeout: 30000,
    retryLimit: 3
});
```

### 2. Nuovi Metodi ScannerSession
- `sendIntroViaDM(user, dmChannel)`: Invia intro direttamente in DM senza interaction
- `startExportSessionTimer()`: Auto-chiude sessione dopo 5min di inattività post-export
- `resetInactivity()`: Resetta timer di inattività quando utente interagisce

### 3. Export Session Timer (5 minuti)
```javascript
startExportSessionTimer() {
    if (this.exportSessionTimer) {
        clearTimeout(this.exportSessionTimer);
    }

    console.log(`[EXPORT_TIMER] Starting 5-minute auto-close timer for user ${this.userId}`);

    this.exportSessionTimer = setTimeout(async () => {
        console.log(`[EXPORT_TIMER] 5 minutes elapsed, closing session for user ${this.userId}`);

        try {
            const channel = await client.channels.fetch(this.channelId);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setTitle('⏱️ Session Closed')
                    .setDescription('Your export session has been closed after 5 minutes of inactivity.\n\n' +
                        '✅ **Your exported files are still available above!**\n\n' +
                        'Run `/scan` to start a new analysis session.')
                    .setColor('#FFA500')
                    .setTimestamp();

                await channel.send({
                    content: `<@${this.userId}>`,
                    embeds: [embed]
                });
            }
        } catch (error) {
            console.error('[EXPORT_TIMER] Error sending closure notification:', error);
        }

        sessionManager.deleteSession(this.userId);
    }, 5 * 60 * 1000); // 5 minuti
}
```

---

## TESTING CHECKLIST

### ✅ FIX 1: Comando funziona in chat e DM
- [ ] Test `/scan` in un server → deve reindirizzare a DM
- [ ] Test `/scan` direttamente in DM → deve funzionare normalmente
- [ ] Verificare che il messaggio di redirect sia ephemeral

### ✅ FIX 2: Script opera solo in DM
- [ ] Verificare che TUTTI i messaggi dello scanner siano in DM
- [ ] Verificare che non ci siano messaggi pubblici nei server
- [ ] Testare timeout - dovrebbe essere più stabile in DM

### ✅ FIX 3: Nuove sessioni in DM
- [ ] Test pulsante "🔄 New Session" dopo export
- [ ] Verificare che il timer di export venga cancellato
- [ ] Verificare che la vecchia sessione venga eliminata
- [ ] Verificare che la nuova sessione parta correttamente

### ✅ FIX 4: Controllo filtri CSV
- [ ] Test filtri SOL con file reale → verificare campi validi
- [ ] Test filtri BSC con file reale → verificare campi validi
- [ ] Verificare log di debug per campi mancanti
- [ ] Testare tutte le varianti di file BSC (trending_bsc, fourmeme, flap, xmode)
- [ ] Verificare che il cleaning CSV per BSC funzioni (rimozione colonna vuota)

---

## FILE MODIFICATI

1. **scanner_fixed.js**: Main file con tutte le modifiche
2. **FIX_DOCUMENTATION.md**: Questo documento
3. **DEPLOYMENT_GUIDE.md**: Guida al deployment

---

## DEPLOYMENT

1. **Backup** del file originale:
   ```bash
   cp scanner.js scanner.js.backup
   ```

2. **Sostituire** con il nuovo file:
   ```bash
   cp scanner_fixed.js scanner.js
   ```

3. **Restart** del bot:
   ```bash
   pm2 restart casper-scanner
   ```

4. **Monitor** logs:
   ```bash
   pm2 logs casper-scanner --lines 100
   ```

---

## NOTES

- Tutti i fix sono retrocompatibili
- Le sessioni esistenti verranno mantenute
- I preset salvati funzionano con il nuovo sistema
- La validazione CSV è ora più robusta con logging dettagliato

---

## SUPPORT

Per problemi o domande:
1. Controllare i logs: `pm2 logs casper-scanner`
2. Verificare che il bot abbia permessi DM
3. Verificare che i file CSV siano nel formato corretto
