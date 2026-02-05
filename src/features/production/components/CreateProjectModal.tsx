
import { useState, useMemo, useEffect } from 'react';
import { useProductionStore } from '../stores/useProductionStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { LeadService } from '@/features/crm/services/LeadService';
import { Lead } from '@/types/lead.types';
import {
    Modal,
    Input,
    Button,
    Dropdown,
    Switch,
} from '@/design-system';
import { ProjectStatus, VideoDurationCategory, DistributionStatus } from '@/types/project.types';
import { toast } from 'react-toastify';
import { Star } from 'lucide-react';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialLeadId?: string;
    initialLeadName?: string;
}

const PROJECT_STATUS_OPTIONS = [
    { value: 'aguardando', label: 'Aguardando' },
    { value: 'em-producao', label: 'Em Produção' },
    { value: 'a-revisar', label: 'A Revisar' },
    { value: 'revisado', label: 'Revisado' },
    { value: 'alteracao', label: 'Em Alteração' },
];

// Opcoes de tipo de produto (exemplo)
const PRODUCT_TYPE_OPTIONS = [
    { value: 'video-30s', label: 'Vídeo 30s' },
    { value: 'video-60s', label: 'Vídeo 60s' },
    { value: 'video-60plus', label: 'Vídeo 60s+' },
    { value: 'arte', label: 'Arte/Design' },
    { value: 'carrossel', label: 'Carrossel' },
    { value: 'outro', label: 'Outro' },
];

// Pontuação base por tipo de produto (pode vir de config futuramente)
const BASE_POINTS: Record<string, number> = {
    'video-30s': 1,
    'video-60s': 2,
    'video-60plus': 3,
    'arte': 1,
    'carrossel': 1,
    'outro': 1,
};

