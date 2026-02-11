/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PAGE: DATA IMPORT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Página de importação de dados históricos (JSON) para Supabase.
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
import { Upload, Trash2, FileJson, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const PROJECTS_TABLE = 'projects';

interface ImportProject {
    title: string;
    producerId: string;
    category: string;
    difficulty: string;
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
    motivo: string;
    type: string;
    status: string;
    deliveredAt: string;
    createdAt: string;
    isHistorical: boolean;
    sourceSheet: string;
}

interface ImportData {
    month: string;
    importType: string;
    importedAt: string;
    projects: ImportProject[];
    alteracoes: ImportAlteracao[];
    stats: {
        totalProjects: number;
        totalAlteracoes: number;
        totalPoints: number;
    };
}

/** Convert camelCase import item to snake_case Supabase row */
function toSupabaseRow(item: Record<string, unknown>): Record<string, unknown> {
    return {
        name: item.title || item.name || '',
        lead_id: (item.leadId as string) || `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        producer_name: '',
        lead_name: 'Importado',
        producer_id: item.producerId || '',
        product_type: item.category || 'Outro',
        base_points: Number(item.points) || 1,
        extra_points: 0,
        total_points: Number(item.points) || 1,
        status: item.status || 'entregue',
        delivered_at: item.deliveredAt ? new Date(item.deliveredAt as string).toISOString() : null,
        created_at: item.createdAt ? new Date(item.createdAt as string).toISOString() : new Date().toISOString(),
        source: 'historical',
        notes: item.sourceSheet ? `Importado de ${String(item.sourceSheet)}` : undefined,
    };
}

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
                const data = JSON.parse(event.target?.result as string);
                setJsonData(data);
                setImportResult(null);
                toast.success(`Arquivo carregado: ${data.stats?.totalProjects || 0} projetos, ${data.stats?.totalAlteracoes || 0} alterações`);
            } catch (error) {
                toast.error('Erro ao ler arquivo JSON');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!jsonData) return;

        setIsImporting(true);
        setImportResult(null);
        let successCount = 0;
        let failedCount = 0;

        try {
            // Combine projects and alteracoes into a single batch
            const allItems: Record<string, unknown>[] = [
                ...jsonData.projects.map(p => ({ ...p, type: 'project' })),
                ...jsonData.alteracoes.map(a => ({ ...a }))
            ];

            // Supabase insert in chunks of 500
            const BATCH_SIZE = 500;

            for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
                const chunk = allItems.slice(i, i + BATCH_SIZE);
                const rows = chunk.map(item => toSupabaseRow(item));

                const { error } = await supabase
                    .from(PROJECTS_TABLE)
                    .insert(rows as any);

                if (error) {
                    console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error);
                    failedCount += chunk.length;
                } else {
                    successCount += chunk.length;
                    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} committed (${chunk.length} items)`);
                }
            }

            setImportResult({ success: successCount, failed: failedCount });
            toast.success(`Importação concluída! ${successCount} itens importados.`);
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Erro durante importação');
            setImportResult({ success: successCount, failed: failedCount });
        } finally {
            setIsImporting(false);
        }
    };

    const handleDeleteHistorical = async () => {
        if (!confirm('⚠️ ATENÇÃO: Isso vai APAGAR todos os dados históricos (is_historical=true) do banco de dados. Esta ação é irreversível!\n\nTem certeza que deseja continuar?')) {
            return;
        }

        setIsDeleting(true);

        try {
            const { error, count } = await supabase
                .from(PROJECTS_TABLE)
                .delete({ count: 'exact' })
                .eq('is_historical', true);

            if (error) throw error;

            toast.success(`${count || 0} registros históricos deletados!`);
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Erro ao deletar dados históricos');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    📦 Importação de Dados
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Importe dados históricos de produção usando arquivos JSON gerados pelo script de parsing.
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
                                <span style={{ color: 'var(--color-text-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={16} />
                                    Arquivo carregado
                                </span>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Preview Section */}
                {jsonData && (
                    <Card>
                        <CardHeader title="2. Pré-visualização dos Dados" />
                        <CardBody>
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
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Projetos</div>
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
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Alterações</div>
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
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Pontos</div>
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
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Mês</div>
                                </div>
                            </div>

                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                maxHeight: '200px',
                                overflow: 'auto'
                            }}>
                                <strong>Primeiros 3 projetos:</strong>
                                <pre style={{ margin: '0.5rem 0 0' }}>
                                    {JSON.stringify(jsonData.projects?.slice(0, 3), null, 2)}
                                </pre>
                            </div>
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
                                    {isImporting ? 'Importando...' : 'Importar Dados'}
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
                            <AlertTriangle size={24} style={{ color: 'var(--color-danger-500)' }} />
                            <p style={{ margin: 0, fontSize: '0.875rem' }}>
                                Use esta opção para remover TODOS os dados históricos (is_historical=true).
                                Esta ação é <strong>irreversível</strong>.
                            </p>
                        </div>
                        <Button
                            variant="danger"
                            leftIcon={isDeleting ? <Spinner size="sm" /> : <Trash2 size={18} />}
                            onClick={handleDeleteHistorical}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deletando...' : 'Deletar Dados Históricos'}
                        </Button>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
