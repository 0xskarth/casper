# 🔧 MODIFICHE DA APPLICARE AL CODICE

## 📍 MODIFICA 1: Client Configuration (riga ~565)

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
        GatewayIntentBits.DirectMessages  // ✅ FIX 2: Supporto DM
    ],
    partials: ['CHANNEL'], // ✅ FIX 2: Required for DMs
    restRequestTimeout: 30000,
    retryLimit: 3
});
```

---

## 📍 MODIFICA 2: ScannerSession Class - Aggiungi nuovo metodo (dopo sendIntro)

**AGGIUNGI QUESTO NUOVO METODO** nella classe `ScannerSession`:

```javascript
// ✅ FIX 1 & 2: Nuovo metodo per inviare intro direttamente in DM
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
            `• 📑 Export results with chain indicator\n` +
            `• 💎 Universal wallet balance tracking\n` +
            `• 🔍 Advanced debug & validation\n\n` +
            `**Getting Started:**\n` +
            `1️⃣ Choose chain (SOL/BSC)\n` +
            `2️⃣ Setup chain-specific filters\n` +
            `3️⃣ Select data sources\n` +
            `4️⃣ Export results\n` +
            `5️⃣ Edit & refine without restart!`)
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

## 📍 MODIFICA 3: Export Session Timer - Aggiungi metodo (nella classe ScannerSession)

**AGGIUNGI QUESTO METODO** nella classe `ScannerSession`:

```javascript
// ✅ FIX 3: Timer per auto-chiusura dopo export
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
                    .setFooter({ text: 'Thank you for using Casper Scanner!' })
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

## 📍 MODIFICA 4: Export Results - Modifica nel metodo exportResults

**TROVA** (nel metodo `exportResults` della classe `ScannerSession`):
```javascript
await interaction.editReply({
    embeds: [exportEmbed],
    files: attachments,
    components: [row],
    ephemeral: true
});
```

**SOSTITUISCI CON:**
```javascript
// ✅ FIX 3: Export con timer e pulsante New Session
const exportEmbed = new EmbedBuilder()
    .setTitle('✅ Export Complete!')
    .setDescription(`📥 **${this.selectedChain} Export Ready!**\n\n` +
        `⛓️ **Chain:** ${chainEmoji} ${this.selectedChain}\n` +
        `📊 **Format:** ${formatText}\n` +
        `📋 **Parameters:** All included\n` +
        `🔄 **Duplicates:** Removed\n\n` +
        `📁 **Files:** casper_${this.selectedChain}_[source]_YYYYMMDD_HHMMSS`)
    .setColor('#00FF00')
    .setFooter({ text: '⏱️ Session will close in 5 minutes if inactive' })
    .setTimestamp();

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

await interaction.editReply({
    embeds: [exportEmbed],
    files: attachments,
    components: [row],
    ephemeral: true
});

// ✅ FIX 3: Avvia timer di 5 minuti per chiusura sessione
this.startExportSessionTimer();
```

---

## 📍 MODIFICA 5: Button Handler - Aggiungi nuovo case

**TROVA** la funzione `handleButtonInteraction` e **AGGIUNGI** questo case nello switch:

```javascript
case 'new_session_after_export':
    // ✅ FIX 3: Pulisci timer di export
    if (session.exportSessionTimer) {
        clearTimeout(session.exportSessionTimer);
        session.exportSessionTimer = null;
    }

    // Elimina sessione corrente
    sessionManager.deleteSession(session.userId);

    // Crea nuova sessione
    const newSessionAfterExport = await sessionManager.getSession(interaction.user.id, interaction.channelId);

    const restartEmbed = new EmbedBuilder()
        .setTitle('✨ Starting New Session')
        .setDescription('Your previous export is complete.\n\nStarting a fresh analysis session...')
        .setColor(EMBED_COLOR)
        .setFooter({ text: 'Loading scanner...' })
        .setTimestamp();

    await safeReply(interaction, {
        embeds: [restartEmbed],
        ephemeral: true
    });

    // Avvia nuova sessione dopo 1 secondo
    setTimeout(async () => {
        await newSessionAfterExport.sendIntro(interaction);
    }, 1000);

    console.log(`[NEW_SESSION] User ${session.userId} started new session after export`);
    break;
