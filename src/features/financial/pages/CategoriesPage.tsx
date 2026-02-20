/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CATEGORIES PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Manage financial categories (income/expense types with colors).
 */

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardBody, CardHeader, Input, Spinner, Dropdown } from '@/design-system';
import { Plus, Trash2, Edit2, FolderOpen, Save, X } from 'lucide-react';
import { FinancialService, type FinancialCategory } from '../services/FinancialService';
import { toast } from 'react-toastify';
import styles from './CategoriesPage.module.css';

const COLORS = [
    '#22c55e', '#10b981', '#06b6d4', '#3b82f6',
    '#8b5cf6', '#f59e0b', '#f97316', '#ef4444',
    '#ec4899', '#6b7280',
];

export function CategoriesPage() {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<FinancialCategory | null>(null);
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState<'income' | 'expense'>('expense');
    const [formColor, setFormColor] = useState(COLORS[0]);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const cats = await FinancialService.getCategories();
            setCategories(cats);
        } catch (err) {
            console.error('Error fetching categories:', err);
            toast.error('Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const openForm = (cat?: FinancialCategory) => {
        if (cat) {
            setEditing(cat);
            setFormName(cat.name);
            setFormType(cat.type);
            setFormColor(cat.color);
        } else {
            setEditing(null);
            setFormName('');
            setFormType('expense');
            setFormColor(COLORS[0]);
        }
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            toast.warn('Nome é obrigatório');
            return;
        }
        try {
            if (editing) {
                await FinancialService.updateCategory(editing.id, {
                    name: formName.trim(),
                    type: formType,
                    color: formColor,
                });
                toast.success('Categoria atualizada');
            } else {
                await FinancialService.createCategory({
                    name: formName.trim(),
                    type: formType,
                    color: formColor,
                    icon: null,
                });
                toast.success('Categoria criada');
            }
            setShowForm(false);
            fetchCategories();
        } catch {
            toast.error('Erro ao salvar categoria');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta categoria? Transações associadas ficarão sem categoria.')) return;
        try {
            await FinancialService.deleteCategory(id);
            toast.success('Categoria excluída');
            fetchCategories();
        } catch {
            toast.error('Erro ao excluir');
        }
    };

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    const typeOptions = [
        { value: 'income', label: 'Entrada' },
        { value: 'expense', label: 'Saída' },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <FolderOpen size={24} className={styles.headerIcon} />
                    <h1 className={styles.title}>Categorias Financeiras</h1>
                </div>
                <Button variant="primary" onClick={() => openForm()}>
                    <Plus size={16} />
                    Nova Categoria
                </Button>
            </div>

            {loading ? (
                <div className={styles.loadingContainer}><Spinner size="lg" /></div>
            ) : (
                <div className={styles.columns}>
                    {/* Income */}
                    <Card>
                        <CardHeader>
                            <h3 className={styles.columnTitle}>
                                <span className={`${styles.columnDot} ${styles.income}`} />
                                Entradas ({incomeCategories.length})
                            </h3>
                        </CardHeader>
                        <CardBody>
                            {incomeCategories.length === 0 ? (
                                <p className={styles.empty}>Nenhuma categoria de entrada</p>
                            ) : (
                                <div className={styles.catList}>
                                    {incomeCategories.map(cat => (
                                        <div key={cat.id} className={styles.catItem}>
                                            <div className={styles.catInfo}>
                                                <span className={styles.catDot} style={{ background: cat.color }} />
                                                <span className={styles.catName}>{cat.name}</span>
                                            </div>
                                            <div className={styles.catActions}>
                                                <button className={styles.actionBtn} onClick={() => openForm(cat)}><Edit2 size={14} /></button>
                                                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(cat.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Expense */}
                    <Card>
                        <CardHeader>
                            <h3 className={styles.columnTitle}>
                                <span className={`${styles.columnDot} ${styles.expense}`} />
                                Saídas ({expenseCategories.length})
                            </h3>
                        </CardHeader>
                        <CardBody>
                            {expenseCategories.length === 0 ? (
                                <p className={styles.empty}>Nenhuma categoria de saída</p>
                            ) : (
                                <div className={styles.catList}>
                                    {expenseCategories.map(cat => (
                                        <div key={cat.id} className={styles.catItem}>
                                            <div className={styles.catInfo}>
                                                <span className={styles.catDot} style={{ background: cat.color }} />
                                                <span className={styles.catName}>{cat.name}</span>
                                            </div>
                                            <div className={styles.catActions}>
                                                <button className={styles.actionBtn} onClick={() => openForm(cat)}><Edit2 size={14} /></button>
                                                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(cat.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Inline Form */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <h3>{editing ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                    </CardHeader>
                    <CardBody>
                        <div className={styles.form}>
                            <Input
                                label="Nome"
                                placeholder="Ex: Marketing, Comissões..."
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                            <Dropdown
                                label="Tipo"
                                options={typeOptions}
                                value={formType}
                                onChange={(v) => setFormType(v as 'income' | 'expense')}
                            />
                            <div>
                                <label className={styles.colorLabel}>Cor</label>
                                <div className={styles.colorGrid}>
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            className={`${styles.colorSwatch} ${formColor === c ? styles.selected : ''}`}
                                            style={{ background: c }}
                                            onClick={() => setFormColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className={styles.formActions}>
                                <Button variant="ghost" onClick={() => setShowForm(false)}>
                                    <X size={16} />
                                    Cancelar
                                </Button>
                                <Button variant="primary" onClick={handleSave}>
                                    <Save size={16} />
                                    Salvar
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
