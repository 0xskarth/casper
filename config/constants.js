// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const EMBED_COLOR = '#71ff9e';
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const BRAND_COLORS = {
    PRIMARY: 'FF71FF9E',
    SECONDARY: 'FF1A2332',
    TEXT: 'FFFFFFFF',
    SUBTEXT: 'FFB0B0B0',
    PROFIT: 'FF00FF88',
    LOSS: 'FFFF4444',
    HEADER: 'FF2D3E50',
    DARK_BACKGROUND: 'FF01080C',
    DARK_ALT: 'FF0D1218',
    HYPERLINK: 'FF60A5FA'
};

const BRAND_ASSETS = {
    logo: './assets/logo.png',
    banner: './assets/banner.png',
    footer: 'Casper | CT',
    footerLogo: './assets/logos.png'
};

// ========================================
// ROLE MAPPING PER NOTIFICHE CSV
// ========================================
const LIST_ROLE_MAPPING = {
    'bonk': '1428836143834726551',
    'pumpfun': '1428836081658499083',
    'trending': '1428836723852312728',
    'meteora': '1428836114755747951',
    'moonit': '1428836696321036539',
    'jupiter': '1428836483422224594',
    'trending_bsc': '1428836752017330310',
    'fourmeme': '1428836796141277214',
    'flap': '1428836774846795898',
    'xmode': '1428877533180592219'
};

// ========================================
// TIME PERIODS
// ========================================
const TIME_PERIODS = ['1d', '7d', '30d'];

module.exports = {
    EMBED_COLOR,
    LOG_CHANNEL_ID,
    BRAND_COLORS,
    BRAND_ASSETS,
    LIST_ROLE_MAPPING,
    TIME_PERIODS
};