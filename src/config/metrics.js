// ========================================
// METRICS SYSTEM - SOL and BSC Chain Specific
// ========================================

const METRICS_SYSTEM_SOL = {
    'profit_loss': {
        label: '💰 Profit & Loss',
        emoji: '💰',
        description: 'Profit and loss metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'realized_profit', label: 'Realized Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 },
            { id: 'unrealized_profit_total', label: 'Unrealized Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 },
            { id: 'realized_profit_pct', label: 'Realized Profit %', unit: '%', defaultMin: -100, defaultMax: 10000 },
            { id: 'total_profit', label: 'Total Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 },
            { id: 'total_profit_pct', label: 'Total Profit %', unit: '%', defaultMin: -100, defaultMax: 10000 }
        ]
    },
    'pnl_distribution': {
        label: '📊 PnL Distribution',
        emoji: '📊',
        description: 'Profit distribution across tokens',
        supportsPeriod: true,
        metrics: [
            { id: 'pnl_lt_minus50', label: 'Heavy Loss (<-50%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_minus50_0', label: 'Loss (-50% to 0%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_0_2x', label: 'Profit (0% to 2x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_2x_5x', label: 'Good Profit (2x-5x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_gt_5x', label: 'Great Profit (>5x)', unit: '#', defaultMin: 0, defaultMax: 1000 }
        ]
    },
    'marketcap': {
        label: '🎯 Market Cap Trading',
        emoji: '🎯',
        description: 'Trading by market cap size',
        supportsPeriod: true,
        metrics: [
            { id: 'mcap_gt_500k', label: 'Large Cap (>500k)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'mcap_100k_500k', label: 'Mid Cap (100k-500k)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'mcap_lt_100k', label: 'Small Cap (<100k)', unit: '#', defaultMin: 0, defaultMax: 1000 }
        ]
    },
    'trading_activity': {
        label: '📈 Trading Activity',
        emoji: '📈',
        description: 'Trading patterns and frequency',
        supportsPeriod: true,
        metrics: [
            { id: 'buy', label: 'Buy Count', unit: '#', defaultMin: 0, defaultMax: 10000 },
            { id: 'sell', label: 'Sell Count', unit: '#', defaultMin: 0, defaultMax: 10000 },
            { id: 'trades', label: 'Total Trades', unit: '#', defaultMin: 0, defaultMax: 20000 },
            { id: 'unique_tokens', label: 'Unique Tokens', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'avg_buy_per_token', label: 'Avg Buy per Token', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'avg_sell_per_token', label: 'Avg Sell per Token', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'avg_holding_period_min', label: 'Avg Hold Time (minutes)', unit: 'min', defaultMin: 0, defaultMax: 10000 },
            { id: 'transfer_in', label: 'Transfers In', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'transfer_out', label: 'Transfers Out', unit: '#', defaultMin: 0, defaultMax: 1000 }
        ]
    },
    'performance': {
        label: '🏆 Performance',
        emoji: '🏆',
        description: 'Success metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'winrate', label: 'Win Rate', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'token_active', label: 'Active Tokens', unit: '#', defaultMin: 0, defaultMax: 100 }
        ]
    },
    'volume': {
        label: '💹 Volume & Liquidity',
        emoji: '💹',
        description: 'Trading volumes',
        supportsPeriod: true,
        metrics: [
            { id: 'total_volume', label: 'Total Volume', unit: '$', defaultMin: 0, defaultMax: 10000000 },
            { id: 'total_bought_cost', label: 'Total Bought', unit: '$', defaultMin: 0, defaultMax: 10000000 },
            { id: 'total_sold_income', label: 'Total Sold', unit: '$', defaultMin: 0, defaultMax: 10000000 },
            { id: 'avg_buy_cost', label: 'Avg Buy Cost', unit: '$', defaultMin: 0, defaultMax: 100000 },
            { id: 'avg_sell_cost', label: 'Avg Sell Cost', unit: '$', defaultMin: 0, defaultMax: 100000 }
        ]
    },
    'risk': {
        label: '⚡ Risk Indicators',
        emoji: '⚡',
        description: 'Risk metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'quick_trades', label: 'Quick Trade Count', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'quick_trades_ratio', label: 'Quick Trade %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'honeypot_tokens', label: 'Honeypot Tokens', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'honeypot_ratio', label: 'Honeypot %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'no_buy_hold', label: 'No Buy Hold', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'no_buy_hold_ratio', label: 'No Buy Hold %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'sell_pass_buy', label: 'Sell > Buy', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'sell_pass_buy_ratio', label: 'Sell > Buy %', unit: '%', defaultMin: 0, defaultMax: 100 }
        ]
    },
    'fees': {
        label: '💸 Fees',
        emoji: '💸',
        description: 'Transaction costs',
        supportsPeriod: true,
        metrics: [
            { id: 'total_fee_usd', label: 'Total Fees', unit: '$', defaultMin: 0, defaultMax: 10000 }
        ]
    },
    'wallet_info': {
        label: '💎 Wallet Info',
        emoji: '💎',
        description: 'Wallet balance and information',
        supportsPeriod: false,
        metrics: [
            { id: 'sol_balance', label: 'SOL Balance', unit: 'SOL', defaultMin: 0, defaultMax: 10000 },
            { id: 'bundler', label: 'Is Bundler', unit: 'BOOL', defaultMin: 0, defaultMax: 1 }
        ]
    }
};

