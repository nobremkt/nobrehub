import { useState, useEffect } from 'react';
import { Lead } from '@/types/lead.types';
import { Info, StickyNote, Pencil, Save, X } from 'lucide-react';
import styles from './InformacoesTab.module.css';
import { formatCurrency, formatDate, formatPhone } from '@/utils';
import { Input, Button, Dropdown, PhoneInput } from '@/design-system';

interface InformacoesTabProps {
    lead: Lead;
}

export function InformacoesTab({ lead }: InformacoesTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Lead>(lead);

    // Atualiza formData se a prop lead mudar
    useEffect(() => {
        setFormData(lead);
    }, [lead]);

    const handleInputChange = (field: keyof Lead, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // Aqui chamaria a função de update (props.onUpdate ou similar)
        // Como não temos isso na interface ainda, vou apenas sair do modo edição
        // fingindo que salvou localmente para feedback visual (mas não persiste sem backend)
        console.log('Dados salvos:', formData);
        setIsEditing(false);
        // Idealmente: await onUpdate(formData);
    };

    const handleCancel = () => {
        setFormData(lead); // Reverte alterações
        setIsEditing(false);
    };

    const pipelineOptions = [
        { label: 'High Ticket', value: 'high-ticket' },
        { label: 'Low Ticket', value: 'low-ticket' },
    ];

    return (
        <div className={styles.tabContent}>
            {/* Header com Título e Botões de Ação */}
            <div className={styles.header}>
                <h3 className={styles.sectionTitle}>
                    <Info size={18} />
                    Dados do Lead
                </h3>
                <div className={styles.actions}>
                    {isEditing ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                leftIcon={<X size={16} />}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                leftIcon={<Save size={16} />}
                            >
                                Salvar
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            leftIcon={<Pencil size={16} />}
                        >
                            Editar
                        </Button>
                    )}
                </div>
            </div>

            <div className={styles.sectionCard}>
                <div className={styles.infoGrid}>
                    {/* Nome Completo */}
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Nome Completo</span>
                        {isEditing ? (
                            <Input
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                fullWidth
                                size="sm"
                            />
                        ) : (
                            <span className={styles.infoValue}>{formData.name}</span>
                        )}
                    </div>

                    {/* Email */}
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Email</span>
                        {isEditing ? (
                            <Input
                                value={formData.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                fullWidth
                                size="sm"
                            />
                        ) : (
                            <span className={styles.infoValue}>{formData.email || 'Não informado'}</span>
                        )}
                    </div>

                    {/* Telefone */}
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Telefone</span>
                        {isEditing ? (
                            <PhoneInput
                                value={formData.phone || ''}
                                onChange={(val) => handleInputChange('phone', val)}
                            />
                        ) : (
                            <span className={styles.infoValue}>{formData.phone ? formatPhone(formData.phone) : 'Não informado'}</span>
                        )}
                    </div>

                    {/* Empresa */}
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Empresa</span>
                        {isEditing ? (
                            <Input
                                value={formData.company || ''}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                fullWidth
                                size="sm"
                            />
                        ) : (
                            <span className={styles.infoValue}>{formData.company || 'Não informado'}</span>
                        )}
                    </div>

                    {/* Valor Estimado */}
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Valor Estimado</span>
                        {isEditing ? (
                            <Input
                                type="number"
                                value={formData.estimatedValue || ''}
                                onChange={(e) => handleInputChange('estimatedValue', Number(e.target.value))}
                                fullWidth
                                size="sm"
                                leftIcon={<span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>R$</span>}
                            />
                        ) : (
                            <span className={styles.infoValue}>{formatCurrency(formData.estimatedValue || 0)}</span>
                        )}
                    </div>

                    {/* Pipeline */}
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Pipeline</span>
                        {isEditing ? (
                            <Dropdown
                                options={pipelineOptions}
                                value={formData.pipeline}
                                onChange={(val) => handleInputChange('pipeline', val)}
                                className={styles.dropdownOverride}
                            />
                        ) : (
                            <span className={styles.infoValue}>{formData.pipeline === 'high-ticket' ? 'High Ticket' : 'Low Ticket'}</span>
                        )}
                    </div>

                    {/* Campos Somente Leitura */}
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Criado em</span>
                        <span className={styles.infoValue}>{formatDate(formData.createdAt)}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Última atualização</span>
                        <span className={styles.infoValue}>{formatDate(formData.updatedAt)}</span>
                    </div>
                </div>
            </div>

            {/* Seção Notas */}
            {(lead.notes || isEditing) && (
                <>
                    <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>
                        <StickyNote size={18} />
                        Notas
                    </h3>
                    <div className={styles.sectionCard}>
                        {isEditing ? (
                            <Input
                                multiline
                                rows={4}
                                value={formData.notes || ''}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                fullWidth
                                placeholder="Adicione observações sobre este lead..."
                            />
                        ) : (
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{formData.notes}</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
