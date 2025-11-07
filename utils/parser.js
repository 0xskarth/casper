// ========================================
// PARSER UTILITIES
// ========================================

function parseValue(value) {
    if (value === null || value === 'null' || value === undefined || value === '' || value === 'undefined') {
        return 0;
    }
    
    if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
    }
    
    let strValue = String(value).trim();
    
    if (strValue.toLowerCase() === 'yes' || strValue.toLowerCase() === 'true') return 1;
    if (strValue.toLowerCase() === 'no' || strValue.toLowerCase() === 'false') return 0;
    
    strValue = strValue.replace(/^["']|["']$/g, '').trim();
    
    if (strValue === '' || strValue === 'null' || strValue === 'undefined') return 0;
    
    // Handle K, M, B suffixes
    if (strValue.endsWith('K') || strValue.endsWith('k')) {
        const num = parseFloat(strValue.slice(0, -1));
        return isNaN(num) ? 0 : num * 1000;
    }
    if (strValue.endsWith('M') || strValue.endsWith('m')) {
        const num = parseFloat(strValue.slice(0, -1));
        return isNaN(num) ? 0 : num * 1000000;
    }
    if (strValue.endsWith('B') || strValue.endsWith('b')) {
        const num = parseFloat(strValue.slice(0, -1));
        return isNaN(num) ? 0 : num * 1000000000;
    }
    
    strValue = strValue.replace(/[$,€£¥]/g, '');
    
    if (strValue.endsWith('%')) {
        strValue = strValue.slice(0, -1).trim();
    }
    
    const parsed = parseFloat(strValue);
    return isNaN(parsed) ? 0 : parsed;
}

function formatBundlerValue(value) {
    const val = parseValue(value);
    return val === 1 ? 'Yes' : 'No';
}

function formatDate(dateString) {
    if (!dateString || dateString === 'null' || dateString === '-') return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) { 
        return ''; 
    }
}

function generateFileName(prefix = 'casper', chain = '', extension = 'csv') {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const chainPrefix = chain ? `_${chain}` : '';
    return `${prefix}${chainPrefix}_${year}${month}${day}_${hours}${minutes}${seconds}.${extension}`;
}

module.exports = {
    parseValue,
    formatBundlerValue,
    formatDate,
    generateFileName
};