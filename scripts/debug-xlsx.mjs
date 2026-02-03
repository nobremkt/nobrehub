/**
 * Script para analisar a estrutura da planilha
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const INPUT_FILE = path.join(process.cwd(), '!🧠 CÉREBRO', 'PRODUÇÃO JANEIRO 2026.xlsx');
const OUTPUT_FILE = path.join(process.cwd(), '!🧠 CÉREBRO', 'debug-structure.json');

console.log('📖 Lendo arquivo:', INPUT_FILE);
const workbook = XLSX.readFile(INPUT_FILE);

const result = {
    sheets: workbook.SheetNames,
    firstSheetData: []
};

// Analisar primeira aba e uma do meio
const sheetsToAnalyze = [workbook.SheetNames[0], workbook.SheetNames[10]];

for (const sheetName of sheetsToAnalyze) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    result[sheetName] = {
        totalRows: data.length,
        range: sheet['!ref'],
        first10Rows: data.slice(0, 15).map((row, i) => ({
            rowNum: i,
            cells: row.filter(c => c !== '').slice(0, 10) // Só primeiras 10 células não vazias
        }))
    };
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf8');
console.log('✅ Salvo em:', OUTPUT_FILE);
