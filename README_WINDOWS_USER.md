# 🪟 GUIDA COMPLETA PER UTENTE WINDOWS

## 📍 Il tuo file scanner
Path: `C:\Users\baker\OneDrive\Desktop\caspersolutions\scanner\index.js`

---

## ✅ SOLUZIONE RAPIDA - 3 OPZIONI

### 🎯 OPZIONE 1: Download dal Repository (PIÙ VELOCE)

1. **Apri il browser** e vai su:
   ```
   https://github.com/0xskarth/casper
   ```

2. **Vai al branch** con i fix:
   ```
   Branch: claude/monolithic-code-review-011CUtazA91GTNfQDWyeLmKk
   ```

3. **Scarica questi file**:
   - `MODIFICHE_DA_APPLICARE.md` (guida modifiche)
   - `FIX_DOCUMENTATION.md` (documentazione tecnica)
   - `scanner_fixed.js` + `scanner_fixed_part2.js` (codice base)

4. **Applica le modifiche** seguendo `MODIFICHE_DA_APPLICARE.md`

---

### 🎯 OPZIONE 2: Modifiche Manuali (PIÙ SICURO - 15 min)

Applica manualmente le 9 modifiche al tuo `index.js`:

#### **BACKUP PRIMA DI TUTTO**
```cmd
cd C:\Users\baker\OneDrive\Desktop\caspersolutions\scanner
copy index.js index.js.backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%
```

#### **MODIFICHE DA APPLICARE**

##### ✅ MODIFICA 1: Imports (riga ~1)
**TROVA:**
```javascript
const {
    Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, AttachmentBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
```

**SOSTITUISCI CON:**
```javascript
const {
    Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, AttachmentBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType  // ✅ AGGIUNTO
} = require('discord.js');
```

---

##### ✅ MODIFICA 2: Client Config (riga ~565)
**TROVA:**
```javascript
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
```

**SOSTITUISCI CON:**
```javascript
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages  // ✅ AGGIUNTO per DM
    ],
    partials: ['CHANNEL'],  // ✅ AGGIUNTO per DM
    restRequestTimeout: 30000,
    retryLimit: 3
});
```

---

##### ✅ MODIFICA 3: Aggiungi nuovo metodo nella classe ScannerSession

**TROVA** il metodo `sendIntro` nella classe `ScannerSession` e **AGGIUNGI DOPO**:

```javascript
// ✅ FIX 1 & 2: Nuovo metodo per inviare intro in DM
async sendIntroViaDM(user, dmChannel) {
    const embed = new EmbedBuilder()
        .setTitle('🔮 Casper | Scanner')
        .setDescription(`Welcome to **Casper Scanner** - Multi-Chain Trading Analysis\n\n` +
            `**Chains Supported:**\n` +
            `• 🟣 **Solana** - 11 data sources\n` +
            `• 🟡 **BSC** - 4 data sources\n\n` +
            `**Features:**\n` +
            `• 📊 Chain-specific filters (SOL/BSC)\n` +
            `• 📅 3 separate fields (Min/Max/Period)\n` +
            `• ✏️ Edit filters/sources from results\n` +
            `• 💾 Separate SOL & BSC presets\n` +
            `• 📑 Export results with chain indicator\n\n` +
            `**Getting Started:**\n` +
            `1️⃣ Choose chain (SOL/BSC)\n` +
            `2️⃣ Setup chain-specific filters\n` +
            `3️⃣ Select data sources\n` +
            `4️⃣ Export results`)
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
    console.log(`[SESSION] Intro sent via DM to user ${this.userId}`);
}
```

---

##### ✅ MODIFICA 4: Command Handler (riga ~1800)

**TROVA** (nel handler `client.on('interactionCreate')`):
```javascript
if (interaction.isCommand()) {
    if (interaction.commandName === 'scan') {
        const session = await sessionManager.getSession(userId, interaction.channelId);
        await session.sendIntro(interaction);
    }
}
```

