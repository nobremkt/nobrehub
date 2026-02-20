/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PAGE: DATA IMPORT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Página de importação de dados históricos (JSON) para Supabase.
 * Suporta: Produção (projects) e Comercial (commercial_sales).
 * Usa upsert em lotes para escrever múltiplos registros de uma vez.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useRef } from 'react';
import { supabase } from '@/config/supabase';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Spinner
} from '@/design-system';
import { Upload, FileJson, AlertTriangle, CheckCircle, XCircle, ShoppingBag, Wrench } from 'lucide-react';
import { toast } from 'react-toastify';

const PROJECTS_TABLE = 'projects';
const COMMERCIAL_TABLE = 'commercial_sales';

// ─── Types ───────────────────────────────────────────────────────────

interface ImportProject {
    title: string;
    producerId: string;
    producerName: string;
    category: string;
    productId: string | null;
    points: number;
    status: string;
    deliveredAt: string;
    createdAt: string;
    isHistorical: boolean;
    sourceSheet: string;
}

interface ImportAlteracao {
    title: string;
    producerId: string;
    producerName: string;
    motivo: string;
    points: number;
    status: string;
    deliveredAt: string;
    createdAt: string;
    isHistorical: boolean;
    isAlteracao: boolean;
    sourceSheet: string;
}

interface ProductionImportData {
    month: string;
    importType: 'production_history';
    importedAt: string;
    projects: ImportProject[];
    alteracoes: ImportAlteracao[];
    stats: {
        totalProjects: number;
        totalAlteracoes: number;
        totalPoints: number;
    };
}

interface CommercialSale {
    sale_date: string;
    empresa: string | null;
    payment_method: string | null;
    nfe: string | null;
    producer_name: string | null;
    video_style: string | null;
    client_company: string | null;
    client_name: string | null;
    client_phone: string | null;
    pos_venda_name: string | null;
    seller_name: string;
    seller_id: string | null;
    sale_value: number;
    sinal_value: number;
    total_sale: number;
    is_historical: boolean;
    source_sheet: string;
    source_file: string;
}

interface CommercialImportData {
    month: string;
    importType: 'commercial_history';
    sourceFile: string;
    sales: CommercialSale[];
    unmappedSellers: string[];
    stats: {
        sheetsProcessed: number;
        sheetsSkipped: number;
        totalSales: number;
        totalRevenue: number;
        salesBySeller: Record<string, { count: number; revenue: number }>;
    };
}

type ImportData = ProductionImportData | CommercialImportData;

// ─── Helpers ─────────────────────────────────────────────────────────

/** Convert camelCase production import item to snake_case Supabase row */
function toProjectRow(item: Record<string, unknown>, historicalLeadId: string): Record<string, unknown> {
    const isAlteracao = Boolean(item.isAlteracao);
    const motivo = item.motivo ? String(item.motivo) : '';
    const sourceSheet = item.sourceSheet ? String(item.sourceSheet) : '';

    // Build notes field
    const notesParts: string[] = [];
    if (isAlteracao && motivo) notesParts.push(`Alteração: ${motivo}`);
    if (sourceSheet) notesParts.push(`Importado de ${sourceSheet}`);

    return {
        name: item.title || item.name || '',
        lead_id: historicalLeadId,
        producer_id: item.producerId || null,
        product_type: item.category || 'Outro',
        product_id: item.productId || null,
        base_points: Number(item.points) || 0,
        status: item.status || 'entregue',
        delivered_at: item.deliveredAt ? new Date(item.deliveredAt as string).toISOString() : null,
        created_at: item.createdAt ? new Date(item.createdAt as string).toISOString() : new Date().toISOString(),
        source: 'historical',
        notes: notesParts.join(' | ') || undefined,
        internal_revision_count: isAlteracao ? 1 : 0,
    };
}

function isCommercialImport(data: ImportData): data is CommercialImportData {
    return data.importType === 'commercial_history';
}

function isProductionImport(data: ImportData): data is ProductionImportData {
    return data.importType === 'production_history';
}

// ─── Component ───────────────────────────────────────────────────────

