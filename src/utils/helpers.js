// ========================================
// HELPERS - General Utility Functions
// ========================================

const fs = require('fs-extra');
const path = require('path');
const { METRICS_SYSTEM_SOL, METRICS_SYSTEM_BSC } = require('../config/metrics');
const { TIME_PERIODS } = require('../config/constants');
const { parseValue } = require('./formatters');

function getParameterInfo(fieldName, chain) {
    const metricsSystem = chain === 'BSC' ? METRICS_SYSTEM_BSC : METRICS_SYSTEM_SOL;

    for (const category of Object.values(metricsSystem)) {
        const metric = category.metrics.find(m => m.id === fieldName);
        if (metric) {
            return {
                min: metric.defaultMin,
                max: metric.defaultMax,
                unit: metric.unit,
                description: metric.label,
                format: metric.unit === '$' ? 'currency' :
                    metric.unit === '%' ? 'percent_no_divide' :
                    metric.unit === 'SOL' || metric.unit === 'BNB' ? 'native' :
                    metric.unit === 'BOOL' ? 'boolean' : 'number'
            };
        }
    }

    for (const period of TIME_PERIODS) {
        const fieldWithoutPeriod = fieldName.replace(`${period}_`, '');
        for (const category of Object.values(metricsSystem)) {
            const metric = category.metrics.find(m => m.id === fieldWithoutPeriod);
            if (metric) {
                return {
                    min: metric.defaultMin,
                    max: metric.defaultMax,
                    unit: metric.unit,
                    description: `${period} ${metric.label}`,
                    format: metric.unit === '$' ? 'currency' :
                        metric.unit === '%' ? 'percent_no_divide' :
                        metric.unit === 'SOL' || metric.unit === 'BNB' ? 'native' :
                        metric.unit === 'BOOL' ? 'boolean' : 'number'
                };
            }
        }
    }

    return { min: 0, max: 100000, unit: 'value', description: fieldName, format: 'number' };
}

function normalizeBSCFileName(fileName) {
    const normalizedName = fileName.toLowerCase();
    const nameWithoutExt = normalizedName.replace(/\.(csv|txt)$/, '');

    const fileMap = {
        'trending_bsc': ['trending_bsc', 'trending_BSC', 'trending_Bsc', 'TrendingBSC', 'trendingbsc'],
        'fourmeme_bsc': ['fourmeme_bsc', 'fourmeme_BSC', 'Fourmeme_bsc', 'Fourmeme_BSC', 'fourmeme', 'FourMeme'],
        'flap_bsc': ['flap_bsc', 'flap_BSC', 'Flap_bsc', 'Flap_BSC', 'flap', 'Flap'],
        'xmode_bsc': ['xmode_bsc', 'xmode_BSC', 'Xmode_bsc', 'Xmode_BSC', 'xmode', 'Xmode', 'binance_bsc', 'binance_BSC']
    };

    for (const [standardName, variations] of Object.entries(fileMap)) {
        for (const variation of variations) {
            if (nameWithoutExt.includes(variation.toLowerCase())) {
                return standardName;
            }
        }
    }

    return nameWithoutExt;
}

async function findBSCFile(sourceKey, fileName) {
    const dataPath = './data';
    const baseName = normalizeBSCFileName(fileName);

    const possibleNames = [
        fileName,
        `${baseName}.csv`,
        `${baseName}.txt`,
        `${baseName}_bsc.csv`,
        `${baseName}_BSC.csv`,
        `${baseName.charAt(0).toUpperCase() + baseName.slice(1)}_bsc.csv`,
        `${baseName.charAt(0).toUpperCase() + baseName.slice(1)}_BSC.csv`,
        `${baseName}_bsc.txt`,
        `${baseName}_BSC.txt`,
        `${baseName.replace('_bsc', '')}.csv`,
        `${baseName.replace('_bsc', '')}.txt`,
        'binance_bsc.csv',
        'binance_BSC.csv'
    ];

    const uniqueNames = [...new Set(possibleNames)];

    console.log(`[BSC_SEARCH] Looking for ${sourceKey}:`);
    console.log(`[BSC_SEARCH] Base name: ${baseName}`);
    console.log(`[BSC_SEARCH] Trying ${uniqueNames.length} variations...`);

    for (const name of uniqueNames) {
        const filePath = path.join(dataPath, name);
        if (await fs.pathExists(filePath)) {
            console.log(`[BSC_SEARCH] ✅ FOUND: ${name}`);
            return filePath;
        }
    }

    console.log(`[BSC_SEARCH] ❌ NOT FOUND: Tried all variations`);
    return null;
}

module.exports = {
    getParameterInfo,
    normalizeBSCFileName,
    findBSCFile
};
