
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Mail, Download, Phone, Plus, Edit2, Calendar, Check, MessageCircle, Globe, Target, Headphones, User, Filter, X, ChevronDown, XCircle, Tag } from 'lucide-react';
import LeadModal from './LeadModal';
import Lead360Modal from './Lead360Modal';
import LossReasonModal from './LossReasonModal';
import { TagsDisplay } from './TagsEditor';
import {
  supabaseGetLeads,
  supabaseDeleteLead,
  supabaseCreateLead,
  supabaseUpdateLead,
  supabaseMarkLeadAsLost,
  Lead
} from '../services/supabaseApi';
import { toast } from 'sonner';
import { useFirebase } from '../contexts/FirebaseContext';

interface LeadListProps {
  onNavigateToChat?: (leadId?: string) => void;
}

const LeadList: React.FC<LeadListProps> = ({ onNavigateToChat }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [lossModalLead, setLossModalLead] = useState<Lead | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    pipeline: '' as '' | 'high_ticket' | 'low_ticket',
    status: '',
    source: '',
    hasConversation: '' as '' | 'yes' | 'no',
    dateRange: '' as '' | '7d' | '30d' | '90d',
    tags: [] as string[],
    lostOnly: false,
  });

  const { subscribeToNewLeads, subscribeToLeadUpdates } = useFirebase();

  useEffect(() => {
    fetchLeads();
  }, []);

  // Real-time Listeners
  useEffect(() => {
    const unsubscribeNew = subscribeToNewLeads((newLead: Lead) => {
      toast.success(`Novo Lead na base: ${newLead.name}`);
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
      setLeads(data as Lead[]);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra leads - exclui leads sem pipeline (não qualificados)
  const filteredLeads = useMemo(() => {
    const now = new Date();
    return leads
      .filter(l => l.pipeline) // Só mostra leads com pipeline definido
      // Text search
      .filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      // Pipeline filter
      .filter(l => !filters.pipeline || l.pipeline === filters.pipeline)
      // Status filter
      .filter(l => {
        if (!filters.status) return true;
        return l.statusHT === filters.status || l.statusLT === filters.status;
      })
      // Source filter
      .filter(l => !filters.source || l.source === filters.source)
      // Date range filter
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

  // Get unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    return [...new Set(leads.filter(l => l.source).map(l => l.source as string))];
  }, [leads]);

  // Get unique statuses for filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    leads.forEach(l => {
      if (l.statusHT) statuses.add(l.statusHT);
      if (l.statusLT) statuses.add(l.statusLT);
    });
    return [...statuses];
  }, [leads]);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== false && !(Array.isArray(v) && v.length === 0)).length;

  const clearFilters = () => {
    setFilters({ pipeline: '', status: '', source: '', hasConversation: '', dateRange: '', tags: [], lostOnly: false });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatPhone = (phone: string | undefined) => {
    if (!phone) return '-';
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // 12 digits (55 + 2 DDD + 8 NUM) or 13 digits (55 + 2 DDD + 9 NUM)
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      const ddd = digits.slice(2, 4);
      const num = digits.slice(4);
      if (num.length === 9) {
        return `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
      } else {
        return `+55 (${ddd}) ${num.slice(0, 4)}-${num.slice(4)}`;
      }
    }

    // Standard local formats (10 or 11)
    if (digits.length === 11) {
      return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `+${digits}`; // Fallback for international/unknown
  };

  const getPipelineLabel = (pipeline?: string) => {
    if (pipeline === 'high_ticket') return 'High Ticket';
    if (pipeline === 'low_ticket') return 'Low Ticket';
    return '-';
  };

  const getPipelineColor = (pipeline?: string) => {
    if (pipeline === 'high_ticket') return 'bg-purple-100 text-purple-700';
    if (pipeline === 'low_ticket') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-500';
  };

  const handleSaveLead = async (leadData: any) => {
    try {
      if (leadData.id) {
        // Update existing lead
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
        toast.success('Lead atualizado com sucesso!');
      } else {
        // Create new lead
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
        toast.success('Lead criado com sucesso!');
      }
      setIsLeadModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error('Falha ao salvar lead. Tente novamente.');
    }
  };

  // Lógica de Seleção
  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selectedLeads.length} leads selecionados?`)) {
      try {
        await Promise.all(selectedLeads.map(id => supabaseDeleteLead(id)));
        setLeads(leads.filter(l => !selectedLeads.includes(l.id)));
        setSelectedLeads([]);
        toast.success('Leads excluídos com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir leads em massa:', error);
        toast.error('Erro ao excluir alguns leads.');
      }
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      try {
        await supabaseDeleteLead(id);
        setLeads(leads.filter(l => l.id !== id));
        toast.success('Lead excluído!');
      } catch (error) {
        console.error('Erro ao excluir lead:', error);
        toast.error('Erro ao excluir lead.');
      }
    }
  };

  const handleOpenDetail = (lead: Lead) => {
    setDetailLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    // Open Lead360Modal for editing (shows full context with edit capability)
    setDetailLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleOpenChat = (lead: Lead) => {
    // Navigate to chat/inbox view with lead ID
    if (onNavigateToChat) {
      onNavigateToChat(lead.id);
      toast.success(`Abrindo conversa com ${lead.name}`);
    } else {
      toast.info(`Chat com ${lead.name} - vá para Atendimento`);
    }
  };

  const isAllSelected = filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length;

  return (
    <div className="h-dvh flex flex-col bg-[#f8fafc] animate-in fade-in duration-700">
      <header className="px-10 py-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Gestão de Leads</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Base de dados unificada Nobre Marketing</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-2xl transition-all shadow-xl shadow-rose-600/30 font-black text-[10px] uppercase tracking-widest active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} /> Novo Lead
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              placeholder="Filtrar por nome, email ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-[2rem] py-5 pl-16 pr-8 text-sm focus:outline-none focus:border-rose-600/50 shadow-sm transition-all text-slate-900"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-5 rounded-[2rem] border shadow-sm transition-all ${activeFilterCount > 0
              ? 'bg-violet-100 border-violet-300 text-violet-700'
              : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600'
              }`}
          >
            <Filter size={20} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button className="p-5 rounded-[2rem] bg-white border border-slate-200 text-slate-400 hover:text-rose-600 shadow-sm transition-all">
            <Download size={20} />
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mt-4 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-700">Filtros Avançados</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Pipeline */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pipeline</label>
                <select
                  value={filters.pipeline}
                  onChange={(e) => setFilters(prev => ({ ...prev, pipeline: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Todos</option>
                  <option value="high_ticket">High Ticket</option>
                  <option value="low_ticket">Low Ticket</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Todos</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Origem</label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Todas</option>
                  {uniqueSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Período</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Todos</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm">
                  <span className="font-bold text-slate-700">{filteredLeads.length}</span>
                  <span className="text-slate-400 ml-1">leads</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-10 no-scrollbar pb-32">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-6 w-12 text-center">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${isAllSelected
                        ? 'bg-rose-600 border-rose-600 shadow-lg shadow-rose-600/20'
                        : 'bg-white border-slate-200 hover:border-rose-300'
                        }`}
                    >
                      {isAllSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                    </button>
                  </div>
                </th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead / Empresa</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tags</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo/Perda</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeads.includes(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className={`group transition-colors cursor-pointer ${isSelected ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'}`}
                    onClick={() => handleOpenDetail(lead)}
                  >
                    <td className="px-4 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={(e) => toggleSelectOne(e, lead.id)}
                          className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${isSelected
                            ? 'bg-rose-600 border-rose-600 shadow-lg shadow-rose-600/20'
                            : 'bg-white border-slate-200 hover:border-rose-300'
                            }`}
                        >
                          {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-rose-700' : 'text-slate-900 group-hover:text-rose-600'}`}>{lead.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{lead.company || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone size={11} />
                          <span className="text-xs font-medium">{formatPhone(lead.phone)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mail size={11} />
                          <span className="text-[10px]">{lead.email || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getPipelineColor(lead.pipeline)}`}>
                        {getPipelineLabel(lead.pipeline)}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Globe size={12} />
                        <span className="text-xs">{lead.source || 'Desconhecida'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {lead.statusHT || lead.statusLT || 'Novo'}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <TagsDisplay tags={lead.tags || []} maxDisplay={2} size="xs" />
                    </td>
                    <td className="px-4 py-5 max-w-[180px]">
                      <div className="flex flex-col gap-1">
                        {lead.lossReason && (
                          <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                            <XCircle size={10} />
                            {lead.lossReason.name}
                          </span>
                        )}
                        {!lead.lossReason && lead.contactReason && (
                          <span className="text-xs text-slate-600 line-clamp-1" title={lead.contactReason}>
                            {lead.contactReason}
                          </span>
                        )}
                        {lead.lastMessage && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={lead.lastMessageFrom === 'out' ? "text-blue-400 shrink-0" : "text-slate-400 shrink-0"}>
                              {lead.lastMessageFrom === 'out' ? <Headphones size={10} /> : <User size={10} />}
                            </span>
                            <span className={`text-[10px] italic line-clamp-1 border-l-2 border-slate-200 pl-1 ${lead.lastMessageFrom === 'out' ? "text-blue-500" : "text-slate-400"}`} title={lead.lastMessage}>
                              "{lead.lastMessage}"
                            </span>
                          </div>
                        )}
                        {!lead.contactReason && !lead.lastMessage && (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm font-black text-slate-900 tracking-tighter">{formatCurrency(lead.estimatedValue || 0)}</span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={12} />
                        <span className="text-xs">{formatDate(lead.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenChat(lead); }}
                          className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Abrir Conversa"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditLead(lead); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        {!lead.lossReason && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setLossModalLead(lead); }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Marcar como Perdido"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}
                          className="p-2 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredLeads.length === 0 && !isLoading && (
            <div className="p-10 text-center text-slate-400 flex flex-col items-center">
              <Search size={40} className="mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhum lead encontrado</p>
            </div>
          )}
        </div>
      </div>

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
        onOpenChat={handleOpenChat}
        onUpdateLead={async (updates) => {
          if (!detailLead) return;
          await supabaseUpdateLead(detailLead.id, updates as any);
          setLeads(prev => prev.map(l => l.id === detailLead.id ? { ...l, ...updates } as Lead : l));
        }}
      />

      <LossReasonModal
        isOpen={!!lossModalLead}
        onClose={() => setLossModalLead(null)}
        leadName={lossModalLead?.name || ''}
        onConfirm={async (lossReasonId, notes) => {
          if (!lossModalLead) return;
          try {
            const updated = await supabaseMarkLeadAsLost(lossModalLead.id, lossReasonId, notes);
            setLeads(prev => prev.map(l => l.id === lossModalLead.id ? updated : l));
            toast.success('Lead marcado como perdido');
            setLossModalLead(null);
          } catch (error) {
            toast.error('Erro ao marcar lead como perdido');
          }
        }}
      />

      {/* Bulk Actions Bar - Fixed at bottom */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/50 px-6 py-4 flex items-center gap-4">
            {/* Counter */}
            <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
              <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center font-black text-sm">
                {selectedLeads.length}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">selecionados</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await Promise.all(selectedLeads.map(id =>
                      supabaseUpdateLead(id, { pipeline: 'high_ticket', statusHT: 'novo' })
                    ));
                    await fetchLeads();
                    setSelectedLeads([]);
                    toast.success('Leads movidos para High Ticket!');
                  } catch (e) {
                    toast.error('Erro ao mover leads');
                  }
                }}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                <Target size={14} />
                High Ticket
              </button>

              <button
                onClick={async () => {
                  try {
                    await Promise.all(selectedLeads.map(id =>
                      supabaseUpdateLead(id, { pipeline: 'low_ticket', statusLT: 'novo' })
                    ));
                    await fetchLeads();
                    setSelectedLeads([]);
                    toast.success('Leads movidos para Low Ticket!');
                  } catch (e) {
                    toast.error('Erro ao mover leads');
                  }
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                <Target size={14} />
                Low Ticket
              </button>

              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>

            {/* Close */}
            <button
              onClick={() => setSelectedLeads([])}
              className="ml-2 p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="Limpar seleção"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadList;
