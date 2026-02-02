
import { Lead } from '@/types/lead.types';
import { Info, StickyNote } from 'lucide-react';
import styles from './InformacoesTab.module.css';
import { formatCurrency, formatDate, formatPhone } from '@/utils';

interface InformacoesTabProps {
    lead: Lead;
}

export function InformacoesTab({ lead }: InformacoesTabProps) {
    return (
        <div className={styles.tabContent}>
            <h3 className={styles.sectionTitle}>
                <Info size={18} />
                Dados do Lead
            </h3>

            <div className={styles.sectionCard}>
                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Nome Completo</span>
                        <span className={styles.infoValue}>{lead.name}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Email</span>
                        <span className={styles.infoValue}>{lead.email || 'Não informado'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Telefone</span>
                        <span className={styles.infoValue}>{lead.phone ? formatPhone(lead.phone) : 'Não informado'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Empresa</span>
                        <span className={styles.infoValue}>{lead.company || 'Não informado'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Valor Estimado</span>
                        <span className={styles.infoValue}>{formatCurrency(lead.estimatedValue || 0)}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Pipeline</span>
                        <span className={styles.infoValue}>{lead.pipeline === 'venda' ? 'Venda' : 'Pós-Venda'}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Criado em</span>
                        <span className={styles.infoValue}>{formatDate(lead.createdAt)}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Última atualização</span>
                        <span className={styles.infoValue}>{formatDate(lead.updatedAt)}</span>
                    </div>
                </div>
            </div>

            {lead.notes && (
                <>
                    <h3 className={styles.sectionTitle}>
                        <StickyNote size={18} />
                        Notas
                    </h3>
                    <div className={styles.sectionCard}>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
                    </div>
                </>
            )}
        </div>
    );
}