const METRICS_SYSTEM_BSC = {
    'profit_loss': {
        label: '💰 Profit & Loss',
        emoji: '💰',
        description: 'Profit and loss metrics',
        supportsPeriod: false,
        metrics: [
            { id: 'total_profit', label: 'Total Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 },
            { id: 'total_profit_pct', label: 'Total Profit %', unit: '%', defaultMin: -100, defaultMax: 10000 },
            { id: 'unrealized_profit_total', label: 'Unrealized Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 }
        ]
    },
    'historic_pnl': {
        label: '📊 Historic PnL Distribution',
        emoji: '📊',
        description: 'Historic profit distribution',
        supportsPeriod: false,
        metrics: [
            { id: 'historic_pnl_lt_minus50', label: 'Heavy Loss (<-50%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'historic_pnl_minus50_0', label: 'Loss (-50% to 0%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'historic_pnl_0_2x', label: 'Profit (0% to 2x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'historic_pnl_2x_5x', label: 'Good Profit (2x-5x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'historic_pnl_gt_5x', label: 'Great Profit (>5x)', unit: '#', defaultMin: 0, defaultMax: 1000 }
        ]
    },
    'period_metrics': {
        label: '📅 Period Metrics',
        emoji: '📅',
        description: 'Time-based metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'realized_profit', label: 'Realized Profit', unit: '$', defaultMin: -100000, defaultMax: 1000000 },
            { id: 'realized_profit_pct', label: 'Realized Profit %', unit: '%', defaultMin: -100, defaultMax: 10000 },
            { id: 'pnl_lt_nd5', label: 'Heavy Loss (<-50%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_nd5_0x', label: 'Loss (-50% to 0%)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_0_2x', label: 'Profit (0% to 2x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_2x_5x', label: 'Good Profit (2x-5x)', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'pnl_gt_5x', label: 'Great Profit (>5x)', unit: '#', defaultMin: 0, defaultMax: 1000 }
        ]
    },
    'trading_activity': {
        label: '📈 Trading Activity',
        emoji: '📈',
        description: 'Trading patterns',
        supportsPeriod: true,
        metrics: [
            { id: 'buy', label: 'Buy Count', unit: '#', defaultMin: 0, defaultMax: 10000 },
            { id: 'sell', label: 'Sell Count', unit: '#', defaultMin: 0, defaultMax: 10000 },
            { id: 'trades', label: 'Total Trades', unit: '#', defaultMin: 0, defaultMax: 20000 },
            { id: 'unique_tokens', label: 'Unique Tokens', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'avg_buy_per_token', label: 'Avg Buy per Token', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'avg_sell_per_token', label: 'Avg Sell per Token', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'avg_buy_cost', label: 'Avg Buy Cost', unit: '$', defaultMin: 0, defaultMax: 100000 },
            { id: 'avg_sell_cost', label: 'Avg Sell Cost', unit: '$', defaultMin: 0, defaultMax: 100000 }
        ]
    },
    'performance': {
        label: '🏆 Performance',
        emoji: '🏆',
        description: 'Success metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'winrate', label: 'Win Rate', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'token_active', label: 'Active Tokens', unit: '#', defaultMin: 0, defaultMax: 100 }
        ]
    },
    'volume': {
        label: '💹 Volume',
        emoji: '💹',
        description: 'Trading volumes',
        supportsPeriod: true,
        metrics: [
            { id: 'total_volume', label: 'Total Volume', unit: '$', defaultMin: 0, defaultMax: 10000000 },
            { id: 'total_bought_cost', label: 'Total Bought', unit: '$', defaultMin: 0, defaultMax: 10000000 },
            { id: 'total_sold_income', label: 'Total Sold', unit: '$', defaultMin: 0, defaultMax: 10000000 }
        ]
    },
    'risk': {
        label: '⚡ Risk Indicators',
        emoji: '⚡',
        description: 'Risk metrics',
        supportsPeriod: true,
        metrics: [
            { id: 'quick_trades', label: 'Quick Trade Count', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'quick_trades_ratio', label: 'Quick Trade %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'honeypot_tokens', label: 'Honeypot Tokens', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'honeypot_ratio', label: 'Honeypot %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'no_buy_hold_ratio', label: 'No Buy Hold %', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'sell_pass_buy_ratio', label: 'Sell > Buy %', unit: '%', defaultMin: 0, defaultMax: 100 }
        ]
    },
    'fees': {
        label: '💸 Fees',
        emoji: '💸',
        description: 'Transaction costs',
        supportsPeriod: true,
        metrics: [
            { id: 'total_fee_usd', label: 'Total Fees', unit: '$', defaultMin: 0, defaultMax: 10000 }
        ]
    },
    'wallet_info': {
        label: '💎 Wallet Info',
        emoji: '💎',
        description: 'Wallet balance',
        supportsPeriod: false,
        metrics: [
            { id: 'bnb_balance', label: 'BNB Balance', unit: 'BNB', defaultMin: 0, defaultMax: 10000 },
            { id: 'bundler', label: 'Is Bundler', unit: 'BOOL', defaultMin: 0, defaultMax: 1 }
        ]
    },
    'historic_info': {
        label: '📚 Historic Info',
        emoji: '📚',
        description: 'Historic metrics',
        supportsPeriod: false,
        metrics: [
            { id: 'winrate_historic', label: 'Historic Win Rate', unit: '%', defaultMin: 0, defaultMax: 100 },
            { id: 'historic_unique_tokens', label: 'Historic Tokens', unit: '#', defaultMin: 0, defaultMax: 1000 },
            { id: 'historic_token_active', label: 'Historic Active', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'historic_avg_holding_period_min', label: 'Historic Hold Time (min)', unit: 'min', defaultMin: 0, defaultMax: 10000 },
            { id: 'historic_no_buy_hold', label: 'Historic No Buy Hold', unit: '#', defaultMin: 0, defaultMax: 100 },
            { id: 'historic_sell_pass_buy', label: 'Historic Sell > Buy', unit: '#', defaultMin: 0, defaultMax: 100 }
        ]
    }
};

module.exports = {
    METRICS_SYSTEM_SOL,
    METRICS_SYSTEM_BSC
};