```

---

## 📍 MODIFICA 6: Command Handler - PRINCIPALE MODIFICA FIX 1 & 2

**TROVA** (nel `client.on('interactionCreate')` handler):
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
            // ✅ FIX 2: In server - redirect to DM
            await interaction.reply({
                content: '✅ **Opening Scanner in DM...**\n\n' +
                    '📬 **Check your Direct Messages!**\n\n' +
                    'The scanner will open in your DMs for privacy and better performance.',
                ephemeral: true
            });

            try {
                const dmChannel = await interaction.user.createDM();
                const session = await sessionManager.getSession(userId, dmChannel.id);

                // ✅ Invia intro direttamente nel DM
                await session.sendIntroViaDM(interaction.user, dmChannel);

                console.log(`[SCAN] Redirected user ${userId} to DM`);
            } catch (error) {
                console.error('[SCAN] Failed to open DM:', error);
                await interaction.followUp({
                    content: '❌ **Could not open DM**\n\n' +
                        'Please enable **Direct Messages from server members** in your Privacy Settings.\n\n' +
                        '**How to enable:**\n' +
                        '1. Right-click server name\n' +
                        '2. Privacy Settings\n' +
                        '3. Enable "Direct Messages"',
                    ephemeral: true
                });
            }
        } else {
            // ✅ FIX 1: Già in DM - funziona normalmente
            const session = await sessionManager.getSession(userId, interaction.channelId);
            await session.sendIntro(interaction);
            console.log(`[SCAN] Started in DM for user ${userId}`);
        }
    }
}
```

---

## 📍 MODIFICA 7: Load Data Sources - FIX 4 BSC CSV Cleaning

**TROVA** nel metodo `loadDataSources()` della classe `ScannerSession`:
```javascript
if (await fs.pathExists(filePath)) {
    let content = await fs.readFile(filePath, 'utf-8');

    const parsed = Papa.parse(content, {
```

**SOSTITUISCI CON:**
```javascript
if (await fs.pathExists(filePath)) {
    let content = await fs.readFile(filePath, 'utf-8');

    // ✅ FIX 4: Fix BSC CSV - Remove empty first column if exists
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

## 📍 MODIFICA 8: Apply Filters - FIX 4 Field Validation

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
const filterStats = {};

console.log(`\n[FILTER_START] ========== Applying ${Object.keys(filters).length} filters to ${sourceKey} ==========`);
console.log(`[FILTER] Chain: ${this.selectedChain}`);
console.log(`[FILTER] Starting with ${totalRecords} records`);

const sampleRow = data[0];
const availableFields = Object.keys(sampleRow);
console.log(`[FILTER] Available fields (first 20):`, availableFields.slice(0, 20));

for (const filterKey of Object.keys(filters)) {
    if (!(filterKey in sampleRow)) {
        missingFields.push(filterKey);
        console.warn(`[WARNING] ⚠️ Field '${filterKey}' NOT FOUND in CSV!`);
        console.warn(`[SUGGESTION] Available similar fields:`, availableFields.filter(f => f.includes(filterKey.split('_').pop())));
    } else {
        console.log(`[VALIDATION] ✓ Field '${filterKey}' exists in CSV`);
    }
}
```

---

## 📍 MODIFICA 9: SessionManager deleteSession - Aggiungi pulizia timer export

**TROVA** nel metodo `deleteSession()` del `SessionManager`:
```javascript
deleteSession(userId) {
    if (this.activityTimers.has(userId)) {
        clearTimeout(this.activityTimers.get(userId));
        this.activityTimers.delete(userId);
    }

    const session = this.sessions.get(userId);
    if (session?.activityCheckTimer) {
        clearTimeout(session.activityCheckTimer);
    }
```

**AGGIUNGI DOPO**:
```javascript
    // ✅ FIX 3: Pulisci export timer
    if (session?.exportSessionTimer) {
        clearTimeout(session.exportSessionTimer);
        session.exportSessionTimer = null;
        console.log(`[SESSION] Cleared export timer for user ${userId}`);
    }
```

---

## ✅ FINE MODIFICHE

### 🔧 COME APPLICARE

1. **Backup** del file originale:
   ```bash
   cp scanner.js scanner.js.backup_$(date +%Y%m%d_%H%M%S)
   ```

2. **Applica** le modifiche sopra al tuo file `scanner.js`

3. **Verifica** la sintassi:
   ```bash
   node -c scanner.js
   ```

4. **Restart** del bot:
   ```bash
   pm2 restart casper-scanner
   ```

5. **Monitor** logs:
   ```bash
   pm2 logs casper-scanner --lines 100 --raw
   ```

### 📊 TEST RAPIDO

```bash
# Test 1: Comando in server (deve reindirizzare a DM)
/scan (in un canale server)

# Test 2: Comando in DM (deve funzionare direttamente)
/scan (in DM con il bot)

# Test 3: Export e new session
# Completa un'analisi → Export → Clicca "🔄 New Session"

# Test 4: Validazione CSV
# Verifica nei logs che i campi CSV siano trovati correttamente
pm2 logs casper-scanner | grep -i "validation\|bsc_fix"
```

---

**TUTTI I FIX SONO STATI IMPLEMENTATI! ✅**