**SOSTITUISCI CON:**
```javascript
if (interaction.isCommand()) {
    if (interaction.commandName === 'scan') {
        // ✅ FIX 1 & 2: Check se è in DM
        const isDM = interaction.channel?.type === ChannelType.DM;

        if (!isDM) {
            // In server - redirect to DM
            await interaction.reply({
                content: '✅ **Opening Scanner in DM...**\n\n' +
                    '📬 **Check your Direct Messages!**\n\n' +
                    'The scanner will open in your DMs for privacy.',
                ephemeral: true
            });

            try {
                const dmChannel = await interaction.user.createDM();
                const session = await sessionManager.getSession(userId, dmChannel.id);
                await session.sendIntroViaDM(interaction.user, dmChannel);
                console.log(`[SCAN] Redirected user ${userId} to DM`);
            } catch (error) {
                console.error('[SCAN] Failed to open DM:', error);
                await interaction.followUp({
                    content: '❌ **Could not open DM**\n\n' +
                        'Please enable **Direct Messages** in Privacy Settings.',
                    ephemeral: true
                });
            }
        } else {
            // Già in DM
            const session = await sessionManager.getSession(userId, interaction.channelId);
            await session.sendIntro(interaction);
            console.log(`[SCAN] Started in DM for user ${userId}`);
        }
    }
}
```

---

##### ✅ MODIFICA 5: BSC CSV Cleaning in loadDataSources

**TROVA** nel metodo `loadDataSources()`:
```javascript
if (await fs.pathExists(filePath)) {
    let content = await fs.readFile(filePath, 'utf-8');

    const parsed = Papa.parse(content, {
```

**SOSTITUISCI CON:**
```javascript
if (await fs.pathExists(filePath)) {
    let content = await fs.readFile(filePath, 'utf-8');

    // ✅ FIX 4: Fix BSC CSV - Remove empty first column
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

    const parsed = Papa.parse(content, {
```

---

##### ✅ MODIFICA 6: Field Validation in applyFilters

**TROVA** all'inizio del metodo `applyFilters()`:
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
```

**AGGIUNGI DOPO** (prima del loop dei filtri):
```javascript
// ✅ FIX 4: VALIDAZIONE CAMPI CSV
const missingFields = [];

console.log(`\n[FILTER_START] Applying ${Object.keys(filters).length} filters to ${sourceKey}`);
console.log(`[FILTER] Chain: ${this.selectedChain}`);
console.log(`[FILTER] Starting with ${totalRecords} records`);

const sampleRow = data[0];
const availableFields = Object.keys(sampleRow);
console.log(`[FILTER] Available fields (first 20):`, availableFields.slice(0, 20));

for (const filterKey of Object.keys(filters)) {
    if (!(filterKey in sampleRow)) {
        missingFields.push(filterKey);
        console.warn(`[WARNING] ⚠️ Field '${filterKey}' NOT FOUND in CSV!`);
        console.warn(`[SUGGESTION] Available similar:`, availableFields.filter(f => f.includes(filterKey.split('_').pop())));
    } else {
        console.log(`[VALIDATION] ✓ Field '${filterKey}' exists in CSV`);
    }
}
```

E alla **FINE del metodo**, prima del `return results`:
```javascript
// Store debug info
this.debugInfo[sourceKey] = {
    totalRecords,
    finalCount: results.length,
    filteredOut: totalRecords - results.length,
    missingFields
};

