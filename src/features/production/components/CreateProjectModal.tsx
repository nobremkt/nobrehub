
import { useState, useMemo, useEffect } from 'react';
import { useProductionStore } from '../stores/useProductionStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { useProductStore } from '@/features/settings/stores/useProductStore';
import { useGoalsStore } from '@/features/settings/stores/useGoalsStore';
import { LeadService } from '@/features/crm/services/LeadService';
import { InboxService } from '@/features/inbox/services/InboxService';
import {
    Modal,
    Input,
    Button,
    Dropdown,
    Switch,
} from '@/design-system';
import { VideoDurationCategory, DistributionStatus } from '@/types/project.types';
import { toast } from 'react-toastify';
import { Star, Package } from 'lucide-react';
import styles from './CreateProjectModal.module.css';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Lead já vem do Inbox - não precisa selecionar
    leadId?: string;
    leadName?: string;
    conversationId?: string; // Para fechar a conversa depois
    onProjectCreated?: (projectId: string) => void; // Callback para ações adicionais
}

// Categorias de duração para vídeos
const DURATION_OPTIONS = [
    { value: '30s', label: '30 segundos' },
    { value: '60s', label: '60 segundos' },
    { value: '60plus', label: 'Mais de 60s' },
];

export const CreateProjectModal = ({
    isOpen,
    onClose,
    leadId,
    leadName,
    conversationId,
    onProjectCreated
}: CreateProjectModalProps) => {
    const { addProject, isLoading } = useProductionStore();
    const { collaborators } = useCollaboratorStore();
    const { sectors } = useSectorStore();
    const { products, fetchProducts } = useProductStore();
    const { config: goalsConfig, init: initGoals } = useGoalsStore();

    // Form State
    const [name, setName] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [driveLink, setDriveLink] = useState('');
    const [notes, setNotes] = useState('');

    // Produto e pontos
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedDuration, setSelectedDuration] = useState<VideoDurationCategory | ''>('');
    const [extraPoints, setExtraPoints] = useState(0);

    // Sugestão de produtor (opcional)
    const [suggestProducer, setSuggestProducer] = useState(false);
    const [suggestedProducerId, setSuggestedProducerId] = useState('');
    const [suggestedProducerError, setSuggestedProducerError] = useState('');
    const [suggestionNotes, setSuggestionNotes] = useState('');

    // Busca produtos e config de pontos ao abrir
    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            initGoals();
        }
    }, [isOpen, fetchProducts, initGoals]);

    // Reseta form ao abrir
    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    // Encontra o setor de produção
    const productionSectorId = useMemo(() => {
        const sector = sectors.find(s =>
            s.name.toLowerCase() === 'produção' || s.name.toLowerCase() === 'production'
        );
        return sector?.id;
    }, [sectors]);

    // Lista de produtores disponíveis
    const producers = useMemo(() => {
        if (!productionSectorId) return [];
        return collaborators.filter(c => c.sectorId === productionSectorId && c.active);
    }, [collaborators, productionSectorId]);

    // Opções de produtos ativos
    const productOptions = useMemo(() => {
        return products
            .filter(p => p.active)
            .map(p => ({
                value: p.id,
                label: `${p.name} ${p.points ? `(${p.points} pts)` : ''}`
            }));
    }, [products]);

    // Produto selecionado
    const selectedProduct = useMemo(() => {
        return products.find(p => p.id === selectedProductId);
    }, [products, selectedProductId]);

    // Verifica se produto é vídeo (pela categoria, não durationPoints)
    const isVideoProduct = useMemo(() => {
        if (!selectedProduct) return false;
        const cat = selectedProduct.category?.toLowerCase() || '';
        return cat.includes('vídeo') || cat.includes('video');
    }, [selectedProduct]);

    // Calcula pontos base do produto
    const basePoints = useMemo(() => {
        if (!selectedProduct) return 0;

        // Se for vídeo, usa pontos globais de duração do config
        if (isVideoProduct && selectedDuration && goalsConfig?.videoDurationPoints) {
            return goalsConfig.videoDurationPoints[selectedDuration] || 0;
        }

        // Senão usa pontos base do produto
        return selectedProduct.points || 0;
    }, [selectedProduct, isVideoProduct, selectedDuration, goalsConfig]);

    const totalPoints = basePoints + extraPoints;

    const producerOptions = useMemo(() => {
        return producers.map(p => ({
            value: p.id,
            label: p.name
        }));
    }, [producers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuggestedProducerError('');

        if (!name || !dueDate) {
            toast.error('Preencha os campos obrigatórios (Nome, Prazo).');
            return;
        }

        if (!selectedProductId) {
            toast.error('Selecione um produto.');
            return;
        }

        if (isVideoProduct && !selectedDuration) {
            toast.error('Selecione a duração do vídeo.');
            return;
        }

        if (suggestProducer && !suggestedProducerId) {
            setSuggestedProducerError('Selecione um produtor para continuar com a sugestão.');
            toast.error('Selecione um produtor para sugestão ou desative a opção.');
            return;
        }

        // Determina o status de distribuição
        let distributionStatus: DistributionStatus = 'pending';

        if (suggestProducer && suggestedProducerId) {
            distributionStatus = 'suggested';
        }

        try {
            const linkedLeadId = leadId || conversationId || 'manual';
            const linkedLeadName = leadName || 'Cliente manual';

            // Monta objeto do projeto (sem campos undefined)
            const projectData: Record<string, unknown> = {
                name,
                leadId: linkedLeadId,
                leadName: linkedLeadName,
                status: 'aguardando',
                dueDate: new Date(dueDate),
                driveLink: driveLink || '',
                notes: notes || '',
                checklist: [],
                productType: selectedProduct?.name || '',
                productId: selectedProductId,
                basePoints,
                extraPoints,
                totalPoints,
                distributionStatus,
                producerId: '',
                producerName: '',
                source: conversationId ? 'inbox' : 'manual',
            };

            // Adiciona durationCategory apenas se for vídeo e tiver selecionado
            if (isVideoProduct && selectedDuration) {
                projectData.durationCategory = selectedDuration;
            }

            // Adiciona sugestão de produtor apenas se tiver
            if (suggestProducer && suggestedProducerId) {
                projectData.suggestedProducerId = suggestedProducerId;
                projectData.suggestedProducerName = producers.find(p => p.id === suggestedProducerId)?.name || '';
                if (suggestionNotes) {
                    projectData.suggestionNotes = suggestionNotes;
                }
            }

            // 1. Criar o projeto na lista de distribuição
            const projectId = await addProject(projectData as any);

            // 2. Atualizar o Lead para pós-venda (se tiver leadId válido)
            // Usa updateOrCreateLead que cria o lead se ele não existir no Firestore
            if (linkedLeadId && linkedLeadId !== 'manual') {
                try {
                    await LeadService.updateOrCreateLead(
                        linkedLeadId,
                        {
                            // 'distribution' para aparecer na lista de distribuição do pós-venda
                            currentSector: 'distribution',
                            clientStatus: 'aguardando_projeto',
                            postSalesDistributionStatus: 'pending',
                            dealStatus: 'won',
                            dealClosedAt: new Date(), // Marca quando fechou a venda
                        },
                        // Dados para criação caso não exista
                        { name: linkedLeadName }
                    );
                } catch (error) {
                    console.error('Erro ao atualizar lead para pós-venda:', error);
                    // Não bloqueia o fluxo, projeto foi criado
                }
            }

            // 3. Transferir conversa para o Pós-Venda (não fecha, transfere!)
            if (conversationId) {
                try {
                    await InboxService.transferToPostSales(conversationId);
                } catch (error) {
                    console.error('Erro ao transferir conversa para pós-venda:', error);
                    // Não bloqueia o fluxo
                }
            }

            toast.success('Projeto criado! Cliente enviado para pós-venda.');
            onProjectCreated?.(projectId);
            onClose();

        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar projeto.');
        }
    };

    const resetForm = () => {
        setName('');
        setDueDate('');
        setDriveLink('');
        setNotes('');
        setSelectedProductId('');
        setSelectedDuration('');
        setExtraPoints(0);
        setSuggestProducer(false);
        setSuggestedProducerId('');
        setSuggestionNotes('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Criar Projeto"
            size="md"
        >
            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Cliente (apenas exibição) */}
                {leadName && (
                    <div className={styles.clientInfo}>
                        <span className={styles.clientLabel}>Cliente:</span>
                        <span className={styles.clientName}>{leadName}</span>
                    </div>
                )}

                <Input
                    label="Nome do Projeto"
                    placeholder="Ex: Vídeo Institucional"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    fullWidth
                />

                {/* Produto */}
                <Dropdown
                    label="Produto"
                    required
                    options={productOptions}
                    value={selectedProductId}
                    onChange={(val) => {
                        setSelectedProductId(String(val));
                        setSelectedDuration(''); // Reset duração ao mudar produto
                    }}
                    placeholder="Selecione o produto..."
                />

                {/* Duração (só para vídeos) */}
                {isVideoProduct && (
                    <Dropdown
                        label="Duração do Vídeo"
                        required
                        options={DURATION_OPTIONS}
                        value={selectedDuration}
                        onChange={(val) => setSelectedDuration(val as VideoDurationCategory)}
                        placeholder="Selecione a duração..."
                    />
                )}

                {/* Pontos */}
                <div className={styles.pointsContainer}>
                    <div className={styles.pointsInfo}>
                        <Package size={16} className={styles.pointsIcon} />
                        <span className={styles.pointsLabel}>Pontos Base:</span>
                        <span className={styles.pointsValue}>{basePoints}</span>
                    </div>
                    <div className={styles.extraPoints}>
                        <span className={styles.pointsLabel}>Extras:</span>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            className={styles.extraPointsInput}
                            value={extraPoints}
                            onChange={(e) => setExtraPoints(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className={styles.totalPoints}>
                        <span className={styles.pointsLabel}>Total:</span>
                        <span className={styles.totalValue}>{totalPoints} pts</span>
                    </div>
                </div>

                {/* Prazo */}
                <div className={styles.dateField}>
                    <label className={styles.dateLabel}>
                        Prazo de Entrega <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                    />
                </div>

                {/* Link do Drive (opcional) */}
                <Input
                    label="Link do Drive (opcional)"
                    placeholder="https://drive.google.com/..."
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    fullWidth
                />

                {/* Observações */}
                <div className={styles.textareaField}>
                    <label className={styles.textareaLabel}>Observações</label>
                    <textarea
                        className={styles.textarea}
                        placeholder="Detalhes adicionais do projeto..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Sugestão de Produtor (opcional) */}
                <div className={styles.suggestionSection}>
                    <div className={styles.suggestionHeader}>
                        <div className={styles.suggestionLabel}>
                            <Star size={14} className={styles.starIcon} />
                            <span>Sugerir Produtor</span>
                        </div>
                        <Switch
                            checked={suggestProducer}
                            onChange={(checked) => {
                                setSuggestProducer(checked);
                                if (!checked) {
                                    setSuggestedProducerError('');
                                }
                            }}
                        />
                    </div>
                    <p className={styles.suggestionHint}>
                        O líder de produção decide a atribuição final
                    </p>

                    {suggestProducer && (
                        <div className={styles.suggestionFields}>
                            <Dropdown
                                label="Produtor Sugerido"
                                required={suggestProducer}
                                options={producerOptions}
                                value={suggestedProducerId}
                                onChange={(val) => {
                                    setSuggestedProducerId(String(val));
                                    setSuggestedProducerError('');
                                }}
                                placeholder="Selecionar produtor..."
                                error={suggestedProducerError}
                            />
                            <input
                                type="text"
                                className={styles.suggestionNotesInput}
                                placeholder="Motivo da sugestão (opcional)"
                                value={suggestionNotes}
                                onChange={(e) => setSuggestionNotes(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Botões */}
                <div className={styles.actions}>
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" isLoading={isLoading}>
                        Criar Projeto
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
