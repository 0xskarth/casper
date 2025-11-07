// ========================================
// CASPER | SCANNER - VERSIONE COMPLETA E AGGIORNATA
// ========================================
// ✅ FIX 1: Comando funziona in chat e DM  
// ✅ FIX 2: Script opera SOLO in DM
// ✅ FIX 3: Nuove sessioni in DM
// ✅ FIX 4: Validazione filtri CSV BSC/SOL
// ========================================
// PRONTO PER ESSERE USATO - SOSTITUISCI scanner.js CON QUESTO FILE
// ========================================

const {
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, AttachmentBuilder,
    ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType
} = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const Papa = require('papaparse');
const ExcelJS = require('exceljs');
const EventEmitter = require('events');
const crypto = require('crypto');
const chokidar = require('chokidar');
require('dotenv').config();

