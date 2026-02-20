/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CASH FLOW PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Monthly cash flow visualization with daily income vs expense chart.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, CardBody, CardHeader, Spinner } from '@/design-system';
import { TrendingUp, TrendingDown, DollarSign, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { FinancialService, type FinancialTransaction, type FinancialCategory } from '../services/FinancialService';
import { TransactionFormModal } from '../components/TransactionFormModal';
import { toast } from 'react-toastify';
import styles from './CashFlowPage.module.css';

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function CashFlowPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<{
        totalIncome: number;
        totalExpense: number;
        balance: number;
        dailyData: { date: string; income: number; expense: number }[];
    } | null>(null);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);
    const [showForm, setShowForm] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            const [sum, txns, cats] = await Promise.all([
                FinancialService.getMonthlySummary(year, month),
                FinancialService.getTransactions({ startDate, endDate }),
                FinancialService.getCategories(),
            ]);
            setSummary(sum);
            setTransactions(txns);
            setCategories(cats);
        } catch (err) {
            console.error('Error fetching cash flow:', err);
            toast.error('Erro ao carregar fluxo de caixa');
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handlePrevMonth = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };

    const handleNextMonth = () => {
        if (month === 12) { setMonth(1); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Chart calculations
    const maxValue = useMemo(() => {
        if (!summary?.dailyData.length) return 1;
        return Math.max(...summary.dailyData.map(d => Math.max(d.income, d.expense)), 1);
    }, [summary]);

    const handleTransactionSaved = () => {
        setShowForm(false);
        fetchData();
        toast.success('Transação salva!');
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingContainer}>
                    <Spinner size="lg" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Fluxo de Caixa</h1>
                    <div className={styles.monthNav}>
                        <button className={styles.monthBtn} onClick={handlePrevMonth}>
                            <ChevronLeft size={20} />
                        </button>
                        <span className={styles.monthLabel}>
                            {MONTH_NAMES[month - 1]} {year}
                        </span>
                        <button className={styles.monthBtn} onClick={handleNextMonth}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <Button variant="primary" onClick={() => setShowForm(true)}>
                    <Plus size={16} />
                    Nova Transação
                </Button>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <Card>
                    <CardBody>
                        <div className={styles.summaryCard}>
                            <div className={`${styles.summaryIcon} ${styles.income}`}>
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <span className={styles.summaryLabel}>Entradas</span>
                                <span className={`${styles.summaryValue} ${styles.income}`}>
                                    {formatCurrency(summary?.totalIncome || 0)}
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className={styles.summaryCard}>
                            <div className={`${styles.summaryIcon} ${styles.expense}`}>
                                <TrendingDown size={20} />
                            </div>
                            <div>
                                <span className={styles.summaryLabel}>Saídas</span>
                                <span className={`${styles.summaryValue} ${styles.expense}`}>
                                    {formatCurrency(summary?.totalExpense || 0)}
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className={styles.summaryCard}>
                            <div className={`${styles.summaryIcon} ${(summary?.balance || 0) >= 0 ? styles.income : styles.expense}`}>
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <span className={styles.summaryLabel}>Saldo</span>
                                <span className={`${styles.summaryValue} ${(summary?.balance || 0) >= 0 ? styles.income : styles.expense}`}>
                                    {formatCurrency(summary?.balance || 0)}
                                </span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Daily Chart */}
            {summary?.dailyData && summary.dailyData.length > 0 && (
                <Card>
                    <CardHeader>
                        <h3>Movimentação Diária</h3>
                    </CardHeader>
                    <CardBody>
                        <div className={styles.chart}>
                            {summary.dailyData.map((day) => {
                                const incomeH = Math.max((day.income / maxValue) * 100, 2);
                                const expenseH = Math.max((day.expense / maxValue) * 100, 2);
                                const dateLabel = new Date(day.date + 'T12:00:00').getDate();
                                return (
                                    <div key={day.date} className={styles.chartDay} title={`${day.date}\nEntrada: ${formatCurrency(day.income)}\nSaída: ${formatCurrency(day.expense)}`}>
                                        <div className={styles.chartBars}>
                                            <div className={`${styles.bar} ${styles.barIncome}`} style={{ height: `${incomeH}%` }} />
                                            <div className={`${styles.bar} ${styles.barExpense}`} style={{ height: `${expenseH}%` }} />
                                        </div>
                                        <span className={styles.chartLabel}>{dateLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={styles.chartLegend}>
                            <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.income}`} /> Entradas</span>
                            <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.expense}`} /> Saídas</span>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <h3>Transações do Mês ({transactions.length})</h3>
                </CardHeader>
                <CardBody>
                    {transactions.length === 0 ? (
                        <p className={styles.empty}>Nenhuma transação neste mês</p>
                    ) : (
                        <div className={styles.txnList}>
                            {transactions.slice(0, 50).map(txn => (
                                <div key={txn.id} className={styles.txnRow}>
                                    <div className={styles.txnLeft}>
                                        <span className={`${styles.txnType} ${txn.type === 'income' ? styles.income : styles.expense}`}>
                                            {txn.type === 'income' ? '+' : '-'}
                                        </span>
                                        <div>
                                            <span className={styles.txnDesc}>{txn.description || txn.category?.name || 'Sem descrição'}</span>
                                            <span className={styles.txnDate}>{new Date(txn.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <span className={`${styles.txnAmount} ${txn.type === 'income' ? styles.income : styles.expense}`}>
                                        {txn.type === 'income' ? '+' : '-'} {formatCurrency(Number(txn.amount))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Transaction Form Modal */}
            {showForm && (
                <TransactionFormModal
                    categories={categories}
                    onSave={handleTransactionSaved}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
}
