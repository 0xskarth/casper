// ========================================
// FILTER BUILDER - Chain-Specific Filter Management
// ========================================

const { METRICS_SYSTEM_SOL, METRICS_SYSTEM_BSC } = require('../config/metrics');

class FilterBuilder {
    constructor() {
        this.selectedFilters = [];
        this.pendingFilters = [];
        this.tempSelectedMetrics = [];
        this.tempCategory = null;
        this.chain = null;
        this.multipleFiltersQueue = [];
        this.currentFilterIndex = 0;
    }

    setChain(chain) {
        this.chain = chain;
    }

    getMetricsSystem() {
        return this.chain === 'BSC' ? METRICS_SYSTEM_BSC : METRICS_SYSTEM_SOL;
    }

    getFiltersForRemoval() {
        return this.selectedFilters.map((filter, index) => ({
            id: index,
            label: filter.label,
            period: filter.period,
            min: filter.min,
            max: filter.max,
            unit: filter.unit,
            description: `${filter.label}${filter.period ? ` [${filter.period.toUpperCase()}]` : ''}: ${filter.min}-${filter.max} ${filter.unit}`
        }));
    }

    removeMultipleFilters(indices) {
        indices.sort((a, b) => b - a);
        for (const index of indices) {
            this.removeFilter(index);
        }
    }

    setupMultipleFiltersConfiguration(groupId, metrics, period = null) {
        this.multipleFiltersQueue = [];
        this.currentFilterIndex = 0;

        for (const metric of metrics) {
            this.multipleFiltersQueue.push({
                groupId,
                metricId: metric.id,
                label: metric.label,
                unit: metric.unit,
                defaultMin: metric.defaultMin,
                defaultMax: metric.defaultMax,
                period: period,
                uniqueId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
        }
    }

    getNextFilterToConfig() {
        if (this.currentFilterIndex < this.multipleFiltersQueue.length) {
            return this.multipleFiltersQueue[this.currentFilterIndex];
        }
        return null;
    }

    moveToNextFilter() {
        this.currentFilterIndex++;
        return this.currentFilterIndex < this.multipleFiltersQueue.length;
    }

    clearFilterQueue() {
        this.multipleFiltersQueue = [];
        this.currentFilterIndex = 0;
    }

    addPendingFilters(groupId, metrics, period = null) {
        this.pendingFilters = [];
        for (const metric of metrics) {
            this.pendingFilters.push({
                groupId,
                metricId: metric.id,
                label: metric.label,
                unit: metric.unit,
                defaultMin: metric.defaultMin,
                defaultMax: metric.defaultMax,
                period: period,
                uniqueId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
        }
    }

    removeFilter(index) {
        if (index >= 0 && index < this.selectedFilters.length) {
            this.selectedFilters.splice(index, 1);
        }
    }

    getFiltersForProcessing() {
        const filters = {};
        for (const filter of this.selectedFilters) {
            filters[filter.filterKey] = {
                min: filter.min,
                max: filter.max,
                label: filter.label,
                unit: filter.unit,
                period: filter.period
            };
        }
        return filters;
    }

    loadFromPreset(preset) {
        this.selectedFilters = preset.filters || [];
        this.pendingFilters = [];
        this.tempSelectedMetrics = [];
        this.tempCategory = null;
        this.clearFilterQueue();
    }

    clear() {
        this.selectedFilters = [];
        this.pendingFilters = [];
        this.tempSelectedMetrics = [];
        this.tempCategory = null;
        this.clearFilterQueue();
    }

    getGroupedFilterSummary() {
        const grouped = {};
        for (const filter of this.selectedFilters) {
            const key = filter.label;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            const periodText = filter.period ? `[${filter.period.toUpperCase()}]` : '';
            const min = filter.min !== null ? `≥${filter.min}` : 'no min';
            const max = filter.max !== null ? `≤${filter.max}` : 'unlimited';
            grouped[key].push({
                period: filter.period,
                display: `${periodText} ${min} - ${max} ${filter.unit}`,
                filter: filter
            });
        }

        for (const key in grouped) {
            grouped[key].sort((a, b) => {
                const periodOrder = { '1d': 1, '7d': 2, '30d': 3, null: 4 };
                return (periodOrder[a.period] || 4) - (periodOrder[b.period] || 4);
            });
        }

        return grouped;
    }

    setTempSelectedMetrics(category, metricIds) {
        this.tempCategory = category;
        this.tempSelectedMetrics = metricIds;
    }

    getTempSelectedMetrics() {
        return {
            category: this.tempCategory,
            metrics: this.tempSelectedMetrics
        };
    }

    clearTempSelectedMetrics() {
        this.tempSelectedMetrics = [];
        this.tempCategory = null;
    }

    getFilterSummary() {
        if (this.selectedFilters.length === 0) {
            return { count: 0, details: 'No filters active' };
        }

        const grouped = this.getGroupedFilterSummary();
        const lines = [];

        for (const [metricName, instances] of Object.entries(grouped)) {
            if (instances.length === 1) {
                lines.push(`• **${metricName}**: ${instances[0].display}`);
            } else {
                lines.push(`• **${metricName}**:`);
                for (const inst of instances) {
                    lines.push(`  └─ ${inst.display}`);
                }
            }
        }

        return {
            count: this.selectedFilters.length,
            details: lines.join('\n')
        };
    }
}

module.exports = FilterBuilder;