console.log(`[FILTER_END] Final: ${totalRecords} → ${results.length} records\n`);
```

---

##### ✅ MODIFICA 7: Export Timer in ScannerSession

**AGGIUNGI** questo nuovo metodo nella classe `ScannerSession`:

```javascript
// ✅ FIX 3: Timer auto-chiusura dopo export
startExportSessionTimer() {
    if (this.exportSessionTimer) {
        clearTimeout(this.exportSessionTimer);
    }

    console.log(`[EXPORT_TIMER] Starting 5-min timer for user ${this.userId}`);

    this.exportSessionTimer = setTimeout(async () => {
        console.log(`[EXPORT_TIMER] 5 min elapsed, closing for user ${this.userId}`);

        try {
            const channel = await client.channels.fetch(this.channelId);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setTitle('⏱️ Session Closed')
                    .setDescription('Your export session closed after 5 minutes.\n\n' +
                        '✅ **Files still available above!**\n\n' +
                        'Run `/scan` for new analysis.')
                    .setColor('#FFA500')
                    .setTimestamp();

                await channel.send({ content: `<@${this.userId}>`, embeds: [embed] });
            }
        } catch (error) {
            console.error('[EXPORT_TIMER] Error:', error);
        }

        sessionManager.deleteSession(this.userId);
    }, 5 * 60 * 1000); // 5 minuti
}
```

---

##### ✅ MODIFICA 8: Chiama timer in exportResults

**TROVA** alla fine del metodo `exportResults()`:
```javascript
await interaction.editReply({
    embeds: [exportEmbed],
    files: attachments,
    components: [row],
    ephemeral: true
});
```

**AGGIUNGI SUBITO DOPO:**
```javascript
// ✅ FIX 3: Avvia timer
this.startExportSessionTimer();
```

---

##### ✅ MODIFICA 9: Pulsante New Session

**TROVA** in `handleButtonInteraction` e **AGGIUNGI** questo case:

```javascript
case 'new_session_after_export':
    if (session.exportSessionTimer) {
        clearTimeout(session.exportSessionTimer);
        session.exportSessionTimer = null;
    }

    sessionManager.deleteSession(session.userId);
    const newSession = await sessionManager.getSession(interaction.user.id, interaction.channelId);

    await safeReply(interaction, {
        content: '✨ Starting new session...',
        ephemeral: true
    });

    setTimeout(async () => {
        await newSession.sendIntro(interaction);
    }, 1000);

    console.log(`[NEW_SESSION] User ${session.userId} started new session`);
    break;
```

E **MODIFICA** il row buttons in exportResults per aggiungere il pulsante:
```javascript
const row = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('new_session_after_export')
            .setLabel('🔄 New Session')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✨'),
        new ButtonBuilder()
            .setCustomId('export_results')
            .setLabel('📥 Export Again')
            .setStyle(ButtonStyle.Secondary)
    );
```

---

### 🧪 TESTING

Dopo aver applicato le modifiche:

```cmd
# 1. Verifica sintassi
node -c index.js

# 2. Se OK, restart
pm2 restart scanner
# oppure
node index.js

# 3. Test in Discord
/scan (da un server) → Deve aprire DM
/scan (da DM) → Deve funzionare direttamente
```

---

### 🎯 OPZIONE 3: Script Automatico

Se preferisci, posso crearti uno **script PowerShell** che applica automaticamente alcune modifiche.

Vuoi che te lo crei?

---

## 📊 RIEPILOGO FIX

| Fix | Descrizione | Modifiche |
|-----|-------------|-----------|
| **FIX 1** | Comando in chat e DM | Mod 1, 2, 3, 4 |
| **FIX 2** | Solo DM | Mod 2, 4 |
| **FIX 3** | Nuove sessioni | Mod 7, 8, 9 |
| **FIX 4** | Validazione CSV | Mod 5, 6 |

---

## 🆘 SUPPORTO

Se hai problemi:
1. Controlla i logs: `pm2 logs scanner`
2. Verifica sintassi: `node -c index.js`
3. Fai backup prima di ogni modifica
4. Testa una modifica alla volta

---

## ✅ CHECKLIST FINALE

- [ ] Backup fatto
- [ ] Tutte le 9 modifiche applicate
- [ ] Sintassi verificata (`node -c index.js`)
- [ ] Bot riavviato
- [ ] Test `/scan` da server → apre DM
- [ ] Test `/scan` da DM → funziona
- [ ] Test export → timer 5min attivo
- [ ] Test New Session button → funziona

---

**Buon lavoro! 🚀**
