/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - HOLIDAYS PAGE (FERIADOS & FOLGAS)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Manage national holidays and custom days off
 */

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Input, Button, Spinner, Dropdown } from '@/design-system';
import { Plus, Trash2, Flag, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHolidaysStore } from '../stores/useHolidaysStore';
import { toast } from 'react-toastify';

export const HolidaysPage: React.FC = () => {
    const {
        holidays,
        customDaysOff,
        selectedYear,
        isLoading,
        isSaving,
        init,
        setYear,
        addDayOff,
        removeDayOff
    } = useHolidaysStore();

    const [newDate, setNewDate] = useState<string>('');
    const [newName, setNewName] = useState<string>('');
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        init();
    }, [init]);

    const handleAddDayOff = async () => {
        if (!newDate || !newName.trim()) {
            toast.error('Preencha a data e o nome da folga');
            return;
        }

        try {
            await addDayOff(newDate, newName.trim());
            toast.success('Folga adicionada!');
            setNewDate('');
            setNewName('');
            setShowAddForm(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao adicionar folga');
        }
    };

    const handleRemoveDayOff = async (id: string, name: string) => {
        if (!confirm(`Remover "${name}" da lista de folgas?`)) return;

        try {
            await removeDayOff(id);
            toast.success('Folga removida!');
        } catch {
            toast.error('Erro ao remover folga');
        }
    };

    const handlePreviousYear = () => setYear(selectedYear - 1);
    const handleNextYear = () => setYear(selectedYear + 1);

    // Year options for dropdown
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => ({
        value: String(currentYear - 2 + i),
        label: String(currentYear - 2 + i)
    }));

    // Format date for display
    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    // Check if a date has passed
    const isPast = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(dateStr);
        return date < today;
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    📅 Feriados & Folgas
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Gerencie feriados nacionais e folgas customizadas da equipe.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Year Selector */}
                <Card>
                    <CardBody>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem'
                        }}>
                            <Button
                                variant="ghost"
                                leftIcon={<ChevronLeft size={20} />}
                                onClick={handlePreviousYear}
                            >
                                {selectedYear - 1}
                            </Button>

                            <div style={{ minWidth: '150px' }}>
                                <Dropdown
                                    options={yearOptions}
                                    value={String(selectedYear)}
                                    onChange={(val) => setYear(Number(val))}
                                    placeholder="Ano"
                                />
                            </div>

                            <Button
                                variant="ghost"
                                rightIcon={<ChevronRight size={20} />}
                                onClick={handleNextYear}
                            >
                                {selectedYear + 1}
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                {/* National Holidays */}
                <Card>
                    <CardHeader
                        title={`Feriados Nacionais (${selectedYear})`}
                        action={<Flag size={20} style={{ color: 'var(--color-success-500)' }} />}
                    />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {holidays.filter(h => h.type === 'national').map((holiday, idx) => (
                                <div
                                    key={`${holiday.date}-${idx}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.75rem 1rem',
                                        background: isPast(holiday.date)
                                            ? 'var(--color-bg-tertiary)'
                                            : 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        opacity: isPast(holiday.date) ? 0.6 : 1
                                    }}
                                >
                                    <div style={{
                                        width: '90px',
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        {holiday.date.split('-').reverse().join('/')}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500' }}>{holiday.name}</div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-text-muted)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {formatDate(holiday.date)}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '0.25rem 0.5rem',
                                        background: 'var(--color-success-500)',
                                        color: 'white',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.625rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        Nacional
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Custom Days Off */}
                <Card>
                    <CardHeader
                        title="Folgas Personalizadas"
                        action={
                            <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Plus size={16} />}
                                onClick={() => setShowAddForm(!showAddForm)}
                            >
                                Adicionar
                            </Button>
                        }
                    />
                    <CardBody>
                        {/* Add Form */}
                        {showAddForm && (
                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1rem'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    flexWrap: 'wrap',
                                    alignItems: 'flex-end'
                                }}>
                                    <div style={{ width: '180px' }}>
                                        <Input
                                            label="Data"
                                            type="date"
                                            value={newDate}
                                            onChange={(e) => setNewDate(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <Input
                                            label="Nome da Folga"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Ex: Recesso de fim de ano"
                                        />
                                    </div>
                                    <Button
                                        variant="primary"
                                        leftIcon={isSaving ? <Spinner size="sm" /> : <Plus size={18} />}
                                        onClick={handleAddDayOff}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Salvando...' : 'Adicionar'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* List of custom days off */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {holidays.filter(h => h.type === 'custom').length === 0 ? (
                                <div style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    <Coffee size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                    <p>Nenhuma folga personalizada cadastrada para {selectedYear}.</p>
                                    <p style={{ fontSize: '0.875rem' }}>
                                        Clique em "Adicionar" para criar uma nova folga.
                                    </p>
                                </div>
                            ) : (
                                holidays.filter(h => h.type === 'custom').map((holiday) => {
                                    // Find the corresponding DayOff to get the ID
                                    const dayOff = customDaysOff.find(d => d.date === holiday.date);

                                    return (
                                        <div
                                            key={holiday.date}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.75rem 1rem',
                                                background: isPast(holiday.date)
                                                    ? 'var(--color-bg-tertiary)'
                                                    : 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                opacity: isPast(holiday.date) ? 0.6 : 1
                                            }}
                                        >
                                            <div style={{
                                                width: '90px',
                                                fontFamily: 'monospace',
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-muted)'
                                            }}>
                                                {holiday.date.split('-').reverse().join('/')}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '500' }}>{holiday.name}</div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-muted)',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {formatDate(holiday.date)}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '0.25rem 0.5rem',
                                                background: 'var(--color-primary-500)',
                                                color: 'white',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.625rem',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase'
                                            }}>
                                                Folga
                                            </div>
                                            {dayOff && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveDayOff(dayOff.id, holiday.name)}
                                                    style={{ color: 'var(--color-danger-500)' }}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Summary */}
                <div style={{
                    padding: '1rem',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)'
                }}>
                    <p style={{ margin: 0 }}>
                        📊 <strong>Resumo {selectedYear}:</strong>{' '}
                        {holidays.filter(h => h.type === 'national').length} feriados nacionais{' '}
                        + {holidays.filter(h => h.type === 'custom').length} folgas personalizadas{' '}
                        = <strong>{holidays.length} dias não úteis</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};
