// ========================================
// PRESET SERVICE
// ========================================
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
    loadUserPresets,
    deleteUserPreset
};