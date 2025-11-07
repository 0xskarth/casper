// ========================================
// DATA SOURCES CONFIGURATION - SOL and BSC
// ========================================

const DATA_SOURCES = {
    'SOL': {
        'bonk': { name: 'Bonk', description: 'Bonk ecosystem analysis', file: 'bonk.csv', icon: '🐕' },
        'pumpfun': { name: 'PumpFun', description: 'PumpFun platform analysis', file: 'pumpfun.csv', icon: '🚀' },
        'trending': { name: 'Trending', description: 'Trending wallets analysis', file: 'trending.csv', icon: '📈' },
        'trendfun': { name: 'TrendFun', description: 'TrendFun platform analysis', file: 'trendfun.csv', icon: '🎨' },
        'boop': { name: 'Boop', description: 'Boop platform analysis', file: 'boop.csv', icon: '🎯' },
        'believe': { name: 'Believe', description: 'Believe platform analysis', file: 'believe.csv', icon: '✨' },
        'launchlab': { name: 'LaunchLab', description: 'LaunchLab platform analysis', file: 'launchlab.csv', icon: '🚀' },
        'heaven': { name: 'Heaven', description: 'Heaven platform analysis', file: 'heaven.csv', icon: '☁️' },
        'moonit': { name: 'MoonIt', description: 'MoonIt platform analysis', file: 'moonit.csv', icon: '🌙' },
        'meteora': { name: 'Meteora', description: 'Meteora DEX analysis', file: 'meteora.csv', icon: '💫' },
        'jupiter': { name: 'Jupiter', description: 'Jupiter aggregator analysis', file: 'jupiter.csv', icon: '🪐' }
    },
    'BSC': {
        'trending_bsc': {
            name: 'Trending BSC',
            description: 'Trending BSC wallets',
            file: 'trending_bsc.csv',
            icon: '📈'
        },
        'fourmeme': {
            name: 'FourMeme',
            description: 'FourMeme platform analysis',
            file: 'fourmeme_bsc.csv',
            icon: '4️⃣'
        },
        'flap': {
            name: 'Flap',
            description: 'Flap platform analysis',
            file: 'flap_bsc.csv',
            icon: '🦅'
        },
        'xmode': {
            name: 'Xmode',
            description: 'Xmode Smart Chain traders',
            file: 'xmode_bsc.csv',
            icon: '⚡'
        }
    }
};

module.exports = { DATA_SOURCES };
