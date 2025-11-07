// ========================================
// CASPER | SCANNER - VERSIONE AGGIORNATA
// ========================================
const {
    Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder,
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
