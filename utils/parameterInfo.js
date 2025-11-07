// ========================================
// PARAMETER INFO UTILITY
// ========================================
const { METRICS_SYSTEM_SOL, METRICS_SYSTEM_BSC } = require('../config/metrics');
const { TIME_PERIODS } = require('../config/constants');

function getParameterInfo(fieldName, chain) {
    const metricsSystem = chain === 'BSC' ? METRICS_SYSTEM_BSC : METRICS_SYSTEM_SOL;
    
    // Prima cerca senza periodo
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

    // Poi cerca con periodo (1d_, 7d_, 30d_)
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

    // Fallback
    return { 
        min: 0, 
        max: 100000, 
        unit: 'value', 
        description: fieldName, 
        format: 'number' 
    };
}

module.exports = { getParameterInfo };