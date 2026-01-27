import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Phone, Mail, Building2, User, Calendar, MessageCircle,
    DollarSign, Tag, Clock, ChevronRight, Plus, Edit3, Save,
    Briefcase, MapPin, FileText, History, TrendingUp, Star, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { ActivitiesTab } from './lead360/ActivitiesTab';
import { formatPhoneDisplay, getFullPhoneNumber } from '../lib/phoneFormat';
import PhoneInput from './ui/PhoneInput';
import CustomFieldsTab from './lead360/CustomFieldsTab';
import ProductSelect from './ui/ProductSelect';
import {
    supabaseCreateDeal,
    supabaseGetLeadDeals,
    supabaseGetLeadConversations,
    supabaseGetLeadHistory,
    supabaseDeleteDeal,
    Deal as SupabaseDeal
} from '../services/supabaseApi';

interface Deal {
    id: string;
    value: number;
    product?: string;
    origin?: string;
    status: 'open' | 'won' | 'lost';
    pipeline: string;
    createdAt: string;
}

interface LeadHistoryItem {
    id: string;
    action: string;
    description?: string;
    createdAt: string;
    createdBy?: { name: string };
}

interface Conversation {
    id: string;
    status: string;
    channel: string;
    lastMessageAt?: string;
    assignedAgent?: { name: string };
    messages?: { text?: string; createdAt: string }[];
}

interface Lead {
    id: string;
    name: string;
    phone: string;
    email?: string;
    company?: string;
    estimatedValue: number;
    tags?: string[];
    notes?: string;
    source?: string;
    pipeline?: string;
    statusHT?: string;
    statusLT?: string;
    createdAt?: string;
    updatedAt?: string;
    lossReasonId?: string;
}

interface LossReason {
    id: string;
    name: string;
}

interface Lead360ModalProps {
    isOpen: boolean;
    lead: Lead | null;
    onClose: () => void;
    onOpenChat?: (lead: Lead) => void;
    onUpdateLead?: (updates: Partial<Lead>) => Promise<void>;
    initialTab?: TabType;
}

export type TabType = 'atividades' | 'contato' | 'empresa' | 'negocios' | 'conversas' | 'historico';

