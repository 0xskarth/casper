// ========================================
// READY EVENT - INIZIALIZZAZIONE BOT
// ========================================
const fs = require('fs-extra');
const path = require('path');
const { logToChannel } = require('../services/notificationService');
const { DATA_SOURCES } = require('../config/dataSources');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`
╔════════════════════════════════════════╗
║         🔮 CASPER SCANNER              ║
╠════════════════════════════════════════╣
║  ✅ Bot Online: ${client.user.tag.padEnd(22)}║
║  📊 Guilds: ${client.guilds.cache.size.toString().padEnd(27)}║
║  👥 Users: ${client.users.cache.size.toString().padEnd(28)}║
║  ⚡ Chains: SOL & BSC                  ║
║  📱 DM Support: ENABLED                ║
╚════════════════════════════════════════╝
        `);

        // ✅ REGISTRA COMANDI CON SUPPORTO DM
        const commands = [
            {
                name: 'scan',
                description: '🔮 Avvia Casper Scanner - Analisi Trading Multi-Chain',
                dm_permission: true // ✅ ABILITA IN DM
            }
        ];

        try {
            console.log('📝 Registering slash commands...');
            await client.application.commands.set(commands);
            console.log('✅ Commands registered successfully (Guild + DM)');
        } catch (error) {
            console.error('❌ Error registering commands:', error);
        }

        // Inizializza CSV Watcher
        await client.csvWatcher.init();
        console.log('✅ CSV File Watcher initialized');

        // Log inizializzazione
        await logToChannel(client, null, {
            title: '🚀 Scanner Started',
            description: 'Casper Scanner is now online!',
            fields: [
                { name: '⛓️ Chains', value: 'SOL & BSC', inline: true },
                { name: '📊 SOL Sources', value: Object.keys(DATA_SOURCES.SOL).length.toString(), inline: true },
                { name: '📊 BSC Sources', value: Object.keys(DATA_SOURCES.BSC).length.toString(), inline: true },
                { name: '📱 DM Support', value: 'ENABLED', inline: true }
            ],
            color: '#00FF00'
        });

        // Carica preset esistenti
        await loadAllPresets(client);
        console.log('✅ Presets loaded');
    }
};

// ========================================
// CARICA TUTTI I PRESET
// ========================================
async function loadAllPresets(client) {
    const presetsSOLPath = './data/presets_sol';
    const presetsBSCPath = './data/presets_bsc';
    
    if (await fs.pathExists(presetsSOLPath)) {
        const files = await fs.readdir(presetsSOLPath);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const userId = file.replace('.json', '');
                const presets = await fs.readJson(path.join(presetsSOLPath, file));
                client.userPresetsSOL.set(userId, presets);
            }
        }
        console.log(`✅ Loaded SOL presets for ${client.userPresetsSOL.size} users`);
    }

    if (await fs.pathExists(presetsBSCPath)) {
        const files = await fs.readdir(presetsBSCPath);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const userId = file.replace('.json', '');
                const presets = await fs.readJson(path.join(presetsBSCPath, file));
                client.userPresetsBSC.set(userId, presets);
            }
        }
        console.log(`✅ Loaded BSC presets for ${client.userPresetsBSC.size} users`);
    }
}