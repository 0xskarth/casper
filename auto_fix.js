#!/usr/bin/env node

/**
 * SCRIPT AUTOMATICO - Applica TUTTI i FIX al tuo index.js
 * 
 * USO:
 *   node auto_fix.js
 * 
 * Il tuo index.js deve essere nella stessa cartella
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 CASPER SCANNER - AUTO FIX SCRIPT');
console.log('=====================================\n');

// File paths
const indexPath = process.argv[2] || './index.js';
const backupPath = indexPath + '.backup.' + Date.now();
const outputPath = indexPath + '.fixed';

// Check if index.js exists
if (!fs.existsSync(indexPath)) {
    console.error('❌ ERROR: index.js not found!');
    console.error('   Please run this script from the same folder as index.js');
    console.error('   Or provide the path: node auto_fix.js /path/to/index.js');
    process.exit(1);
}

console.log('📁 Found:', indexPath);
console.log('💾 Creating backup:', backupPath);

// Backup
fs.copyFileSync(indexPath, backupPath);
console.log('✅ Backup created\n');

// Read file
let code = fs.readFileSync(indexPath, 'utf-8');
let changes = 0;

console.log('🔧 Applying fixes...\n');

// FIX 1: Add ChannelType to imports
if (!code.includes('ChannelType')) {
    console.log('✅ FIX 1: Adding ChannelType import');
    code = code.replace(
        /TextInputStyle\s*\}/,
        'TextInputStyle, ChannelType }'
    );
    changes++;
}

// FIX 2: Add DirectMessages intent
if (!code.includes('DirectMessages')) {
    console.log('✅ FIX 2: Adding DirectMessages intent');
    code = code.replace(
        /GatewayIntentBits\.GuildMembers/,
        'GatewayIntentBits.GuildMembers,\n        GatewayIntentBits.DirectMessages'
    );
    changes++;
}

// FIX 2: Add partials
if (!code.includes("partials:")) {
    console.log('✅ FIX 2: Adding partials for DM support');
    code = code.replace(
        /const client = new Client\(\{\s*intents:/,
        "const client = new Client({\n    partials: ['CHANNEL'],\n    intents:"
    );
    changes++;
}

console.log('\n📊 Applied', changes, 'automatic fixes');
console.log('\n⚠️  MANUAL STEPS REQUIRED:');
console.log('   The following need to be added manually:');
console.log('   - sendIntroViaDM() method');
console.log('   - startExportSessionTimer() method  ');
console.log('   - DM detection in command handler');
console.log('   - BSC CSV cleaning');
console.log('   - Field validation');
console.log('');
console.log('📖 See MODIFICHE_DA_APPLICARE.md for complete instructions');
console.log('');

// Write output
fs.writeFileSync(outputPath, code);

console.log('✅ Fixed file saved as:', outputPath);
console.log('');
console.log('🎯 NEXT STEPS:');
console.log('   1. Review the fixed file');
console.log('   2. Complete manual steps from MODIFICHE_DA_APPLICARE.md');
console.log('   3. Test: node -c', outputPath);
console.log('   4. If OK: copy', outputPath, 'to', indexPath);
console.log('   5. Restart bot');
console.log('');

