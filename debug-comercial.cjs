const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '!🧠 CÉREBRO', '2025 - Planilhas do Comercial');
const lines = [];
const log = (s) => { lines.push(s); };

function quickHeaders(file) {
    log(`\n--- ${file} ---`);
    const wb = XLSX.readFile(path.join(dir, file));
    log(`Sheets (${wb.SheetNames.length}): ${wb.SheetNames.slice(0, 5).join(' | ')}${wb.SheetNames.length > 5 ? ' ...' : ''}`);

    // Get header row (row 5 in main sheets) from first data sheet
    const dataSheet = wb.SheetNames.find(n => !n.includes('BRANCO')) || wb.SheetNames[1];
    if (dataSheet) {
        const ws = wb.Sheets[dataSheet];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        // Find header row
        for (let i = 0; i < Math.min(10, json.length); i++) {
            const row = json[i];
            if (row && row.some(c => String(c).includes('Empresa') || String(c).includes('Vendedora') || String(c).includes('Telefone'))) {
                log(`  Header (row ${i}): ${JSON.stringify(row.slice(0, 22))}`);
                // Show 2 data rows
                if (json[i + 1]) log(`  Data 1: ${JSON.stringify(json[i + 1].slice(0, 22).map(c => typeof c === 'string' ? c.substring(0, 30) : c))}`);
                if (json[i + 2]) log(`  Data 2: ${JSON.stringify(json[i + 2].slice(0, 22).map(c => typeof c === 'string' ? c.substring(0, 30) : c))}`);
                break;
            }
        }
    }

    // Count total data rows across all sheets
    let totalDataRows = 0;
    for (const name of wb.SheetNames) {
        if (name.includes('BRANCO')) continue;
        const ws = wb.Sheets[name];
        if (!ws['!ref']) continue;
        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const dataRows = json.filter((r, i) => i > 5 && r.some(c => c !== '')).length;
        totalDataRows += dataRows;
    }
    log(`  Total data rows (approx): ${totalDataRows}`);
}

const files = ['FEVEREIRO.xlsx', 'MAIO.xlsx', 'AGOSTO.xlsx', 'NOVEMBRO.xlsx', 'DEZEMBRO.xlsx'];
for (const f of files) {
    try { quickHeaders(f); } catch (e) { log(`  ERROR: ${e.message}`); }
}

fs.writeFileSync(path.join(__dirname, 'debug-comercial-output2.txt'), lines.join('\n'), 'utf8');
console.log('Output saved to debug-comercial-output2.txt');
