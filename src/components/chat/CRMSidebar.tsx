import React, { useState, useEffect } from 'react';
import {
    User, Phone, Mail, Building2, Tag, ChevronRight, ExternalLink,
    TrendingUp, ChevronDown, Check, Plus, Trophy, XCircle, Clock,
    Instagram, Edit3, Save, X, FileText, History
} from 'lucide-react';
import { toast } from 'sonner';

interface Deal {
    id: string;
    value: number;
    product?: string;
    origin?: string;
    status: 'open' | 'won' | 'lost';
    stage?: string;
    pipeline: string;
    owner?: { id: string; name: string };
    createdAt: string;
}

interface Lead {
    id: string;
    name: string;
    phone: string;
    email?: string;
    company?: string;
    estimatedValue: number;
    tags?: string[];
    statusHT?: string;
    statusLT?: string;
    pipeline?: string;
    notes?: string;
}

interface CRMSidebarProps {
    lead: Lead;
    pipeline: string;
    conversationId: string;
    onOpenDetails: () => void;
    onMoveStage?: (newStage: string) => void;
    onUpdateLead?: (updates: Partial<Lead>) => Promise<void>;
    onDealStatusChange?: (dealId: string, status: 'won' | 'lost') => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Stage configurations by pipeline
const STAGES = {
    high_ticket: [
        { value: 'novo', label: 'Novo' },
        { value: 'qualificado', label: 'Qualificado' },
        { value: 'call_agendada', label: 'Call Agendada' },
        { value: 'proposta', label: 'Proposta' },
        { value: 'negociacao', label: 'Negociação' },
        { value: 'fechado', label: 'Fechado' },
        { value: 'perdido', label: 'Perdido' },
    ],
    low_ticket: [
        { value: 'novo', label: 'Novo' },
        { value: 'atribuido', label: 'Atribuído' },
        { value: 'em_negociacao', label: 'Em Negociação' },
        { value: 'fechado', label: 'Fechado' },
        { value: 'perdido', label: 'Perdido' },
    ]
};

const CRMSidebar: React.FC<CRMSidebarProps> = ({
    lead,
    pipeline,
    conversationId,
    onOpenDetails,
    onMoveStage,
    onUpdateLead,
    onDealStatusChange
}) => {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [isLoadingDeals, setIsLoadingDeals] = useState(true);
    const [showStageDropdown, setShowStageDropdown] = useState(false);
    const [isChangingStage, setIsChangingStage] = useState(false);

    // Collapsible sections
    const [expandedSections, setExpandedSections] = useState({
        contact: true,
        deal: false,
        tags: false,
        notes: false,
        history: false
    });

    // Inline editing
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [editedContact, setEditedContact] = useState({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone,
        company: lead.company || ''
    });

    // Deal inline editing
    const [isEditingDeal, setIsEditingDeal] = useState(false);
    const [editedDeal, setEditedDeal] = useState({
        value: 0,
        origin: '',
        product: ''
    });

    // Tags inline editing
    const [editedTags, setEditedTags] = useState<string[]>(lead.tags || []);
    const [newTagInput, setNewTagInput] = useState('');

    const stages = STAGES[pipeline as keyof typeof STAGES] || STAGES.high_ticket;

    // Get current status based on pipeline, fallback to first stage if not set
    const rawStatus = pipeline === 'high_ticket' ? lead.statusHT : lead.statusLT;
    const currentStatus = rawStatus || stages[0]?.value || 'novo';

    // Ensure currentStatus exists in stages array
    const currentStageLabel = stages.find(s => s.value === currentStatus)?.label
        || stages.find(s => s.value === rawStatus)?.label
        || stages[0]?.label
        || 'Novo';

    // Fetch deals for this lead
    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/leads/${lead.id}/deals`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setDeals(data);
                    // Select first open deal
                    const openDeal = data.find((d: Deal) => d.status === 'open');
                    if (openDeal) setSelectedDeal(openDeal);
                }
            } catch (error) {
                console.error('Error fetching deals:', error);
            } finally {
                setIsLoadingDeals(false);
            }
        };
        fetchDeals();
    }, [lead.id]);

    const handleStageChange = async (newStage: string) => {
        if (newStage === currentStatus || !onMoveStage) return;
        setIsChangingStage(true);
        try {
            await onMoveStage(newStage);
            setShowStageDropdown(false);
        } finally {
            setIsChangingStage(false);
        }
    };

    const handleDealStatus = async (status: 'won' | 'lost') => {
        if (!selectedDeal) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/deals/${selectedDeal.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            setSelectedDeal({ ...selectedDeal, status });
            setDeals(prev => prev.map(d => d.id === selectedDeal.id ? { ...d, status } : d));
            toast.success(status === 'won' ? 'Negócio ganho!' : 'Negócio perdido');
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleAddDeal = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/deals`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    leadId: lead.id,
                    pipeline,
                    stage: 'novo',
                    value: 0
                })
            });
            if (response.ok) {
                const newDeal = await response.json();
                setDeals(prev => [newDeal, ...prev]);
                setSelectedDeal(newDeal);
                toast.success('Negócio criado');
            }
        } catch (error) {
            toast.error('Erro ao criar negócio');
        }
    };

    const handleSaveContact = async () => {
        if (!onUpdateLead) return;
        try {
            await onUpdateLead(editedContact);
            setIsEditingContact(false);
            toast.success('Contato atualizado');
        } catch (error) {
            toast.error('Erro ao atualizar contato');
        }
    };

    // Handle save deal inline
    const handleSaveDeal = async () => {
        if (!selectedDeal) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/deals/${selectedDeal.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    value: editedDeal.value,
                    origin: editedDeal.origin,
                    product: editedDeal.product
                })
            });

            if (response.ok) {
                const updatedDeal = { ...selectedDeal, ...editedDeal };
                setSelectedDeal(updatedDeal);
                setDeals(prev => prev.map(d => d.id === selectedDeal.id ? updatedDeal : d));
                setIsEditingDeal(false);
                toast.success('Negócio atualizado');
            }
        } catch (error) {
            toast.error('Erro ao atualizar negócio');
        }
    };

    // Populate editedDeal when selectedDeal changes
    useEffect(() => {
        if (selectedDeal) {
            setEditedDeal({
                value: selectedDeal.value || 0,
                origin: selectedDeal.origin || '',
                product: selectedDeal.product || ''
            });
        }
    }, [selectedDeal]);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(value);
    };

    // Tag functions
    const handleAddTag = () => {
        const trimmedTag = newTagInput.trim().toLowerCase();
        if (trimmedTag && !editedTags.includes(trimmedTag)) {
            const newTags = [...editedTags, trimmedTag];
            setEditedTags(newTags);
            setNewTagInput('');
            // Auto-save tags
            handleSaveTags(newTags);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = editedTags.filter(tag => tag !== tagToRemove);
        setEditedTags(newTags);
        // Auto-save tags
        handleSaveTags(newTags);
    };

    const handleSaveTags = async (tags: string[]) => {
        if (!onUpdateLead) return;
        try {
            await onUpdateLead({ tags } as any);
            toast.success('Tags atualizadas');
        } catch (error) {
            toast.error('Erro ao atualizar tags');
        }
    };

    return (
        <div className="w-80 flex-shrink-0 bg-slate-50 border-l border-slate-200 flex flex-col overflow-hidden">
            {/* Header with title */}
            <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm">PRÓXIMO NEGÓCIO</h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                if (deals.length <= 1) return;
                                const currentIdx = deals.findIndex(d => d.id === selectedDeal?.id);
                                const prevIdx = (currentIdx - 1 + deals.length) % deals.length;
                                setSelectedDeal(deals[prevIdx]);
                            }}
                            disabled={deals.length <= 1}
                            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Negócio anterior"
                        >
                            <ChevronRight size={16} className="text-slate-400 rotate-180" />
                        </button>
                        <button
                            onClick={() => {
                                if (deals.length <= 1) return;
                                const currentIdx = deals.findIndex(d => d.id === selectedDeal?.id);
                                const nextIdx = (currentIdx + 1) % deals.length;
                                setSelectedDeal(deals[nextIdx]);
                            }}
                            disabled={deals.length <= 1}
                            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Próximo negócio"
                        >
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Lead Avatar & Name */}
                <div className="flex items-center gap-3 mt-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center">
                        <User size={20} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{lead.name}</p>
                        {lead.tags && lead.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                                {lead.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] rounded font-medium">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-3">
                    <button
                        onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Ligar"
                    >
                        <Phone size={16} className="text-slate-500" />
                    </button>
                    <button
                        onClick={() => lead.email && window.open(`mailto:${lead.email}`, '_blank')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Email"
                    >
                        <Mail size={16} className="text-slate-500" />
                    </button>
                    <button
                        onClick={() => toggleSection('notes')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Agendar"
                    >
                        <Clock size={16} className="text-slate-500" />
                    </button>
                    <button
                        onClick={() => toggleSection('notes')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Notas"
                    >
                        <FileText size={16} className="text-slate-500" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Deal Section */}
                <div className="p-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-slate-500">NEGÓCIO SELECIONADO</span>
                        <button
                            onClick={handleAddDeal}
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                            title="Adicionar negócio"
                        >
                            <Plus size={14} className="text-slate-400" />
                        </button>
                    </div>

                    {isLoadingDeals ? (
                        <div className="text-xs text-slate-400">Carregando...</div>
                    ) : selectedDeal ? (
                        <>
                            {/* Deal Info */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Trophy size={14} className="text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                        {pipeline === 'high_ticket' ? 'High Ticket' : 'Low Ticket'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatCurrency(Number(selectedDeal.value))}
                                    </p>
                                </div>
                            </div>

                            {/* Status Buttons */}
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => handleDealStatus('won')}
                                    disabled={selectedDeal.status !== 'open'}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDeal.status === 'won'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        } ${selectedDeal.status !== 'open' && selectedDeal.status !== 'won' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Ganho
                                </button>
                                <button
                                    onClick={() => handleDealStatus('lost')}
                                    disabled={selectedDeal.status !== 'open'}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDeal.status === 'lost'
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                        } ${selectedDeal.status !== 'open' && selectedDeal.status !== 'lost' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Perdido
                                </button>
                                <button
                                    disabled
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDeal.status === 'open'
                                        ? 'bg-slate-200 text-slate-700 ring-2 ring-slate-400'
                                        : 'bg-slate-100 text-slate-500'
                                        }`}
                                >
                                    Aberto
                                </button>
                            </div>

                            {/* Stage Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowStageDropdown(!showStageDropdown)}
                                    disabled={isChangingStage || !onMoveStage}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    <span className="text-sm text-slate-700">
                                        {isChangingStage ? 'Movendo...' : currentStageLabel}
                                    </span>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${showStageDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showStageDropdown && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {stages.map((stage) => (
                                            <button
                                                key={stage.value}
                                                onClick={() => handleStageChange(stage.value)}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${currentStatus === stage.value ? 'bg-violet-50' : ''
                                                    }`}
                                            >
                                                <span className="text-sm text-slate-700">{stage.label}</span>
                                                {currentStatus === stage.value && <Check size={14} className="text-violet-600" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={handleAddDeal}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-violet-300 hover:text-violet-600 transition-colors"
                        >
                            <Plus size={16} />
                            Adicionar negócio
                        </button>
                    )}
                </div>

                {/* Collapsible Sections */}
                {/* Contact Section */}
                <div className="border-b border-slate-200">
                    <button
                        onClick={() => toggleSection('contact')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-sm font-medium text-slate-700">Contato</span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedSections.contact ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSections.contact && (
                        <div className="px-4 pb-4 space-y-3">
                            {isEditingContact ? (
                                <>
                                    <input
                                        type="text"
                                        value={editedContact.name}
                                        onChange={(e) => setEditedContact(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Nome"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                    <input
                                        type="email"
                                        value={editedContact.email}
                                        onChange={(e) => setEditedContact(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="Email"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                    <input
                                        type="tel"
                                        value={editedContact.phone}
                                        onChange={(e) => setEditedContact(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="Telefone"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                    <input
                                        type="text"
                                        value={editedContact.company}
                                        onChange={(e) => setEditedContact(prev => ({ ...prev, company: e.target.value }))}
                                        placeholder="Empresa"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveContact}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                                        >
                                            <Save size={14} />
                                            Salvar
                                        </button>
                                        <button
                                            onClick={() => setIsEditingContact(false)}
                                            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500">Nome</p>
                                            <p className="text-sm text-slate-800">{lead.name}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsEditingContact(true)}
                                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <Edit3 size={12} className="text-slate-400" />
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Email</p>
                                        <p className="text-sm text-slate-800">{lead.email || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Telefone</p>
                                        <a
                                            href={`tel:${lead.phone}`}
                                            className="text-sm text-violet-600 hover:underline"
                                        >
                                            {lead.phone}
                                        </a>
                                    </div>
                                    {lead.company && (
                                        <div>
                                            <p className="text-xs text-slate-500">Empresa</p>
                                            <p className="text-sm text-slate-800">{lead.company}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Negócio Section */}
                <div className="border-b border-slate-200">
                    <button
                        onClick={() => toggleSection('deal')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-sm font-medium text-slate-700">Negócio</span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedSections.deal ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSections.deal && selectedDeal && (
                        <div className="px-4 pb-4 space-y-3">
                            {isEditingDeal ? (
                                <>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Valor do negócio (R$)</label>
                                        <input
                                            type="number"
                                            value={editedDeal.value}
                                            onChange={(e) => setEditedDeal(prev => ({ ...prev, value: Number(e.target.value) }))}
                                            placeholder="0"
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Origem</label>
                                        <select
                                            value={editedDeal.origin}
                                            onChange={(e) => setEditedDeal(prev => ({ ...prev, origin: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="landing_page">Landing Page</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="facebook">Facebook</option>
                                            <option value="indicacao">Indicação</option>
                                            <option value="organico">Orgânico</option>
                                            <option value="outro">Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Produto</label>
                                        <input
                                            type="text"
                                            value={editedDeal.product}
                                            onChange={(e) => setEditedDeal(prev => ({ ...prev, product: e.target.value }))}
                                            placeholder="Nome do produto/serviço"
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveDeal}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                                        >
                                            <Save size={14} />
                                            Salvar
                                        </button>
                                        <button
                                            onClick={() => setIsEditingDeal(false)}
                                            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500">Valor do negócio</p>
                                            <p className="text-sm font-semibold text-emerald-600">{formatCurrency(Number(selectedDeal.value))}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsEditingDeal(true)}
                                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <Edit3 size={12} className="text-slate-400" />
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Origem</p>
                                        <p className="text-sm text-slate-800">{selectedDeal.origin || 'Não definida'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Produto</p>
                                        <p className="text-sm text-slate-800">{selectedDeal.product || 'Não definido'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Etapa</p>
                                        <p className="text-sm text-slate-800">{stages.find(s => s.value === currentStatus)?.label || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Dono do negócio</p>
                                        <p className="text-sm text-slate-800">{selectedDeal.owner?.name || 'Não atribuído'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Status</p>
                                        <p className="text-sm text-slate-800 capitalize">{selectedDeal.status === 'open' ? 'Aberto' : selectedDeal.status === 'won' ? 'Ganho' : 'Perdido'}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Tags Section */}
                <div className="border-b border-slate-200">
                    <button
                        onClick={() => toggleSection('tags')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Tag size={14} className="text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">Tags</span>
                            {editedTags.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] rounded-full font-medium">
                                    {editedTags.length}
                                </span>
                            )}
                        </div>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedSections.tags ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSections.tags && (
                        <div className="px-4 pb-4 space-y-3">
                            {/* Existing Tags */}
                            <div className="flex flex-wrap gap-2">
                                {editedTags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="group inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-full font-medium"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:bg-violet-200 rounded-full p-0.5 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                {editedTags.length === 0 && (
                                    <p className="text-xs text-slate-400 italic">Nenhuma tag</p>
                                )}
                            </div>

                            {/* Add New Tag */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTagInput}
                                    onChange={(e) => setNewTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    placeholder="Nova tag..."
                                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <button
                                    onClick={handleAddTag}
                                    disabled={!newTagInput.trim()}
                                    className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                <div className="border-b border-slate-200">
                    <button
                        onClick={() => toggleSection('notes')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-sm font-medium text-slate-700">Notas</span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedSections.notes ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSections.notes && (
                        <div className="px-4 pb-4">
                            {lead.notes ? (
                                <p className="text-sm text-slate-600">{lead.notes}</p>
                            ) : (
                                <p className="text-sm text-slate-400 italic">Nenhuma nota adicionada</p>
                            )}
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div className="border-b border-slate-200">
                    <button
                        onClick={() => toggleSection('history')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-sm font-medium text-slate-700">Histórico</span>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandedSections.history ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedSections.history && (
                        <div className="px-4 pb-4">
                            <p className="text-xs text-slate-500 italic">Carregue o histórico completo nos detalhes</p>
                        </div>
                    )}
                </div>

                {/* Conversations count */}
                <div className="border-b border-slate-200">
                    <button
                        onClick={onOpenDetails}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-sm font-medium text-slate-700">Conversas</span>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">1</span>
                            <ChevronRight size={16} className="text-slate-400" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CRMSidebar;
