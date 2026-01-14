
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Mail, Download, Phone, Plus, Edit2, Calendar, Check, Square, CheckSquare } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import TagSelector from './TagSelector';
import LeadModal from './LeadModal';
import { getLeads, Lead, deleteLead, createLead } from '../services/api';
import * as api from '../services/api';

const LeadList: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Filtra leads antes de renderizar para garantir que a seleção em massa respeite a busca
  const filteredLeads = useMemo(() => {
    return leads.filter(l =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leads, searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
  };

  const handleSaveLead = async (leadData: any) => {
    try {
      const newLeadRaw = await api.createLead({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        company: leadData.company,
        estimatedValue: parseFloat(leadData.value) || 0,
        pipeline: leadData.pipeline,
        statusHT: leadData.pipeline === 'high_ticket' ? leadData.status : undefined,
        statusLT: leadData.pipeline === 'low_ticket' ? leadData.status : undefined
      });
      setLeads((prev) => [...prev, newLeadRaw]);
      setIsLeadModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      alert('Falha ao criar lead. Tente novamente.');
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

  const toggleSelectOne = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selectedLeads.length} leads selecionados?`)) {
      // Deletar um por um por enquanto, pois a API pode n suportar bulk delete ainda
      try {
        await Promise.all(selectedLeads.map(id => deleteLead(id)));
        setLeads(leads.filter(l => !selectedLeads.includes(l.id)));
        setSelectedLeads([]);
      } catch (error) {
        console.error('Erro ao excluir leads em massa:', error);
        alert('Erro ao excluir alguns leads.');
      }
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      try {
        await deleteLead(id);
        setLeads(leads.filter(l => l.id !== id));
      } catch (error) {
        console.error('Erro ao excluir lead:', error);
        alert('Erro ao excluir lead.');
      }
    }
  };

  const isAllSelected = filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length;

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] animate-in fade-in duration-700">
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
              placeholder="Filtrar por nome, email ou telefone..."
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
                <th className="px-6 py-6 w-16 text-center">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center ${isAllSelected
                        ? 'bg-rose-600 border-rose-600 shadow-lg shadow-rose-600/20'
                        : 'bg-white border-slate-200 hover:border-rose-300'
                        }`}
                    >
                      {isAllSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                    </button>
                  </div>
                </th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead / Empresa</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeads.includes(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className={`group transition-colors cursor-pointer ${isSelected ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'}`}
                    onClick={() => toggleSelectOne(lead.id)}
                  >
                    <td className="px-6 py-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(lead.id);
                          }}
                          className={`w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center ${isSelected
                            ? 'bg-rose-600 border-rose-600 shadow-lg shadow-rose-600/20'
                            : 'bg-white border-slate-200 hover:border-rose-300'
                            }`}
                        >
                          {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-rose-700' : 'text-slate-900 group-hover:text-rose-600'}`}>{lead.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{lead.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={12} />
                          <span className="text-xs font-medium">{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail size={12} />
                          <span className="text-[11px]">{lead.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {lead.statusHT || lead.statusLT || 'Novo'}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-sm font-black text-slate-900 tracking-tighter">{formatCurrency(lead.estimatedValue)}</span>
                    </td>
                    <td className="px-6 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLead(lead.id);
                          }}
                          className="p-2.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
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
        onClose={() => setIsLeadModalOpen(false)}
        onSave={handleSaveLead}
      />
    </div>
  );
};

export default LeadList;
