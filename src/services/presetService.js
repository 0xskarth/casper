// ========================================
// PRESET SERVICE - Chain-Specific Preset Management
// ========================================

const fs = require('fs-extra');
const path = require('path');

class PresetService {
    constructor() {
        this.userPresetsSOL = new Map();
        this.userPresetsBSC = new Map();
    }

    async saveUserPreset(userId, presetName, filters, chain) {
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

            if (chain === 'BSC') {
                this.userPresetsBSC.set(userId, userPresets);
            } else {
                this.userPresetsSOL.set(userId, userPresets);
            }

            return true;
        } catch (error) {
            console.error('Error saving preset:', error);
            return false;
        }
    }

    async loadUserPresets(userId, chain) {
        try {
            const presetsPath = `./data/presets_${chain.toLowerCase()}`;
            const userPresetsFile = path.join(presetsPath, `${userId}.json`);

            if (await fs.pathExists(userPresetsFile)) {
                const presets = await fs.readJson(userPresetsFile);
                if (chain === 'BSC') {
                    this.userPresetsBSC.set(userId, presets);
                } else {
                    this.userPresetsSOL.set(userId, presets);
                }
                return presets;
            }
            return {};
        } catch (error) {
            console.error('Error loading presets:', error);
            return {};
        }
    }

    async deleteUserPreset(userId, presetName, chain) {
        try {
            const userPresets = await this.loadUserPresets(userId, chain);
            if (userPresets[presetName]) {
                delete userPresets[presetName];
                await fs.writeJson(`./data/presets_${chain.toLowerCase()}/${userId}.json`, userPresets, { spaces: 2 });
                if (chain === 'BSC') {
                    this.userPresetsBSC.set(userId, userPresets);
                } else {
                    this.userPresetsSOL.set(userId, userPresets);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting preset:', error);
            return false;
        }
    }

    async loadAllPresets() {
        // Carica tutti i preset esistenti all'avvio
        const presetsSOLPath = './data/presets_sol';
        const presetsBSCPath = './data/presets_bsc';

        if (await fs.pathExists(presetsSOLPath)) {
            const files = await fs.readdir(presetsSOLPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const userId = file.replace('.json', '');
                    const presets = await fs.readJson(path.join(presetsSOLPath, file));
                    this.userPresetsSOL.set(userId, presets);
                }
            }
        }

        if (await fs.pathExists(presetsBSCPath)) {
            const files = await fs.readdir(presetsBSCPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const userId = file.replace('.json', '');
                    const presets = await fs.readJson(path.join(presetsBSCPath, file));
                    this.userPresetsBSC.set(userId, presets);
                }
            }
        }

        console.log(`[PRESETS] Loaded SOL presets for ${this.userPresetsSOL.size} users`);
        console.log(`[PRESETS] Loaded BSC presets for ${this.userPresetsBSC.size} users`);
    }
}

module.exports = PresetService;
