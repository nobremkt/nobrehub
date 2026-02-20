const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '2025 - Planilhas do Comercial');

// Only analyze first sheet of JANEIRO + ROGERIO (lightweight)
function quickAnalyze(file) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`FILE: ${file}`);
    console.log('='.repeat(60));

    const wb = XLSX.readFile(path.join(dir, file));
    console.log(`Sheets (${wb.SheetNames.length}):`, wb.SheetNames.join(' | '));

    // Only look at first 2 sheets max
    const sheetsToCheck = wb.SheetNames.slice(0, 3);

    for (const name of sheetsToCheck) {
        const ws = wb.Sheets[name];
        if (!ws['!ref']) { console.log(`  [${name}] EMPTY`); continue; }

        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        // Only keep first 10 rows, max 20 cols
        const sample = json.slice(0, 10).map(r => r.slice(0, 20));

        console.log(`\n--- Sheet: "${name}" | Range: ${ws['!ref']} | Rows: ${json.length} ---`);
        sample.forEach((row, i) => {
            const clean = row.map(c => {
                if (c === '') return '';
                if (c instanceof Date) return c.toISOString().split('T')[0];
                if (typeof c === 'number') return c;
                return String(c).substring(0, 30);
            });
            console.log(`  Row ${i}: ${JSON.stringify(clean)}`);
        });
    }
}

try {
    quickAnalyze('JANEIRO.xlsx');
    quickAnalyze('ROGERIO.xlsx');
    quickAnalyze('Planilha de Débitos Setembro.xlsx');
    console.log('\n✅ Done!');
} catch (e) {
    console.error('ERROR:', e.message);
}
