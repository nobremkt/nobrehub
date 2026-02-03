/**
 * Script para converter planilha XLSX para JSON de importação
 * Estrutura: Cada produtor tem 3 colunas (PROJETO, PONTUAÇÃO, DIFICULDADE)
 * Linha 29+: Seção de ALTERAÇÕES
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Mapeamento de nomes para IDs (case insensitive, com variações)
const NAME_MAPPINGS = {
    'julia': 'o8FvEUY9jPL10mvJBvGh',
    'júlia': 'o8FvEUY9jPL10mvJBvGh',
    'fernanda rocha': 'FPfK628AGELN8CmtZvWE',
    'fernanda': 'FPfK628AGELN8CmtZvWE',
    'kauã pessoni': 'IkYdpwBDG0vwXhSbMFyf',
    'kaua pessoni': 'IkYdpwBDG0vwXhSbMFyf',
    'gabriel': 'KsHRwjcaywEsPdCfZ2bj',
    'william': 'KsvbDkYrILPsYjmmiZSO',
    'willian': 'KsvbDkYrILPsYjmmiZSO',
    'diogo': 'NwXUSXITxpx7mOlI5cBS',
    'caio alves': 'O3CYQcSsDsa3BWe0wY3V',
    'demétrio': 'SkdvB8HDS9crx115F64M',
    'demetrio': 'SkdvB8HDS9crx115F64M',
    'kauã ferreira': 'Suhsq28VNHxJie5mbUBY',
    'kaua ferreira': 'Suhsq28VNHxJie5mbUBY',
    'kaua': 'Suhsq28VNHxJie5mbUBY',
    'pâmelah': 'b5SPAYPt9LnGhWlsEuiN',
    'pamelah': 'b5SPAYPt9LnGhWlsEuiN',
    'pamela': 'b5SPAYPt9LnGhWlsEuiN',
};

// Mapeamento de dificuldade para categoria
const CATEGORY_MAP = {
    // Categorias principais de projetos
    '3d premium': '3D PREMIUM',
    'flow': 'FLOW',
    'explainer': 'EXPLAINER',
    'create': 'CREATE',
    'post': 'POST',
    'reels': 'REELS',
    'motion': 'MOTION',
    'carrossel': 'CARROSSEL',
    'white board': 'WHITEBOARD',
    'whiteboard': 'WHITEBOARD',
    'animado': 'CREATE',

    // Categorias adicionais encontradas
    'mascote': 'MASCOTE',
    'logotipo': 'LOGOTIPO',
    'vsl': 'VSL',
    'portifolio': 'PORTFÓLIO',
    'portfolio': 'PORTFÓLIO',
};

function normalizeText(text) {
    if (!text) return '';
    return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[🎃🎇🎪🎬🌜🔮💕🤩🥰😛🍆]/g, '')
        .trim();
}

function findProducerId(name) {
    const normalized = normalizeText(name);

    // Busca exata apenas
    if (NAME_MAPPINGS[normalized]) {
        return NAME_MAPPINGS[normalized];
    }

    return null;
}

function getCategory(difficulty) {
    const normalized = normalizeText(difficulty);

    for (const [key, category] of Object.entries(CATEGORY_MAP)) {
        if (normalized.includes(key)) {
            return category;
        }
    }

    return 'Outro';
}

function parseSheetDate(sheetName) {
    // Formato: "0501" = dia 05, mês 01
    const match = sheetName.match(/^(\d{2})(\d{2})$/);
    if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
            return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
    }
    return null;
}

function isAlteracoesRow(row) {
    // Detecta se é a linha de resumo de alterações (ex: "0 ALTERAÇÕES", "2 ALTERAÇÕES")
    const firstCell = String(row[0] || '').trim().toUpperCase();
    return firstCell.includes('ALTERAÇ') || firstCell.includes('ALTERAC');
}

// Arquivo de entrada
const INPUT_FILE = path.join(process.cwd(), '!🧠 CÉREBRO', 'PRODUÇÃO JANEIRO 2026.xlsx');
const OUTPUT_FILE = path.join(process.cwd(), '!🧠 CÉREBRO', 'producao-janeiro-2026.json');

console.log('📖 Lendo arquivo:', INPUT_FILE);
const workbook = XLSX.readFile(INPUT_FILE);

const result = {
    month: '2026-01',
    importType: 'production_history',
    importedAt: new Date().toISOString(),
    projects: [],
    alteracoes: [],
    unmappedProducers: new Set(),
    stats: {
        totalSheets: workbook.SheetNames.length,
        totalProjects: 0,
        totalAlteracoes: 0,
        totalPoints: 0,
        projectsByProducer: {},
        projectsByDate: {}
    }
};

console.log(`\n📋 Processando ${workbook.SheetNames.length} abas...`);

for (const sheetName of workbook.SheetNames) {
    const deliveredAt = parseSheetDate(sheetName);
    if (!deliveredAt) {
        console.log(`⚠️ Aba "${sheetName}" - data não identificada, pulando...`);
        continue;
    }

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (data.length < 3) {
        console.log(`⚠️ Aba "${sheetName}" - poucas linhas, pulando...`);
        continue;
    }

    // Linha 0: Nomes dos produtores (a cada 3 colunas)
    const headerRow = data[0];

    // Identificar produtores e suas colunas
    const producers = [];
    for (let col = 0; col < headerRow.length; col += 3) {
        const producerName = String(headerRow[col] || '').trim();
        if (producerName && producerName !== '') {
            const producerId = findProducerId(producerName);
            producers.push({
                name: producerName,
                cleanName: normalizeText(producerName),
                id: producerId,
                projectCol: col,
                pointsCol: col + 1,
                categoryCol: col + 2
            });

            if (!producerId) {
                result.unmappedProducers.add(producerName);
            }
        }
    }

    // Encontrar onde começa a seção de ALTERAÇÕES
    let alteracoesStartRow = -1;
    for (let rowIdx = 2; rowIdx < data.length; rowIdx++) {
        if (isAlteracoesRow(data[rowIdx])) {
            alteracoesStartRow = rowIdx;
            break;
        }
    }

    // Processar projetos normais (linha 2 até alteracoesStartRow ou fim)
    const projectsEndRow = alteracoesStartRow > 0 ? alteracoesStartRow : data.length;
    let projectsInSheet = 0;
    let alteracoesInSheet = 0;

    for (let rowIdx = 2; rowIdx < projectsEndRow; rowIdx++) {
        const row = data[rowIdx];

        for (const producer of producers) {
            const projectName = String(row[producer.projectCol] || '').trim();
            const points = Number(row[producer.pointsCol]) || 0;
            const difficulty = String(row[producer.categoryCol] || '').trim();

            // Pular se não tem nome de projeto
            if (!projectName || projectName === '') continue;

            // Pular se não conseguiu mapear o produtor
            if (!producer.id) continue;

            const category = getCategory(difficulty);

            const project = {
                title: projectName,
                producerId: producer.id,
                category: category,
                difficulty: difficulty,
                points: points,
                status: 'entregue',
                deliveredAt: deliveredAt,
                createdAt: deliveredAt,
                isHistorical: true,
                sourceSheet: sheetName
            };

            result.projects.push(project);
            result.stats.totalProjects++;
            result.stats.totalPoints += points;
            projectsInSheet++;

            // Stats por produtor
            const cleanName = producer.name.replace(/[🎃🎇🎪🎬🌜🔮💕🤩🥰😛🍆]/g, '').trim();
            if (!result.stats.projectsByProducer[cleanName]) {
                result.stats.projectsByProducer[cleanName] = { count: 0, points: 0, alteracoes: 0 };
            }
            result.stats.projectsByProducer[cleanName].count++;
            result.stats.projectsByProducer[cleanName].points += points;

            // Stats por data
            if (!result.stats.projectsByDate[deliveredAt]) {
                result.stats.projectsByDate[deliveredAt] = 0;
            }
            result.stats.projectsByDate[deliveredAt]++;
        }
    }

    // Processar seção de ALTERAÇÕES (se existir)
    if (alteracoesStartRow > 0) {
        // A linha de alteracoesStartRow contém o resumo (ex: "0 ALTERAÇÕES", 2, "")
        // As linhas seguintes contêm as alterações individuais

        for (let rowIdx = alteracoesStartRow + 1; rowIdx < data.length; rowIdx++) {
            const row = data[rowIdx];

            for (const producer of producers) {
                const alteracaoName = String(row[producer.projectCol] || '').trim();
                const motivo = String(row[producer.categoryCol] || '').trim();

                // Pular se não tem nome de alteração
                if (!alteracaoName || alteracaoName === '') continue;

                // Pular se não conseguiu mapear o produtor
                if (!producer.id) continue;

                const alteracao = {
                    title: alteracaoName,
                    producerId: producer.id,
                    motivo: motivo || 'Não especificado',
                    type: 'alteracao',
                    status: 'alteracao',
                    deliveredAt: deliveredAt,
                    createdAt: deliveredAt,
                    isHistorical: true,
                    sourceSheet: sheetName
                };

                result.alteracoes.push(alteracao);
                result.stats.totalAlteracoes++;
                alteracoesInSheet++;

                // Stats por produtor
                const cleanName = producer.name.replace(/[🎃🎇🎪🎬🌜🔮💕🤩🥰😛🍆]/g, '').trim();
                if (!result.stats.projectsByProducer[cleanName]) {
                    result.stats.projectsByProducer[cleanName] = { count: 0, points: 0, alteracoes: 0 };
                }
                result.stats.projectsByProducer[cleanName].alteracoes++;
            }
        }
    }

    console.log(`✅ Aba "${sheetName}" (${deliveredAt}): ${projectsInSheet} projetos, ${alteracoesInSheet} alterações`);
}

// Converter Set para Array
result.unmappedProducers = Array.from(result.unmappedProducers);

// Salvar JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf8');

console.log('\n\n' + '='.repeat(60));
console.log('📊 ESTATÍSTICAS FINAIS');
console.log('='.repeat(60));
console.log(`Total de abas processadas: ${result.stats.totalSheets}`);
console.log(`Total de projetos: ${result.stats.totalProjects}`);
console.log(`Total de alterações: ${result.stats.totalAlteracoes}`);
console.log(`Total de pontos: ${result.stats.totalPoints}`);
console.log('\n📈 Por produtor:');
for (const [name, data] of Object.entries(result.stats.projectsByProducer)) {
    console.log(`   ${name}: ${data.count} projetos, ${data.points} pontos, ${data.alteracoes || 0} alterações`);
}

if (result.unmappedProducers.length > 0) {
    console.log('\n⚠️ Produtores NÃO mapeados (ignorados):');
    for (const name of result.unmappedProducers) {
        console.log(`   - "${name}"`);
    }
}

console.log(`\n✅ Arquivo salvo: ${OUTPUT_FILE}`);
