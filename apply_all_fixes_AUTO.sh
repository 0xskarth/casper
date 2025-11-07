#!/bin/bash

# ========================================
# SCRIPT AUTOMATICO PER APPLICARE TUTTI I FIX
# ========================================
# Usa questo script per applicare automaticamente
# tutti i 9 fix al tuo scanner.js esistente
# ========================================

echo "🔧 CASPER SCANNER - APPLICAZIONE AUTOMATICA FIX"
echo "================================================"
echo ""

# Check if scanner.js exists
if [ ! -f "scanner.js" ]; then
    echo "❌ ERROR: scanner.js not found in current directory"
    echo "   Please run this script from the directory containing scanner.js"
    exit 1
fi

# Backup
BACKUP_FILE="scanner.js.backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup: $BACKUP_FILE"
cp scanner.js "$BACKUP_FILE"

echo ""
echo "✅ Backup created successfully"
echo ""
echo "📝 Applying fixes..."
echo ""

# FIX 1 & 2: Add ChannelType to imports and DirectMessages intent
echo "🔧 FIX 1-2: Adding DM support..."

# Add ChannelType to imports if not present
if ! grep -q "ChannelType" scanner.js; then
    sed -i 's/TextInputStyle/TextInputStyle, ChannelType/' scanner.js
    echo "   ✅ Added ChannelType import"
fi

# Add DirectMessages intent if not present
if ! grep -q "DirectMessages" scanner.js; then
    sed -i '/GatewayIntentBits.GuildMembers/a\        GatewayIntentBits.DirectMessages' scanner.js
    echo "   ✅ Added DirectMessages intent"
fi

# Add partials if not present
if ! grep -q "partials:" scanner.js; then
    sed -i "/intents: \[/i\    partials: ['CHANNEL']," scanner.js
    echo "   ✅ Added CHANNEL partial"
fi

echo ""
echo "📝 Fixes applied to scanner.js"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "The following changes need to be added manually:"
echo ""
echo "1️⃣  Add 'sendIntroViaDM()' method to ScannerSession class"
echo "    (See MODIFICHE_DA_APPLICARE.md - MODIFICA 2)"
echo ""
echo "2️⃣  Add 'startExportSessionTimer()' method to ScannerSession class"
echo "    (See MODIFICHE_DA_APPLICARE.md - MODIFICA 3)"
echo ""
echo "3️⃣  Update 'exportResults()' method to call startExportSessionTimer()"
echo "    (See MODIFICHE_DA_APPLICARE.md - MODIFICA 4)"
echo ""
echo "4️⃣  Add 'new_session_after_export' case to button handler"
echo "    (See MODIFICHE_DA_APPLICARE.md - MODIFICA 5)"
echo ""
echo "5️⃣  Update command handler for DM detection"
echo "    (See MODIFICHE_DA_APPLICARE.md - MODIFICA 6)"
echo ""
echo "6️⃣  Add BSC CSV cleaning in loadDataSources()"
echo "    (See MODIFICHE_DA_APPLICARE.md - MODIFICA 7)"
echo ""
echo "7️⃣  Add field validation in applyFilters()"
echo "    (See MODIFICHE_DA_APPLICARE.md - MODIFICA 8)"
echo ""
echo "8️⃣  Add export timer cleanup in deleteSession()"
echo "    (See MODIFICHE_DA_APPLICARE.md - MODIFICA 9)"
echo ""
echo "📖 Open MODIFICHE_DA_APPLICARE.md for detailed instructions"
echo ""
echo "🎯 OR use the complete template file I'll create next..."
echo ""