export const CreateProjectModal = ({ isOpen, onClose, initialLeadId, initialLeadName }: CreateProjectModalProps) => {
    const { addProject, isLoading } = useProductionStore();
    const { collaborators } = useCollaboratorStore();
    const { sectors } = useSectorStore();

    // Form State - Campos existentes
    const [name, setName] = useState('');
    const [leadName, setLeadName] = useState('');
    const [status, setStatus] = useState<ProjectStatus>('aguardando');
    const [dueDate, setDueDate] = useState('');
    const [driveLink, setDriveLink] = useState('');
    const [notes, setNotes] = useState('');

    // Novos campos para distribuição
    const [productType, setProductType] = useState('video-30s');
    const [extraPoints, setExtraPoints] = useState(0);
    const [sendToDistribution, setSendToDistribution] = useState(true);
    const [suggestProducer, setSuggestProducer] = useState(false);
    const [suggestedProducerId, setSuggestedProducerId] = useState('');
    const [suggestionNotes, setSuggestionNotes] = useState('');

    // Estado para leads
    const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
    const [selectedLeadId, setSelectedLeadId] = useState('');

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

    // Busca leads ao abrir o modal
    useEffect(() => {
        if (isOpen) {
            LeadService.getLeads().then(leads => {
                // Filtra leads que não estão concluídos
                setAvailableLeads(leads.filter(l => l.clientStatus !== 'concluido'));
            }).catch(err => console.error('Error fetching leads:', err));
        }
    }, [isOpen]);

    // Pré-preenche com lead inicial (quando vindo do CRM/Inbox)
    useEffect(() => {
        if (isOpen && initialLeadName) {
            // Se tiver leadId, seleciona o lead existente
            if (initialLeadId) {
                setSelectedLeadId(initialLeadId);
            }
            // Sempre preenche o nome do cliente
            setLeadName(initialLeadName);
        }
    }, [isOpen, initialLeadId, initialLeadName]);

    // Opções de leads para dropdown
    const leadOptions = useMemo(() => {
        return [
            { value: '', label: 'Criar manualmente' },
            ...availableLeads.map(lead => ({
                value: lead.id,
                label: `${lead.name} ${lead.phone ? `(${lead.phone})` : ''}`
            }))
        ];
    }, [availableLeads]);

    const producerOptions = useMemo(() => {
        return producers.map(p => ({
            value: p.id,
            label: p.name
        }));
    }, [producers]);

    // Calcula pontos totais
    const basePoints = BASE_POINTS[productType] || 1;
    const totalPoints = basePoints + extraPoints;

    // Determina a categoria de duração para vídeos
    const getDurationCategory = (): VideoDurationCategory | undefined => {
        if (productType.startsWith('video')) {
            if (productType.includes('30')) return '30s';
            if (productType.includes('60plus')) return '60plus';
            if (productType.includes('60')) return '60s';
        }
        return undefined;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !leadName || !dueDate) {
            toast.error('Preencha os campos obrigatórios (Nome, Cliente, Prazo).');
            return;
        }

        // Determina o status de distribuição
        let distributionStatus: DistributionStatus = 'pending';
        let producerId: string | undefined;
        let producerName: string | undefined;

        if (!sendToDistribution) {
            // Se não vai para distribuição, precisa selecionar produtor
            if (!suggestedProducerId) {
                toast.error('Selecione um produtor para atribuir diretamente.');
                return;
            }
            distributionStatus = 'assigned';
            producerId = suggestedProducerId;
            producerName = producers.find(p => p.id === suggestedProducerId)?.name;
        } else if (suggestProducer && suggestedProducerId) {
            // Vai para distribuição MAS com sugestão
            distributionStatus = 'suggested';
        }

        try {
            await addProject({
                name,
                leadId: selectedLeadId || 'manual',
                leadName,
                status,
                dueDate: new Date(dueDate),
                driveLink,
                notes,
                checklist: [],
                // Novos campos de distribuição
                productType,
                durationCategory: getDurationCategory(),
                basePoints,
                extraPoints,
                totalPoints,
                distributionStatus,
                producerId: producerId || '',
                producerName: producerName || '',
                suggestedProducerId: (sendToDistribution && suggestProducer) ? suggestedProducerId : undefined,
                suggestedProducerName: (sendToDistribution && suggestProducer)
                    ? producers.find(p => p.id === suggestedProducerId)?.name
                    : undefined,
                suggestionNotes: (sendToDistribution && suggestProducer) ? suggestionNotes : undefined,
                source: 'manual',
            });
            onClose();
            resetForm();
            toast.success(
                sendToDistribution
                    ? 'Projeto enviado para lista de distribuição!'
                    : 'Projeto criado e atribuído!'
            );
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setName('');
        setLeadName('');
        setSelectedLeadId('');
        setStatus('aguardando');
        setDueDate('');
        setDriveLink('');
        setNotes('');
        setProductType('video-30s');
        setExtraPoints(0);
        setSendToDistribution(true);
        setSuggestProducer(false);
        setSuggestedProducerId('');
        setSuggestionNotes('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Novo Projeto"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome do Projeto"
                    placeholder="Ex: Vídeo Institucional"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    fullWidth
                />

                <Dropdown
                    label="Cliente (Lead)"
                    options={leadOptions}
                    value={selectedLeadId}
                    onChange={(val) => {
                        setSelectedLeadId(String(val));
                        // Se selecionou um lead real, preenche o nome automaticamente
                        const lead = availableLeads.find(l => l.id === val);
                        if (lead) {
                            setLeadName(lead.name);
                        }
                    }}
                    placeholder="Selecione um lead ou crie manualmente"
                />

                {!selectedLeadId && (
                    <Input
                        label="Nome do Cliente (Manual)"
                        placeholder="Ex: Empresa X"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        required
                        fullWidth
                    />
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Dropdown
                        label="Tipo de Produto"
                        options={PRODUCT_TYPE_OPTIONS}
                        value={productType}
                        onChange={(val) => setProductType(String(val))}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-secondary">
                            Prazo de Entrega <span className="text-danger-500">*</span>
                        </label>
                        <input
                            type="date"
                            className="bg-surface-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Pontos */}
                <div className="flex items-center gap-4 p-3 bg-surface-secondary rounded-lg border border-border">
                    <div className="flex-1">
                        <span className="text-sm text-text-muted">Pontos Base:</span>
                        <span className="ml-2 font-semibold text-text-primary">{basePoints}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-text-muted">Extras:</span>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            className="w-16 bg-surface-primary border border-border rounded-md px-2 py-1 text-sm text-text-primary text-center"
                            value={extraPoints}
                            onChange={(e) => setExtraPoints(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-text-muted">Total:</span>
                        <span className="ml-2 font-bold text-primary-500 text-lg">{totalPoints} pts</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Dropdown
                        label="Status Inicial"
                        options={PROJECT_STATUS_OPTIONS}
                        value={status}
                        onChange={(val) => setStatus(val as ProjectStatus)}
                    />

                    <Input
                        label="Link do Drive"
                        placeholder="https://drive.google.com/..."
                        value={driveLink}
                        onChange={(e) => setDriveLink(e.target.value)}
                        fullWidth
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                        Observações
                    </label>
                    <textarea
                        className="w-full bg-surface-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none h-20"
                        placeholder="Detalhes adicionais do projeto..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Seção de Distribuição */}
                <div className="border-t border-border pt-4 mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm font-medium text-text-primary">Enviar para Lista de Distribuição</span>
                            <p className="text-xs text-text-muted">Líder decidirá quem produz</p>
                        </div>
                        <Switch
                            checked={sendToDistribution}
                            onChange={setSendToDistribution}
                        />
                    </div>

                    {sendToDistribution ? (
                        // Opção de sugerir produtor
                        <div className="space-y-3 p-3 bg-surface-secondary rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Star size={14} className="text-primary-500" />
                                    <span className="text-sm text-text-primary">Sugerir Produtor</span>
                                </div>
                                <Switch
                                    checked={suggestProducer}
                                    onChange={setSuggestProducer}
                                />
                            </div>

                            {suggestProducer && (
                                <div className="space-y-2">
                                    <Dropdown
                                        options={producerOptions}
                                        value={suggestedProducerId}
                                        onChange={(val) => setSuggestedProducerId(String(val))}
                                        placeholder="Selecionar produtor..."
                                    />
                                    <input
                                        type="text"
                                        className="w-full bg-surface-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                        placeholder="Motivo da sugestão (opcional)"
                                        value={suggestionNotes}
                                        onChange={(e) => setSuggestionNotes(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        // Atribuição direta
                        <div className="p-3 bg-surface-secondary rounded-lg">
                            <Dropdown
                                label="Atribuir diretamente a"
                                options={producerOptions}
                                value={suggestedProducerId}
                                onChange={(val) => setSuggestedProducerId(String(val))}
                                placeholder="Selecionar produtor..."
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" isLoading={isLoading}>
                        {sendToDistribution ? 'Enviar para Distribuição' : 'Criar e Atribuir'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
