// ========================================
// EXCEL EXPORT - Dark Themed Excel Generation
// ========================================

const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const { BRAND_COLORS, BRAND_ASSETS } = require('../config/constants');
const { getParameterInfo } = require('./helpers');
const { parseValue, formatBundlerValue, formatDate } = require('./formatters');

async function createDarkThemedExcel(results, sourceName, chain = 'SOL') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Casper | Scanner';
    workbook.lastModifiedBy = 'Casper | CT';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet(`${chain} Trading Data`, {
        properties: {
            tabColor: { argb: BRAND_COLORS.PRIMARY.replace('FF', '') },
            defaultColWidth: 18
        },
        views: [{
            showGridLines: false
        }]
    });

    // Logo area - DIMEZZATO
    const logoPath = './assets/logo.png';
    if (await fs.pathExists(logoPath)) {
        try {
            const logoImage = workbook.addImage({
                filename: logoPath,
                extension: 'png',
            });
            worksheet.addImage(logoImage, {
                tl: { col: 0, row: 0 },
                br: { col: 6, row: 5 },
                editAs: 'oneCell'
            });
            console.log('[EXCEL] ✅ Logo added (half size)');
        } catch (error) {
            console.error('[EXCEL] ⚠️ Logo error:', error.message);
        }
    }

    // Logo area height - DIMEZZATO
    for (let i = 1; i <= 5; i++) {
        worksheet.getRow(i).height = 15;
    }

    // Background logo area - DIMEZZATO
    for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= 6; col++) {
            const cell = worksheet.getCell(row, col);
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: BRAND_COLORS.DARK_BACKGROUND }
            };
        }
    }

    if (results.length === 0) {
        return workbook;
    }

    const headers = Object.keys(results[0]);
    const columnCount = headers.length;

    worksheet.columns = headers.map((header, index) => {
        let width = 18;
        if (header === 'address' || header === 'wallet_address') width = 45;
        else if (header === 'gmgn_url') width = 60;
        else if (header.includes('balance')) width = 15;
        else if (header.includes('profit')) width = 15;
        else if (header.includes('winrate')) width = 12;
        else if (header.includes('_fee_')) width = 12;
        return {
            key: header,
            width: width
        };
    });

    // Header row
    const headerRow = worksheet.getRow(6);
    headerRow.height = 30;
    headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header.replace(/_/g, ' ').toUpperCase();
        cell.font = {
            name: 'Arial',
            size: 11,
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };
        cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: BRAND_COLORS.HEADER }
        };
        cell.border = {
            bottom: { style: 'thick', color: { argb: BRAND_COLORS.PRIMARY } }
        };
    });

    // Dati
    results.forEach((row, rowIndex) => {
        const dataRow = worksheet.getRow(7 + rowIndex);
        dataRow.height = 25;

        headers.forEach((header, colIndex) => {
            const cell = dataRow.getCell(colIndex + 1);
            const value = row[header];

            // FIX: Gestione wallet_address come TESTO
            if (header === 'wallet_address' || header === 'address') {
                cell.numFmt = '@';
                cell.value = String(value || '');
                cell.font = {
                    name: 'Consolas',
                    size: 9,
                    color: { argb: BRAND_COLORS.TEXT }
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'left'
                };
            }
            // GMGN URL - ORA MOSTRA URL COMPLETO
            else if (header === 'gmgn_url' && value) {
                cell.value = value;
                cell.font = {
                    name: 'Arial',
                    size: 9,
                    color: { argb: BRAND_COLORS.HYPERLINK }
                };
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: 'left'
                };
            }
            else if (header.includes('timestamp') || header.includes('date')) {
                cell.value = formatDate(value);
                cell.font = { name: 'Arial', size: 10, color: { argb: BRAND_COLORS.SUBTEXT } };
            }
            else if (header === 'bundler') {
                cell.value = formatBundlerValue(value);
                cell.font = {
                    name: 'Arial',
                    size: 10,
                    color: { argb: value === '1' || value === 'Yes' ? BRAND_COLORS.PROFIT : BRAND_COLORS.SUBTEXT }
                };
            }
            else {
                const paramInfo = getParameterInfo(header, chain);
                const numValue = parseValue(value);

                if (paramInfo.format === 'currency') {
                    cell.value = numValue;
                    cell.numFmt = '$#,##0.00';
                    cell.font = {
                        name: 'Arial',
                        size: 10,
                        color: { argb: numValue >= 0 ? BRAND_COLORS.PROFIT : BRAND_COLORS.LOSS }
                    };
                } else if (paramInfo.format === 'percent_no_divide') {
                    cell.value = numValue;
                    cell.numFmt = '0.00%';
                    cell.font = {
                        name: 'Arial',
                        size: 10,
                        color: { argb: numValue >= 50 ? BRAND_COLORS.PROFIT : BRAND_COLORS.TEXT }
                    };
                } else if (paramInfo.format === 'native') {
                    cell.value = numValue;
                    cell.numFmt = '0.0000';
                    cell.font = { name: 'Arial', size: 10, color: { argb: BRAND_COLORS.TEXT } };
                } else if (paramInfo.format === 'number') {
                    cell.value = numValue;
                    cell.numFmt = '#,##0';
                    cell.font = { name: 'Arial', size: 10, color: { argb: BRAND_COLORS.TEXT } };
                } else {
                    cell.value = value;
                    cell.font = { name: 'Arial', size: 10, color: { argb: BRAND_COLORS.TEXT } };
                }
            }

            // Allineamento condizionale
            if (!cell.alignment) {
                cell.alignment = {
                    vertical: 'middle',
                    horizontal: header === 'address' || header === 'wallet_address' || header === 'gmgn_url' ? 'left' : 'center'
                };
            }

            // Background alternato
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: rowIndex % 2 === 0 ? BRAND_COLORS.DARK_BACKGROUND : BRAND_COLORS.DARK_ALT }
            };

            // Bordi
            cell.border = {
                left: { style: 'thin', color: { argb: '20FFFFFF' } },
                right: { style: 'thin', color: { argb: '20FFFFFF' } },
                bottom: { style: 'thin', color: { argb: '10FFFFFF' } }
            };
        });
    });

    // Footer info
    const footerRow = worksheet.getRow(7 + results.length + 2);
    footerRow.height = 20;
    const footerCell = footerRow.getCell(1);
    footerCell.value = `Generated by Casper Scanner | Chain: ${chain} | ${new Date().toLocaleString('it-IT')} | Total: ${results.length} results`;
    footerCell.font = {
        name: 'Arial',
        size: 9,
        italic: true,
        color: { argb: BRAND_COLORS.SUBTEXT }
    };
    footerCell.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.mergeCells(footerRow.number, 1, footerRow.number, Math.min(columnCount, 10));

    // Autofilter
    worksheet.autoFilter = {
        from: { row: 6, column: 1 },
        to: { row: 6 + results.length, column: columnCount }
    };

    return workbook;
}

module.exports = { createDarkThemedExcel };
