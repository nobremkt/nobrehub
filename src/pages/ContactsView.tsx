import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Mail, Download, Phone, Plus, Edit2, Calendar, Check, MessageCircle, Globe, Target, Headphones, User, Filter, X, ChevronDown, XCircle, Tag, Briefcase } from 'lucide-react';
import LeadModal from '../components/LeadModal';
import Lead360Modal from '../components/Lead360Modal';
import LossReasonModal from '../components/LossReasonModal';
import { TagsDisplay } from '../components/TagsEditor';
import { supabaseGetLeads, Lead, supabaseDeleteLead, supabaseCreateLead, supabaseUpdateLead, supabaseMarkLeadAsLost, supabaseGetAllTags } from '../services/supabaseApi';
import { toast } from 'sonner';
import { useFirebase } from '../contexts/FirebaseContext';

interface ContactsViewProps {
    onNavigateToChat?: (leadId?: string) => void;
}

const ContactsView: React.FC<ContactsViewProps> = ({ onNavigateToChat }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Reformatted for Detail View - using ID for real-time updates
    const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [lossModalLead, setLossModalLead] = useState<Lead | null>(null);
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    // Advanced filters from v9 plan
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        pipeline: '' as '' | 'high_ticket' | 'low_ticket',
        status: '',
        source: '',
        tags: [] as string[],
        lossReason: '',
        hasDeals: '' as '' | 'yes' | 'no', // "Negócio com status" / "Com/sem negócio"
        dateRange: '' as '' | '7d' | '30d' | '90d',
    });

    const { subscribeToNewLeads, subscribeToLeadUpdates } = useFirebase();

    // Derived detail lead to ensure real-time updates
    const detailLead = useMemo(() =>
        leads.find(l => l.id === detailLeadId) || null,
        [leads, detailLeadId]);

    const openDetailModal = (lead: Lead) => {
        setDetailLeadId(lead.id);
        setIsDetailModalOpen(true);
    };

    useEffect(() => {
        fetchLeads();
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const tags = await supabaseGetAllTags();
            setAvailableTags(tags);
        } catch (error) {
            console.error('Failed to load tags', error);
        }
    };

    // Real-time Listeners
    useEffect(() => {
        const unsubscribeNew = subscribeToNewLeads((newLead: Lead) => {
            toast.success(`Novo Lead: ${newLead.name}`);
            setLeads(prev => [newLead, ...prev]);
        });

        const unsubscribeUpdate = subscribeToLeadUpdates((updatedLead: Lead) => {
            setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
        });

        return () => {
            unsubscribeNew();
            unsubscribeUpdate();
        };
    }, [subscribeToNewLeads, subscribeToLeadUpdates]);

    const fetchLeads = async () => {
        try {
            const data = await supabaseGetLeads();
            setLeads(data);
        } catch (error) {
            console.error('Erro ao buscar leads:', error);
            toast.error('Erro ao carregar contatos');
        } finally {
            setIsLoading(false);
        }
    };

    // Filter Logic matching v9 requirements
    const filteredLeads = useMemo(() => {
        const now = new Date();
        return leads
            .filter(l =>
                l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.phone.includes(searchTerm)
            )
            .filter(l => !filters.pipeline || l.pipeline === filters.pipeline)
            .filter(l => {
                if (!filters.status) return true;
                return l.statusHT === filters.status || l.statusLT === filters.status;
            })
            .filter(l => !filters.source || l.source === filters.source)
            // Tag filter
            .filter(l => {
                if (filters.tags.length === 0) return true;
                return filters.tags.some(tag => l.tags?.includes(tag));
            })
            // Loss Reason filter
            .filter(l => {
                if (!filters.lossReason) return true;
                return l.lossReason?.name === filters.lossReason;
            })
            // Has Deals filter (Simplified logic placeholder)
            .filter(l => {
                if (!filters.hasDeals) return true;
                return true;
            })
            // Date range
            .filter(l => {
                if (!filters.dateRange) return true;
                const createdAt = new Date(l.createdAt);
                const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                if (filters.dateRange === '7d') return diffDays <= 7;
                if (filters.dateRange === '30d') return diffDays <= 30;
                if (filters.dateRange === '90d') return diffDays <= 90;
                return true;
            });
    }, [leads, searchTerm, filters]);

    // Derived unique values for dropdowns
    const uniqueSources = useMemo(() => [...new Set(leads.filter(l => l.source).map(l => l.source as string))], [leads]);
    const uniqueStatuses = useMemo(() => {
        const statuses = new Set<string>();
        leads.forEach(l => {
            if (l.statusHT) statuses.add(l.statusHT);
            if (l.statusLT) statuses.add(l.statusLT);
        });
        return [...statuses];
    }, [leads]);
    const uniqueLossReasons = useMemo(() => {
        return [...new Set(leads.filter(l => l.lossReason).map(l => l.lossReason!.name))];
    }, [leads]);

    const activeFilterCount = Object.values(filters).filter(v => v !== '' && !(Array.isArray(v) && v.length === 0)).length;

    const clearFilters = () => {
        setFilters({ pipeline: '', status: '', source: '', tags: [], lossReason: '', hasDeals: '', dateRange: '' });
    };

    const formatPhone = (phone: string | undefined) => {
        if (!phone) return '-';
        return phone.length > 11 ? phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4') : phone;
    };

    const getPipelineColor = (pipeline?: string) => {
        if (pipeline === 'high_ticket') return 'bg-purple-100 text-purple-700 border-purple-200';
        if (pipeline === 'low_ticket') return 'bg-blue-100 text-blue-700 border-blue-200';
        return 'bg-slate-100 text-slate-500 border-slate-200';
    };

    // Actions
    const handleSaveLead = async (leadData: any) => {
        try {
            if (leadData.id) {
                const updatedLead = await supabaseUpdateLead(leadData.id, {
                    name: leadData.name,
                    email: leadData.email || undefined,
                    phone: leadData.phone,
                    company: leadData.company || undefined,
                    source: leadData.source || undefined,
                    estimatedValue: parseFloat(leadData.value) || 0,
                    pipeline: leadData.pipeline,
                    statusHT: leadData.pipeline === 'high_ticket' ? leadData.status : undefined,
                    statusLT: leadData.pipeline === 'low_ticket' ? leadData.status : undefined
                });
                setLeads((prev) => prev.map(l => l.id === leadData.id ? updatedLead : l));
                setEditingLead(null);
                toast.success('Contato atualizado!');
            } else {
                const newLeadRaw = await supabaseCreateLead({
                    name: leadData.name,
                    email: leadData.email || undefined,
                    phone: leadData.phone,
                    company: leadData.company || undefined,
                    source: leadData.source || undefined,
                    estimatedValue: parseFloat(leadData.value) || 0,
                    pipeline: leadData.pipeline,
                    statusHT: leadData.pipeline === 'high_ticket' ? leadData.status : undefined,
                    statusLT: leadData.pipeline === 'low_ticket' ? leadData.status : undefined
                });
                setLeads((prev) => [...prev, newLeadRaw]);
                toast.success('Contato criado!');
            }
            setIsLeadModalOpen(false);
        } catch (error) {
            toast.error('Erro ao salvar contato.');
        }
    };

    const toggleSelectAll = () => {
        if (selectedLeads.length === filteredLeads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(filteredLeads.map(l => l.id));
        }
    };

    const toggleSelectOne = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedLeads(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Excluir ${selectedLeads.length} contatos?`)) {
            try {
                await Promise.all(selectedLeads.map(id => supabaseDeleteLead(id)));
                setLeads(leads.filter(l => !selectedLeads.includes(l.id)));
                setSelectedLeads([]);
                toast.success('Contatos excluídos!');
            } catch (error) {
                toast.error('Erro ao excluir contatos.');
            }
        }
    };

    return (
        <div className="h-dvh flex flex-col bg-[#f8fafc] animate-in fade-in duration-500">
            {/* Header */}
            <header className="px-8 py-8 flex flex-col gap-6 bg-white border-b border-slate-200 shadow-sm relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                            <User size={24} className="text-violet-600" />
                            Contatos
                        </h1>
                        <p className="text-slate-400 text-xs font-medium mt-1">
                            Gerencie sua base de clientes e leads
                        </p>
                    </div>

                    <button
                        onClick={() => setIsLeadModalOpen(true)}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-600/20 font-bold text-xs uppercase tracking-wider active:scale-95"
                    >
                        <Plus size={16} /> Novo Contato
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email, telefone ou empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all text-slate-900 placeholder:text-slate-400"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${activeFilterCount > 0
                            ? 'bg-violet-50 border-violet-200 text-violet-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Filter size={18} />
                        <span className="text-sm font-medium hidden md:inline">Filtros</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-violet-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-in slide-in-from-top-2 duration-200 pt-2 border-t border-slate-100">
                        <select
                            value={filters.pipeline}
                            onChange={(e) => setFilters(prev => ({ ...prev, pipeline: e.target.value as any }))}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-violet-500"
                        >
                            <option value="">Pipeline: Todos</option>
                            <option value="high_ticket">High Ticket</option>
                            <option value="low_ticket">Low Ticket</option>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-violet-500"
                        >
                            <option value="">Status: Todos</option>
                            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select
                            value={filters.source}
                            onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-violet-500"
                        >
                            <option value="">Origem: Todas</option>
                            {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select
                            value={filters.lossReason}
                            onChange={(e) => setFilters(prev => ({ ...prev, lossReason: e.target.value }))}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-violet-500"
                        >
                            <option value="">Perda: Todas</option>
                            {uniqueLossReasons.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:border-violet-500"
                        >
                            <option value="">Data: Todas</option>
                            <option value="7d">Últimos 7 dias</option>
                            <option value="30d">Últimos 30 dias</option>
                        </select>

                        {activeFilterCount > 0 && (
                            <button onClick={clearFilters} className="text-xs font-bold text-rose-500 hover:text-rose-600 text-left px-2">
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
            </header>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-14">
                                    <div className="flex items-center justify-center">
                                        <button
                                            onClick={toggleSelectAll}
                                            className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${selectedLeads.length === filteredLeads.length && filteredLeads.length > 0
                                                ? 'bg-violet-600 border-violet-600'
                                                : 'bg-white border-slate-300'
                                                }`}
                                        >
                                            {selectedLeads.length === filteredLeads.length && filteredLeads.length > 0 && <Check size={12} className="text-white" />}
                                        </button>
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome / Empresa</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tags</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline / Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Negócios</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.map((lead) => {
                                const isSelected = selectedLeads.includes(lead.id);
                                return (
                                    <tr
                                        key={lead.id}
                                        className={`group transition-colors cursor-pointer ${isSelected ? 'bg-violet-50/50' : 'hover:bg-slate-50'}`}
                                        onClick={() => openDetailModal(lead)}
                                    >
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={(e) => toggleSelectOne(e, lead.id)}
                                                    className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${isSelected ? 'bg-violet-600 border-violet-600' : 'bg-white border-slate-300'
                                                        }`}
                                                >
                                                    {isSelected && <Check size={12} className="text-white" />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                    {lead.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${isSelected ? 'text-violet-700' : 'text-slate-900'}`}>{lead.name}</p>
                                                    <p className="text-xs text-slate-500">{lead.company || 'Sem empresa'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-slate-600 text-xs">
                                                    <Phone size={12} /> {formatPhone(lead.phone)}
                                                </div>
                                                {lead.email && (
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                        <Mail size={12} /> {lead.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <TagsDisplay tags={lead.tags || []} size="xs" maxDisplay={2} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPipelineColor(lead.pipeline)}`}>
                                                    {lead.pipeline === 'high_ticket' ? 'High Ticket' : 'Low Ticket'}
                                                </span>
                                                <span className="text-xs font-medium text-slate-600">
                                                    {lead.statusHT || lead.statusLT || 'Novo'}
                                                </span>
                                                {lead.lossReason && (
                                                    <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                                                        <XCircle size={10} /> {lead.lossReason.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Briefcase size={14} />
                                                <span className="text-xs font-medium">1</span> {/* Placeholder for Deal Count */}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onNavigateToChat && onNavigateToChat(lead.id); }}
                                                    className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                >
                                                    <MessageCircle size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleBulkDelete(); }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {filteredLeads.length === 0 && !isLoading && (
                        <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Nenhum contato encontrado</p>
                            <button onClick={clearFilters} className="text-sm text-violet-600 hover:underline mt-2">Limpar filtros</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedLeads.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4">
                    <div className="pl-4 font-bold text-sm bg-slate-800 py-1.5 px-3 rounded-lg">
                        {selectedLeads.length} selecionados
                    </div>

                    <div className="h-4 w-px bg-slate-700" />

                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg text-xs font-bold uppercase transition-colors text-rose-400"
                    >
                        <Trash2 size={14} /> Excluir
                    </button>

                    <button
                        onClick={() => setSelectedLeads([])}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white ml-2"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Modals */}
            <LeadModal
                isOpen={isLeadModalOpen}
                onClose={() => { setIsLeadModalOpen(false); setEditingLead(null); }}
                onSave={handleSaveLead}
                leadToEdit={editingLead}
            />

            <Lead360Modal
                isOpen={isDetailModalOpen}
                lead={detailLead}
                onClose={() => setIsDetailModalOpen(false)}
                onOpenChat={(lead) => onNavigateToChat && onNavigateToChat(lead.id)}
                onUpdateLead={async (updates) => {
                    if (!detailLeadId) return;
                    await supabaseUpdateLead(detailLeadId, updates as any);
                    setLeads(prev => prev.map(l => l.id === detailLeadId ? { ...l, ...updates } as Lead : l));
                }}
            />
        </div>
    );
};

export default ContactsView;
