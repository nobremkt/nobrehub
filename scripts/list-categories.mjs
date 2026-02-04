/**
 * Script para listar TODAS as categorias/dificuldades únicas na planilha
 */

import XLSX from 'xlsx';
import path from 'path';

const INPUT_FILE = path.join(process.cwd(), '!🧠 CÉREBRO', 'PRODUÇÃO JANEIRO 2026.xlsx');
console.log('📖 Lendo arquivo:', INPUT_FILE);

const workbook = XLSX.readFile(INPUT_FILE);
const allCategories = new Set();
const categoryCount = {};

for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (data.length < 3) continue;

    // Linha 1 contém "PROJETO", "PONTUAÇÃO", "DIFICULDADE" repetidamente
    // A dificuldade está nas colunas 2, 5, 8, 11... (a cada 3 colunas)

    for (let rowIdx = 2; rowIdx < data.length; rowIdx++) {
        const row = data[rowIdx];

        // Pegar todas as colunas de dificuldade (a cada 3 colunas, começando da 2)
        for (let col = 2; col < row.length; col += 3) {
            const difficulty = String(row[col] || '').trim();
            if (difficulty && difficulty !== '') {
                const normalized = difficulty.toLowerCase();
                allCategories.add(normalized);
                categoryCount[normalized] = (categoryCount[normalized] || 0) + 1;
            }
        }
    }
}

console.log('\n📋 TODAS as categorias/dificuldades encontradas:\n');

// Ordenar por quantidade
const sorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
for (const [cat, count] of sorted) {
    console.log(`  ${count.toString().padStart(4)} x "${cat}"`);
}

console.log(`\n📊 Total de categorias únicas: ${allCategories.size}`);
