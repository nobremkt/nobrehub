
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Mail, Download, Phone, Plus, Edit2, Calendar, Check, MessageCircle, Globe, Target } from 'lucide-react';
import LeadModal from './LeadModal';
import LeadDetailModal from './LeadDetailModal';
import { getLeads, Lead, deleteLead, createLead, updateLead } from '../services/api';
import { toast } from 'sonner';

const LeadList: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra leads - exclui leads sem pipeline (não qualificados)
  const filteredLeads = useMemo(() => {
    return leads
      .filter(l => l.pipeline) // Só mostra leads com pipeline definido
      .filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [leads, searchTerm]);

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
    // Format as (XX) X XXXX-XXXX for 11 digits or (XX) XXXX-XXXX for 10 digits
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 13) {
      // With country code 55
      return `(${digits.slice(2, 4)}) ${digits.slice(4, 5)} ${digits.slice(5, 9)}-${digits.slice(9)}`;
    }
    return phone; // Return original if format unknown
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
        const updatedLead = await updateLead(leadData.id, {
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
        const newLeadRaw = await createLead({
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
        await Promise.all(selectedLeads.map(id => deleteLead(id)));
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
        await deleteLead(id);
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
    setEditingLead(lead);
    setIsDetailModalOpen(false);
    setIsLeadModalOpen(true);
  };

  const handleOpenChat = (lead: Lead) => {
    // TODO: Navigate to chat/conversation with this lead
    toast.info(`Abrindo conversa com ${lead.name}`);
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
            {selectedLeads.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-rose-100 hover:bg-rose-200 text-rose-700 px-6 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 whitespace-nowrap animate-in zoom-in duration-200"
              >
                <Trash2 size={16} /> Excluir ({selectedLeads.length})
              </button>
            )}

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
          <button className="p-5 rounded-[2rem] bg-white border border-slate-200 text-slate-400 hover:text-rose-600 shadow-sm transition-all">
            <Download size={20} />
          </button>
        </div>
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
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</th>
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
                      {lead.contactReason ? (
                        <span className="text-xs text-slate-500 line-clamp-1 max-w-[150px]" title={lead.contactReason}>
                          {lead.contactReason}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
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

      <LeadDetailModal
        isOpen={isDetailModalOpen}
        lead={detailLead}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={handleEditLead}
        onDelete={handleDeleteLead}
        onOpenChat={handleOpenChat}
      />
    </div>
  );
};

export default LeadList;