const Lead360Modal: React.FC<Lead360ModalProps> = ({
    isOpen,
    lead,
    onClose,
    onOpenChat,
    onUpdateLead,
    initialTab = 'atividades'
}) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [history, setHistory] = useState<LeadHistoryItem[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Editable fields
    const [isEditing, setIsEditing] = useState(false);
    const [editedLead, setEditedLead] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        notes: ''
    });

    // Deal form states
    const [isAddingDeal, setIsAddingDeal] = useState(false);
    const [newDeal, setNewDeal] = useState({
        value: '',
        product: '',
        origin: '',
        productId: ''
    });

    // Company editing states
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const [editedCompany, setEditedCompany] = useState({
        company: '',
        cnpj: '',
        segment: '',
        employees: ''
    });

    // Handle adding new deal
    const handleAddDeal = async () => {
        if (!lead) return;
        try {
            const createdDeal = await supabaseCreateDeal({
                leadId: lead.id,
                pipeline: lead.pipeline || 'high_ticket',
                value: parseFloat(newDeal.value) || 0
            });
            const localDeal: Deal = {
                id: createdDeal.id,
                value: createdDeal.value,
                product: newDeal.product || undefined,
                origin: newDeal.origin || undefined,
                status: 'open',
                pipeline: lead.pipeline || 'high_ticket',
                createdAt: createdDeal.createdAt
            };
            setDeals(prev => [...prev, localDeal]);
            setNewDeal({ value: '', product: '', origin: '', productId: '' });
            setIsAddingDeal(false);
            toast.success('Negócio criado com sucesso!');
        } catch (error) {
            toast.error('Erro ao criar negócio');
        }
    };

    // Handle saving company data
    const handleSaveCompany = async () => {
        if (!lead || !onUpdateLead) return;
        try {
            await onUpdateLead({
                company: editedCompany.company,
                // These fields would need to be added to the Lead model
                // For now, we update what we can
            } as any);
            setIsEditingCompany(false);
            toast.success('Dados da empresa atualizados!');
        } catch (error) {
            toast.error('Erro ao atualizar empresa');
        }
    };

    useEffect(() => {
        if (lead) {
            setEditedLead({
                name: lead.name || '',
                email: lead.email || '',
                phone: lead.phone || '',
                company: lead.company || '',
                notes: lead.notes || ''
            });
            setEditedCompany({
                company: lead.company || '',
                cnpj: (lead as any).cnpj || '',
                segment: (lead as any).segment || '',
                employees: (lead as any).employees || ''
            });
        }
    }, [lead]);

    // Reset tab and editing states when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setIsEditing(false);
            setIsEditingCompany(false);
            setIsAddingDeal(false);
        }
    }, [isOpen, initialTab]);

    // Fetch all data at once using unified endpoint
    useEffect(() => {
        if (!lead || !isOpen) return;

        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                // Fetch deals, conversations, and history in parallel
                const [dealsData, conversationsData, historyData] = await Promise.all([
                    supabaseGetLeadDeals(lead.id),
                    supabaseGetLeadConversations(lead.id),
                    supabaseGetLeadHistory(lead.id)
                ]);

                setDeals(dealsData.map((d: any) => ({
                    id: d.id,
                    value: d.value,
                    product: d.product,
                    origin: d.origin,
                    status: d.status,
                    pipeline: d.pipeline,
                    createdAt: d.createdAt
                })));
                setConversations(conversationsData);
                setHistory(historyData.map((h: any) => ({
                    id: h.id,
                    action: h.action,
                    description: h.details,
                    createdAt: h.createdAt,
                    createdBy: h.user
                })));
            } catch (error) {
                console.error('Error fetching lead details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [lead?.id, isOpen]);

    if (!isOpen || !lead) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const handleSave = async () => {
        if (!onUpdateLead) return;
        try {
            await onUpdateLead(editedLead);
            setIsEditing(false);
            toast.success('Lead atualizado');
        } catch (error) {
            toast.error('Erro ao atualizar');
        }
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'atividades', label: 'Atividades', icon: <Clock size={16} /> },
        { id: 'contato', label: 'Contato', icon: <User size={16} /> },
        { id: 'empresa', label: 'Empresa', icon: <Building2 size={16} /> },
        { id: 'negocios', label: 'Negócios', icon: <DollarSign size={16} /> },
        { id: 'conversas', label: 'Conversas', icon: <MessageCircle size={16} /> },
        { id: 'historico', label: 'Histórico', icon: <History size={16} /> },
    ];

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'stage_changed': return <TrendingUp size={14} className="text-violet-600" />;
            case 'deal_created': return <DollarSign size={14} className="text-emerald-600" />;
            case 'deal_won': return <Star size={14} className="text-amber-500" />;
            case 'deal_lost': return <X size={14} className="text-rose-500" />;
            case 'note_added': return <FileText size={14} className="text-blue-500" />;
            default: return <Clock size={14} className="text-slate-400" />;
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'stage_changed': return 'Etapa alterada';
            case 'deal_created': return 'Negócio criado';
            case 'deal_won': return 'Negócio ganho';
            case 'deal_lost': return 'Negócio perdido';
            case 'note_added': return 'Nota adicionada';
            case 'lead_created': return 'Lead criado';
            default: return action;
        }
    };

    // Format history description from JSON to human-readable
    const formatHistoryDescription = (action: string, details: any): string => {
        if (!details) return '';

        try {
            const data = typeof details === 'string' ? JSON.parse(details) : details;

            switch (action) {
                case 'stage_changed':
                    return `${data.from || 'Início'} → ${data.to || 'Nova etapa'}`;
                case 'deal_created':
                    return data.value ? `Valor: R$ ${data.value.toLocaleString('pt-BR')}` : 'Novo negócio adicionado';
                case 'deal_won':
                    return data.value ? `Valor ganho: R$ ${data.value.toLocaleString('pt-BR')}` : 'Negócio fechado com sucesso';
                case 'deal_lost':
                    return data.reason || 'Negócio não convertido';
                case 'note_added':
                    return data.content || data.note || 'Nota adicionada';
                case 'lead_created':
                    return data.source ? `Origem: ${data.source}` : 'Novo lead cadastrado';
                default:
                    // For unknown actions, try to extract meaningful info
                    if (data.description) return data.description;
                    if (data.content) return data.content;
                    if (data.note) return data.note;
                    return '';
            }
        } catch {
            return '';
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                            <User size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{lead.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-slate-500">{lead.company || 'Sem empresa'}</span>
                                {lead.tags && lead.tags.length > 0 && (
                                    <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                                        {lead.tags[0]}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (onOpenChat) {
                                    onOpenChat(lead);
                                }
                                // Always close modal and navigate to inbox
                                onClose();
                                navigate(`/inbox?leadId=${lead.id}`);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                        >
                            <MessageCircle size={16} />
                            Conversar
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="border-b border-slate-100 px-6">
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id
                                    ? 'border-violet-600 text-violet-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Atividades Tab */}
                            {activeTab === 'atividades' && (
                                <div className="space-y-6">
                                    {/* Summary cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-emerald-50 rounded-xl">
                                            <p className="text-xs text-emerald-600 font-medium">Valor Estimado</p>
                                            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(lead.estimatedValue || 0)}</p>
                                        </div>
                                        <div className="p-4 bg-violet-50 rounded-xl">
                                            <p className="text-xs text-violet-600 font-medium">Negócios Ativos</p>
                                            <p className="text-2xl font-bold text-violet-700">{deals.filter(d => d.status === 'open').length}</p>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-xl">
                                            <p className="text-xs text-blue-600 font-medium">Conversas</p>
                                            <p className="text-2xl font-bold text-blue-700">{conversations.length}</p>
                                        </div>
                                    </div>

                                    {/* Activities Component */}
                                    <ActivitiesTab leadId={lead.id} />
                                </div>
                            )}

                            {/* Contato Tab */}
                            {activeTab === 'contato' && (
                                <CustomFieldsTab
                                    leadId={lead.id}
                                    entity="contact"
                                    title="Informações de Contato"
                                    onSave={() => {
                                        toast.success('Lead atualizado');
                                    }}
                                    baseFields={[
                                        {
                                            key: 'name',
                                            label: 'Nome',
                                            value: lead.name,
                                            type: 'text',
                                            onChange: (val) => onUpdateLead?.({ name: val })
                                        },
                                        {
                                            key: 'phone',
                                            label: 'Telefone',
                                            value: lead.phone,
                                            type: 'phone',
                                            onChange: (val) => onUpdateLead?.({ phone: val })
                                        },
                                        {
                                            key: 'email',
                                            label: 'Email',
                                            value: lead.email || '',
                                            type: 'email',
                                            onChange: (val) => onUpdateLead?.({ email: val })
                                        },
                                        {
                                            key: 'company',
                                            label: 'Empresa',
                                            value: lead.company || '',
                                            type: 'text',
                                            onChange: (val) => onUpdateLead?.({ company: val })
                                        },
                                        {
                                            key: 'notes',
                                            label: 'Notas',
                                            value: lead.notes || '',
                                            type: 'text',
                                            onChange: (val) => onUpdateLead?.({ notes: val })
                                        }
                                    ]}
                                />
                            )}

                            {/* Empresa Tab */}
                            {activeTab === 'empresa' && (
                                <CustomFieldsTab
                                    leadId={lead.id}
                                    entity="company"
                                    title="Dados da Empresa"
                                    onSave={() => {
                                        toast.success('Empresa atualizada');
                                    }}
                                    baseFields={[
                                        {
                                            key: 'company',
                                            label: 'Nome da Empresa',
                                            value: lead.company || '',
                                            type: 'text',
                                            onChange: (val) => onUpdateLead?.({ company: val })
                                        },
                                        {
                                            key: 'cnpj',
                                            label: 'CNPJ',
                                            value: (lead as any).cnpj || '',
                                            type: 'text',
                                            onChange: (val) => onUpdateLead?.({ cnpj: val } as any)
                                        },
                                        {
                                            key: 'segment',
                                            label: 'Segmento',
                                            value: (lead as any).segment || '',
                                            type: 'text',
                                            onChange: (val) => onUpdateLead?.({ segment: val } as any)
                                        },
                                        {
                                            key: 'employees',
                                            label: 'Funcionários',
                                            value: (lead as any).employees || '',
                                            type: 'text',
                                            onChange: (val) => onUpdateLead?.({ employees: val } as any)
                                        }
                                    ]}
                                />
                            )}

                            {/* Negócios Tab */}
                            {activeTab === 'negocios' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-slate-800">Negócios ({deals.length})</h3>
                                        <button
                                            onClick={() => setIsAddingDeal(!isAddingDeal)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors"
                                        >
                                            <Plus size={14} /> {isAddingDeal ? 'Cancelar' : 'Novo Negócio'}
                                        </button>
                                    </div>

                                    {/* Add Deal Form */}
                                    {isAddingDeal && (
                                        <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-3">
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Valor (R$)</label>
                                                    <input
                                                        type="number"
                                                        value={newDeal.value}
                                                        onChange={(e) => setNewDeal(prev => ({ ...prev, value: e.target.value }))}
                                                        placeholder="0,00"
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Produto</label>
                                                    <ProductSelect
                                                        value={newDeal.productId}
                                                        onChange={(productId, price) => {
                                                            setNewDeal(prev => ({
                                                                ...prev,
                                                                productId,
                                                                value: price ? price.toString() : prev.value
                                                            }));
                                                        }}
                                                        className="!space-y-0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Origem</label>
                                                    <input
                                                        type="text"
                                                        value={newDeal.origin}
                                                        onChange={(e) => setNewDeal(prev => ({ ...prev, origin: e.target.value }))}
                                                        placeholder="Ex: Inbound, Indicação"
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleAddDeal}
                                                className="w-full py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                                            >
                                                Criar Negócio
                                            </button>
                                        </div>
                                    )}

                                    {deals.map((deal) => (
                                        <div key={deal.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${deal.status === 'won' ? 'bg-emerald-100 text-emerald-700' :
                                                    deal.status === 'lost' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {deal.status === 'won' ? 'Ganho' : deal.status === 'lost' ? 'Perdido' : 'Aberto'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(deal.value)}</span>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Deseja excluir este negócio?')) return;
                                                            try {
                                                                await supabaseDeleteDeal(deal.id);
                                                                setDeals(prev => prev.filter(d => d.id !== deal.id));
                                                                toast.success('Negócio excluído');
                                                            } catch {
                                                                toast.error('Erro ao excluir');
                                                            }
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Excluir negócio"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                <p>Produto: {deal.product || 'Não definido'}</p>
                                                <p>Origem: {deal.origin || 'Não definida'}</p>
                                                <p>Criado: {formatDate(deal.createdAt)}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {deals.length === 0 && (
                                        <p className="text-sm text-slate-400 italic text-center py-8">Nenhum negócio encontrado</p>
                                    )}
                                </div>
                            )}

                            {/* Conversas Tab */}
                            {activeTab === 'conversas' && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-slate-800">Conversas ({conversations.length})</h3>

                                    {conversations.map((conv) => (
                                        <div key={conv.id} className="p-4 bg-slate-50 rounded-xl flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${conv.status === 'active' ? 'bg-emerald-100' :
                                                conv.status === 'closed' ? 'bg-slate-200' :
                                                    'bg-amber-100'
                                                }`}>
                                                <MessageCircle size={18} className={
                                                    conv.status === 'active' ? 'text-emerald-600' :
                                                        conv.status === 'closed' ? 'text-slate-500' :
                                                            'text-amber-600'
                                                } />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-slate-800">{conv.channel}</span>
                                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${conv.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                        conv.status === 'closed' ? 'bg-slate-200 text-slate-600' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {conv.status === 'active' ? 'Ativa' : conv.status === 'closed' ? 'Encerrada' : conv.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    {conv.assignedAgent?.name || 'Não atribuída'} • {conv.lastMessageAt ? formatDateTime(conv.lastMessageAt) : '-'}
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-400" />
                                        </div>
                                    ))}

                                    {conversations.length === 0 && (
                                        <p className="text-sm text-slate-400 italic text-center py-8">Nenhuma conversa encontrada</p>
                                    )}
                                </div>
                            )}

                            {/* Histórico Tab */}
                            {activeTab === 'historico' && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-slate-800">Histórico de Atividades</h3>

                                    <div className="relative">
                                        <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

                                        {history.map((item) => {
                                            const formattedDesc = formatHistoryDescription(item.action, item.description);
                                            return (
                                                <div key={item.id} className="relative flex gap-4 pb-4">
                                                    <div className="relative z-10 w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                                                        {getActionIcon(item.action)}
                                                    </div>
                                                    <div className="flex-1 pt-1">
                                                        <p className="text-sm font-medium text-slate-800">{getActionLabel(item.action)}</p>
                                                        {formattedDesc && (
                                                            <p className="text-sm text-slate-500">{formattedDesc}</p>
                                                        )}
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {formatDateTime(item.createdAt)}
                                                            {item.createdBy && ` • ${item.createdBy.name}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {history.length === 0 && (
                                            <p className="text-sm text-slate-400 italic text-center py-8">Nenhum histórico encontrado</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Lead360Modal;
