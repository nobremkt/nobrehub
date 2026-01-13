
import React, { useState, useMemo } from 'react';
import { Search, Trash2, Mail, Download, Phone, Plus, Edit2, Calendar, Check, Square, CheckSquare } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import TagSelector from './TagSelector';
import LeadModal from './LeadModal';

const MOCK_LEADS: any[] = [
  { id: '1', name: 'Ana Oliveira', email: 'vendas@techsolutions.com.br', phone: '(51) 95555-5555', company: 'Tech Solutions LTDA', pipeline: 'high-ticket', status: 'qualificado', estimatedValue: 15000, createdAt: '2024-06-01T10:30:00Z' },
  { id: '2', name: 'Carlos Santos', email: 'contato@modaplus.com.br', phone: '(41) 96666-4444', company: 'Moda Plus', pipeline: 'low-ticket', status: 'novo', estimatedValue: 497, createdAt: '2024-06-02T14:15:00Z' },
  { id: '3', name: 'Roberto Lima', email: 'roberto@construtora.com', phone: '(11) 97777-8888', company: 'Lima Construções', pipeline: 'high-ticket', status: 'negociacao', estimatedValue: 45000, createdAt: '2024-06-03T09:00:00Z' },
  { id: '4', name: 'Julia Martins', email: 'julia@design.com', phone: '(21) 96666-2222', company: 'Studio J', pipeline: 'low-ticket', status: 'novo', estimatedValue: 1200, createdAt: '2024-06-04T16:20:00Z' },
];

const LeadList: React.FC = () => {
  const [leads, setLeads] = useState<any[]>(MOCK_LEADS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

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

  const handleSaveLead = (lead: any) => {
    const newLead = {
      ...lead,
      estimatedValue: Number(lead.value) || 0,
      email: 'sem@email.com',
      phone: '(00) 00000-0000'
    };
    setLeads([newLead, ...leads]);
    alert(`Lead "${lead.name}" adicionado à lista.`);
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

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selectedLeads.length} leads selecionados?`)) {
      setLeads(leads.filter(l => !selectedLeads.includes(l.id)));
      setSelectedLeads([]);
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
                      className={`w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center ${
                        isAllSelected
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
                          className={`w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center ${
                            isSelected
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
                        {lead.status}
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
                            setLeads(leads.filter(l => l.id !== lead.id));
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
          
          {filteredLeads.length === 0 && (
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
