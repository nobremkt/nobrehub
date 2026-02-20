/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TRANSACTION FORM MODAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * Modal for creating/editing financial transactions.
 */

import { useState } from 'react';
import { Modal, Button, Input, Dropdown } from '@/design-system';
import { Save } from 'lucide-react';
import { FinancialService, type FinancialTransaction, type FinancialCategory } from '../services/FinancialService';
import { toast } from 'react-toastify';
import styles from './TransactionFormModal.module.css';

interface Props {
    categories: FinancialCategory[];
    transaction?: FinancialTransaction;
    onSave: () => void;
    onClose: () => void;
}

const PAYMENT_METHODS = [
    { value: '', label: 'Não especificado' },
    { value: 'Pix', label: 'Pix' },
    { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
    { value: 'Cartão de Débito', label: 'Cartão de Débito' },
    { value: 'Boleto', label: 'Boleto' },
    { value: 'Transferência', label: 'Transferência' },
    { value: 'Dinheiro', label: 'Dinheiro' },
];

export function TransactionFormModal({ categories, transaction, onSave, onClose }: Props) {
    const isEditing = !!transaction;

    const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
    const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
    const [categoryId, setCategoryId] = useState(transaction?.category_id || '');
    const [description, setDescription] = useState(transaction?.description || '');
    const [paymentMethod, setPaymentMethod] = useState(transaction?.payment_method || '');
    const [notes, setNotes] = useState(transaction?.notes || '');
    const [saving, setSaving] = useState(false);

    const filteredCategories = categories.filter(c => c.type === type);
    const categoryOptions = [
        { value: '', label: 'Sem categoria' },
        ...filteredCategories.map(c => ({ value: c.id, label: c.name })),
    ];

    const handleSave = async () => {
        const numAmount = parseFloat(amount.replace(',', '.'));
        if (!date || isNaN(numAmount) || numAmount <= 0) {
            toast.warn('Preencha data e valor válidos');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                date,
                type,
                category_id: categoryId || null,
                description: description.trim() || undefined,
                amount: numAmount,
                payment_method: paymentMethod || undefined,
                notes: notes.trim() || undefined,
            };

            if (isEditing) {
                await FinancialService.updateTransaction(transaction!.id, payload);
            } else {
                await FinancialService.createTransaction(payload);
            }
            onSave();
        } catch (err) {
            console.error('Error saving transaction:', err);
            toast.error('Erro ao salvar transação');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={isEditing ? 'Editar Transação' : 'Nova Transação'}
            size="md"
        >
            <div className={styles.form}>
                {/* Type selector */}
                <div className={styles.typeSelector}>
                    <button
                        className={`${styles.typeBtn} ${type === 'income' ? styles.activeIncome : ''}`}
                        onClick={() => { setType('income'); setCategoryId(''); }}
                    >
                        Entrada
                    </button>
                    <button
                        className={`${styles.typeBtn} ${type === 'expense' ? styles.activeExpense : ''}`}
                        onClick={() => { setType('expense'); setCategoryId(''); }}
                    >
                        Saída
                    </button>
                </div>

                <div className={styles.row}>
                    <Input
                        label="Data"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <Input
                        label="Valor (R$)"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                <Dropdown
                    label="Categoria"
                    options={categoryOptions}
                    value={categoryId}
                    onChange={(v) => setCategoryId(String(v))}
                />

                <Input
                    label="Descrição"
                    placeholder="Ex: Pagamento salários dezembro..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div className={styles.row}>
                    <Dropdown
                        label="Forma de Pagamento"
                        options={PAYMENT_METHODS}
                        value={paymentMethod}
                        onChange={(v) => setPaymentMethod(String(v))}
                    />
                </div>

                <Input
                    label="Observações"
                    placeholder="Notas adicionais..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                <div className={styles.actions}>
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        <Save size={16} />
                        {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