export function DataImportPage() {
    const [jsonData, setJsonData] = useState<ImportData | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string) as ImportData;
                setJsonData(data);
                setImportResult(null);

                if (isCommercialImport(data)) {
                    toast.success(`Arquivo comercial carregado: ${data.stats.totalSales} vendas, R$ ${data.stats.totalRevenue.toLocaleString('pt-BR')}`);
                } else if (isProductionImport(data)) {
                    toast.success(`Arquivo de produção carregado: ${data.stats?.totalProjects || 0} projetos, ${data.stats?.totalAlteracoes || 0} alterações`);
                } else {
                    toast.warning('Tipo de importação não reconhecido');
                }
            } catch (error) {
                toast.error('Erro ao ler arquivo JSON');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    const handleImportProduction = async (data: ProductionImportData) => {
        let successCount = 0;
        let failedCount = 0;

        // 0. Clean up any partial previous imports
        console.log('Cleaning up previous historical imports...');
        await supabase.from(PROJECTS_TABLE).delete().eq('source', 'historical');
        await supabase.from('leads').delete().ilike('name', 'Importação Histórica%');

        // 1. Create a placeholder lead for historical imports (FK constraint)
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .insert({
                name: `Importação Histórica - ${data.month}`,
                phone: '0000000000',
                pipeline: 'high-ticket',
                source: 'historical',
                notes: `Importação automática de dados de produção ${data.month}`,
            })
            .select('id')
            .single();

        if (leadError || !lead) {
            console.error('Failed to create placeholder lead:', leadError);
            toast.error('Erro ao criar lead placeholder para importação');
            return { success: 0, failed: data.projects.length + data.alteracoes.length };
        }

        const historicalLeadId = lead.id;

        const allItems: Record<string, unknown>[] = [
            ...data.projects.map(p => ({ ...p, type: 'project' })),
            ...data.alteracoes.map(a => ({ ...a }))
        ];

        const BATCH_SIZE = 50;
        const totalBatches = Math.ceil(allItems.length / BATCH_SIZE);

        for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const chunk = allItems.slice(i, i + BATCH_SIZE);
            const rows = chunk.map(item => toProjectRow(item, historicalLeadId));

            console.log(`Importing batch ${batchNum}/${totalBatches} (${chunk.length} items)...`);

            const { error } = await supabase
                .from(PROJECTS_TABLE)
                .insert(rows as any);

            if (error) {
                console.error(`Batch ${batchNum} error:`, error);
                failedCount += chunk.length;
            } else {
                successCount += chunk.length;
            }
        }

        return { success: successCount, failed: failedCount };
    };

    const handleImportCommercial = async (data: CommercialImportData) => {
        let successCount = 0;
        let failedCount = 0;

        const BATCH_SIZE = 500;

        for (let i = 0; i < data.sales.length; i += BATCH_SIZE) {
            const chunk = data.sales.slice(i, i + BATCH_SIZE);
            const rows = chunk.map(sale => ({
                sale_date: sale.sale_date,
                empresa: sale.empresa,
                payment_method: sale.payment_method,
                nfe: sale.nfe,
                producer_name: sale.producer_name,
                video_style: sale.video_style,
                client_company: sale.client_company,
                client_name: sale.client_name,
                client_phone: sale.client_phone ? String(sale.client_phone) : null,
                pos_venda_name: sale.pos_venda_name,
                seller_name: sale.seller_name,
                seller_id: sale.seller_id,
                sale_value: sale.sale_value,
                sinal_value: sale.sinal_value,
                total_sale: sale.total_sale,
                is_historical: true,
                source_sheet: sale.source_sheet,
                source_file: sale.source_file,
            }));

            const { error } = await supabase
                .from(COMMERCIAL_TABLE)
                .insert(rows as any);

            if (error) {
                console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error);
                failedCount += chunk.length;
            } else {
                successCount += chunk.length;
                console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} committed (${chunk.length} sales)`);
            }
        }

        return { success: successCount, failed: failedCount };
    };

    const handleImport = async () => {
        if (!jsonData) return;

        setIsImporting(true);
        setImportResult(null);

        try {
            let result;
            if (isCommercialImport(jsonData)) {
                result = await handleImportCommercial(jsonData);
            } else if (isProductionImport(jsonData)) {
                result = await handleImportProduction(jsonData);
            } else {
                toast.error('Tipo de importação não reconhecido');
                setIsImporting(false);
                return;
            }

            setImportResult(result);
            toast.success(`Importação concluída! ${result.success} itens importados.`);
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Erro durante importação');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDeleteHistorical = async (table: 'projects' | 'commercial') => {
        const tableName = table === 'projects' ? PROJECTS_TABLE : COMMERCIAL_TABLE;
        const label = table === 'projects' ? 'produção' : 'comercial';

        if (!confirm(`⚠️ ATENÇÃO: Isso vai APAGAR todos os dados históricos de ${label} do banco de dados. Esta ação é irreversível!\n\nTem certeza que deseja continuar?`)) {
            return;
        }

        setIsDeleting(true);

        try {
            const { error, count } = await supabase
                .from(tableName)
                .delete({ count: 'exact' })
                .eq('is_historical', true);

            if (error) throw error;

            toast.success(`${count || 0} registros históricos de ${label} deletados!`);
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(`Erro ao deletar dados históricos de ${label}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const dataType = jsonData
        ? isCommercialImport(jsonData) ? 'commercial' : 'production'
        : null;

    return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    📦 Importação de Dados
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Importe dados históricos de produção ou comercial usando arquivos JSON gerados pelos scripts de parsing.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Upload Section */}
                <Card>
                    <CardHeader title="1. Selecionar Arquivo JSON" />
                    <CardBody>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <Button
                                variant="secondary"
                                leftIcon={<FileJson size={18} />}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Selecionar Arquivo
                            </Button>
                            {jsonData && (
                                <span style={{
                                    color: 'var(--color-success-500)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <CheckCircle size={16} />
                                    {dataType === 'commercial' ? (
                                        <>Comercial: {(jsonData as CommercialImportData).stats.totalSales} vendas</>
                                    ) : (
                                        <>Produção: arquivo carregado</>
                                    )}
                                </span>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Preview Section */}
                {jsonData && (
                    <Card>
                        <CardHeader
                            title={`2. Pré-visualização — ${dataType === 'commercial' ? '🛒 Dados Comerciais' : '🔧 Dados de Produção'}`}
                        />
                        <CardBody>
                            {dataType === 'commercial' && isCommercialImport(jsonData) && (
                                <div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary-500)' }}>
                                                {jsonData.stats.totalSales.toLocaleString('pt-BR')}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Vendas</div>
                                        </div>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success-500)' }}>
                                                R$ {jsonData.stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Receita Total</div>
                                        </div>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                                {jsonData.month}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Mês</div>
                                        </div>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                                {Object.keys(jsonData.stats.salesBySeller).length}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Vendedoras</div>
                                        </div>
                                    </div>

                                    {/* Top sellers preview */}
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--font-size-xs)',
                                        fontFamily: 'monospace',
                                        maxHeight: '200px',
                                        overflow: 'auto',
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: 'var(--color-border) transparent',
                                    }}>
                                        <strong>Top vendedoras:</strong>
                                        <pre style={{ margin: '0.5rem 0 0' }}>
                                            {Object.entries(jsonData.stats.salesBySeller)
                                                .sort(([, a], [, b]) => b.revenue - a.revenue)
                                                .slice(0, 8)
                                                .map(([name, data]) =>
                                                    `${name}: ${data.count} vendas, R$ ${data.revenue.toLocaleString('pt-BR')}`
                                                ).join('\n')}
                                        </pre>
                                    </div>

                                    {jsonData.unmappedSellers.length > 0 && (
                                        <div style={{
                                            marginTop: '1rem',
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(234, 179, 8, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid rgba(234, 179, 8, 0.3)',
                                            fontSize: 'var(--font-size-sm)',
                                        }}>
                                            <AlertTriangle size={14} style={{ color: '#eab308', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                            Vendedoras não mapeadas: {jsonData.unmappedSellers.join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}

                            {dataType === 'production' && isProductionImport(jsonData) && (
                                <div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary-500)' }}>
                                                {jsonData.stats?.totalProjects || 0}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Projetos</div>
                                        </div>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-warning-500)' }}>
                                                {jsonData.stats?.totalAlteracoes || 0}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Alterações</div>
                                        </div>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success-500)' }}>
                                                {jsonData.stats?.totalPoints || 0}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Pontos</div>
                                        </div>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                                {jsonData.month}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Mês</div>
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--font-size-xs)',
                                        fontFamily: 'monospace',
                                        maxHeight: '200px',
                                        overflow: 'auto',
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: 'var(--color-border) transparent',
                                    }}>
                                        <strong>Primeiros 3 projetos:</strong>
                                        <pre style={{ margin: '0.5rem 0 0' }}>
                                            {JSON.stringify(jsonData.projects?.slice(0, 3), null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )}

                {/* Import Section */}
                {jsonData && (
                    <Card>
                        <CardHeader title="3. Importar para Supabase" />
                        <CardBody>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <Button
                                    variant="primary"
                                    leftIcon={isImporting ? <Spinner size="sm" /> : <Upload size={18} />}
                                    onClick={handleImport}
                                    disabled={isImporting}
                                >
                                    {isImporting ? 'Importando...' : `Importar ${dataType === 'commercial' ? 'Dados Comerciais' : 'Dados de Produção'}`}
                                </Button>

                                {importResult && (
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <span style={{ color: 'var(--color-success-500)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <CheckCircle size={16} /> {importResult.success} importados
                                        </span>
                                        {importResult.failed > 0 && (
                                            <span style={{ color: 'var(--color-danger-500)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <XCircle size={16} /> {importResult.failed} falharam
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Danger Zone */}
                <Card variant="outlined" style={{ borderColor: 'var(--color-danger-500)' }}>
                    <CardHeader title="⚠️ Zona de Perigo" />
                    <CardBody>
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                            padding: '1rem',
                            background: 'rgba(220, 38, 38, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem'
                        }}>
                            <AlertTriangle size={24} style={{ color: 'var(--color-danger-500)', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                                Use estas opções para remover dados históricos. Esta ação é <strong>irreversível</strong>.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <Button
                                variant="danger"
                                leftIcon={isDeleting ? <Spinner size="sm" /> : <Wrench size={18} />}
                                onClick={() => handleDeleteHistorical('projects')}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deletando...' : 'Deletar Produção Histórica'}
                            </Button>
                            <Button
                                variant="danger"
                                leftIcon={isDeleting ? <Spinner size="sm" /> : <ShoppingBag size={18} />}
                                onClick={() => handleDeleteHistorical('commercial')}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deletando...' : 'Deletar Comercial Histórico'}
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
