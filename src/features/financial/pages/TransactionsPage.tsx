/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TRANSACTIONS PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Full CRUD list of financial transactions with filters.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardBody, CardHeader, Input, Spinner, Dropdown } from '@/design-system';
import { Plus, Trash2, Edit2, ArrowUpDown } from 'lucide-react';
import { FinancialService, type FinancialTransaction, type FinancialCategory, type TransactionFilters } from '../services/FinancialService';
import { TransactionFormModal } from '../components/TransactionFormModal';
import { toast } from 'react-toastify';
import styles from './TransactionsPage.module.css';

export function TransactionsPage() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);
    const [filters, setFilters] = useState<TransactionFilters>({});
    const [showForm, setShowForm] = useState(false);
    const [editingTxn, setEditingTxn] = useState<FinancialTransaction | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [txns, cats] = await Promise.all([
                FinancialService.getTransactions(filters),
                FinancialService.getCategories(),
            ]);
            setTransactions(txns);
            setCategories(cats);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            toast.error('Erro ao carregar transações');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(f => ({ ...f, search: searchTerm || undefined }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
        try {
            await FinancialService.deleteTransaction(id);
            toast.success('Transação excluída');
            fetchData();
        } catch {
            toast.error('Erro ao excluir');
        }
    };

    const handleEdit = (txn: FinancialTransaction) => {
        setEditingTxn(txn);
        setShowForm(true);
    };

    const handleSaved = () => {
        setShowForm(false);
        setEditingTxn(null);
        fetchData();
        toast.success('Transação salva!');
    };

    const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const typeOptions = [
        { value: '', label: 'Todos os tipos' },
        { value: 'income', label: 'Entradas' },
        { value: 'expense', label: 'Saídas' },
    ];

    const categoryOptions = [
        { value: '', label: 'Todas categorias' },
        ...categories.map(c => ({ value: c.id, label: c.name })),
    ];

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <ArrowUpDown size={24} className={styles.headerIcon} />
                    <h1 className={styles.title}>Transações</h1>
                </div>
                <Button variant="primary" onClick={() => { setEditingTxn(null); setShowForm(true); }}>
                    <Plus size={16} />
                    Nova Transação
                </Button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchWrap}>
                    <Input
                        placeholder="Buscar por descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dropdown
                    options={typeOptions}
                    value={filters.type || ''}
                    onChange={(v) => setFilters(f => ({ ...f, type: (String(v) as 'income' | 'expense') || undefined }))}
                    placeholder="Tipo"
                />
                <Dropdown
                    options={categoryOptions}
                    value={filters.categoryId || ''}
                    onChange={(v) => setFilters(f => ({ ...f, categoryId: String(v) || undefined }))}
                    placeholder="Categoria"
                />
                <Input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value || undefined }))}
                    placeholder="Data início"
                />
                <Input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value || undefined }))}
                    placeholder="Data fim"
                />
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <h3>Resultados ({transactions.length})</h3>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <div className={styles.loadingContainer}><Spinner size="md" /></div>
                    ) : transactions.length === 0 ? (
                        <p className={styles.empty}>Nenhuma transação encontrada</p>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <span>Data</span>
                                <span>Tipo</span>
                                <span>Categoria</span>
                                <span>Descrição</span>
                                <span>Valor</span>
                                <span>Ações</span>
                            </div>
                            {transactions.map(txn => (
                                <div key={txn.id} className={styles.tableRow}>
                                    <span className={styles.cellDate}>
                                        {new Date(txn.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </span>
                                    <span>
                                        <span className={`${styles.typeBadge} ${txn.type === 'income' ? styles.badgeIncome : styles.badgeExpense}`}>
                                            {txn.type === 'income' ? 'Entrada' : 'Saída'}
                                        </span>
                                    </span>
                                    <span className={styles.cellCategory}>
                                        {txn.category && (
                                            <span className={styles.catDot} style={{ background: txn.category.color }} />
                                        )}
                                        {txn.category?.name || '—'}
                                    </span>
                                    <span className={styles.cellDesc}>{txn.description || '—'}</span>
                                    <span className={`${styles.cellAmount} ${txn.type === 'income' ? styles.income : styles.expense}`}>
                                        {txn.type === 'income' ? '+' : '-'} {formatCurrency(Number(txn.amount))}
                                    </span>
                                    <span className={styles.cellActions}>
                                        {!txn.is_historical && (
                                            <>
                                                <button className={styles.actionBtn} onClick={() => handleEdit(txn)} title="Editar">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(txn.id)} title="Excluir">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Transaction Form */}
            {showForm && (
                <TransactionFormModal
                    categories={categories}
                    transaction={editingTxn || undefined}
                    onSave={handleSaved}
                    onClose={() => { setShowForm(false); setEditingTxn(null); }}
                />
            )}
        </div>
    );
}
