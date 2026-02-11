/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DEBUG: BANCO DE DADOS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Página de gerenciamento de banco de dados para debug.
 * Permite resetar/limpar tabelas do Supabase para facilitar
 * a transição de dados de teste para dados reais.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { Card, CardHeader, CardBody, Button, Badge, Modal } from '@/design-system';
import { supabase } from '@/config/supabase';
import { Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

const LEADS_TABLE = 'leads';
const PROJECTS_TABLE = 'projects';

interface CollectionInfo {
    key: string;
    name: string;
    description: string;
    collectionPath: string;
}

const MANAGED_COLLECTIONS: CollectionInfo[] = [
    {
        key: 'leads',
        name: 'Leads / Contatos',
        description: 'Todos os leads e contatos do CRM. Inclui dados de WhatsApp, status, campos customizados, etc.',
        collectionPath: LEADS_TABLE,
    },
    {
        key: 'production_projects',
        name: 'Projetos de Produção',
        description: 'Projetos de produção de vídeo. Inclui dados de produtores, status, entregas, etc.',
        collectionPath: PROJECTS_TABLE,
    },
];

export function DatabasePage() {
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; collection: CollectionInfo | null }>({
        open: false,
        collection: null,
    });
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<Record<string, { status: 'success' | 'error'; count: number }>>({});
    const [confirmText, setConfirmText] = useState('');

    const handleOpenConfirm = (col: CollectionInfo) => {
        setConfirmModal({ open: true, collection: col });
        setConfirmText('');
    };

    const handleCloseConfirm = () => {
        setConfirmModal({ open: false, collection: null });
        setConfirmText('');
    };

    const handleClearCollection = async () => {
        const col = confirmModal.collection;
        if (!col) return;

        handleCloseConfirm();
        setLoading((prev) => ({ ...prev, [col.key]: true }));
        setResults((prev) => {
            const next = { ...prev };
            delete next[col.key];
            return next;
        });

        try {
            // Supabase requires a filter to delete — use neq on id to match all rows
            // This is the standard pattern for "delete all" in Supabase
            const { error, count } = await supabase
                .from(col.collectionPath as any)
                .delete({ count: 'exact' })
                .neq('id', '00000000-0000-0000-0000-000000000000'); // matches all real rows

            if (error) throw error;

            setResults((prev) => ({ ...prev, [col.key]: { status: 'success', count: count || 0 } }));
        } catch (error) {
            console.error(`Error clearing table ${col.collectionPath}:`, error);
            setResults((prev) => ({ ...prev, [col.key]: { status: 'error', count: 0 } }));
        } finally {
            setLoading((prev) => ({ ...prev, [col.key]: false }));
        }
    };

    const isConfirmValid = confirmText === 'LIMPAR';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            <div>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-2)' }}>
                    Banco de Dados
                </h1>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Gerencie as tabelas do Supabase. Use para limpar dados de teste antes de migrar para dados reais.
                </p>
            </div>

            {/* Warning Banner */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-3)',
                padding: 'var(--spacing-4)',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
            }}>
                <AlertTriangle style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} size={20} />
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    <p style={{ fontWeight: 600, color: '#eab308', marginBottom: 'var(--spacing-1)' }}>
                        ⚠️ Zona de Perigo
                    </p>
                    <p>
                        As ações abaixo são <strong>irreversíveis</strong>. Todos os registros da tabela serão
                        permanentemente deletados. Use apenas quando quiser limpar dados de teste.
                    </p>
                </div>
            </div>

            {/* Collection Cards */}
            {MANAGED_COLLECTIONS.map((col) => {
                const isLoading = loading[col.key];
                const result = results[col.key];

                return (
                    <Card key={col.key}>
                        <CardHeader
                            title={col.name}
                            action={
                                result ? (
                                    result.status === 'success' ? (
                                        <Badge variant="success" content={`${result.count} registros removidos`} />
                                    ) : (
                                        <Badge variant="danger" content="Erro ao limpar" />
                                    )
                                ) : (
                                    <Badge variant="default" content={col.collectionPath} />
                                )
                            }
                        />
                        <CardBody>
                            <p style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text-muted)',
                                marginBottom: 'var(--spacing-4)',
                            }}>
                                {col.description}
                            </p>

                            {/* Result feedback */}
                            {result && result.status === 'success' && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-2)',
                                    padding: 'var(--spacing-3)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    color: '#22c55e',
                                    marginBottom: 'var(--spacing-4)',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 500,
                                }}>
                                    <CheckCircle2 size={16} />
                                    <span>Tabela limpa com sucesso! {result.count} registro(s) removido(s).</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="danger"
                                    onClick={() => handleOpenConfirm(col)}
                                    isLoading={isLoading}
                                    leftIcon={isLoading ? <Loader2 size={16} /> : <Trash2 size={16} />}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Limpando...' : 'Limpar Tabela'}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                );
            })}

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmModal.open}
                onClose={handleCloseConfirm}
                title="Confirmar Limpeza"
                size="sm"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                    <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-3)',
                        padding: 'var(--spacing-4)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}>
                        <AlertTriangle style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} size={20} />
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                            <p>
                                Você está prestes a deletar <strong>todos os registros</strong> da tabela{' '}
                                <strong style={{ color: 'var(--color-primary-500)' }}>
                                    {confirmModal.collection?.collectionPath}
                                </strong>.
                            </p>
                            <p style={{ marginTop: 'var(--spacing-2)' }}>
                                Esta ação é <strong>irreversível</strong>.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-2)',
                        }}>
                            Digite <strong style={{ color: 'var(--color-primary-500)' }}>LIMPAR</strong> para confirmar:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="LIMPAR"
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-2) var(--spacing-3)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)',
                                fontSize: 'var(--font-size-sm)',
                                outline: 'none',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--color-primary-500)';
                                e.target.style.boxShadow = '0 0 10px var(--color-primary-500)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--color-border)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' }}>
                        <Button variant="ghost" onClick={handleCloseConfirm}>
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleClearCollection}
                            disabled={!isConfirmValid}
                            leftIcon={<Trash2 size={16} />}
                        >
                            Confirmar Limpeza
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
