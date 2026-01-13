
import React, { useState } from 'react';
import { Shield, Target, Briefcase, Search, Plus, Eye, Monitor, ArrowUpRight } from 'lucide-react';
import { Agent, AgentRole } from '../types';

const MOCK_AGENTS: Agent[] = [
  { 
    id: '1', name: 'Ana Julia', email: 'ana@nobre.com', role: 'Vendas', status: 'online', activeLeads: 15,
    boardConfig: [
      { id: '1', name: 'Lead Frio', color: 'slate' },
      { id: '2', name: 'Agendamento', color: 'amber' },
      { id: '3', name: 'Negociação', color: 'rose' },
    ]
  },
  { id: '2', name: 'Rodrigo Silva', email: 'rodrigo@nobre.com', role: 'Vendas', status: 'busy', activeLeads: 8 },
  { 
    id: '3', name: 'Beatriz Costa', email: 'beatriz@nobre.com', role: 'Produção', status: 'online', activeLeads: 12,
    boardConfig: [
      { id: '1', name: 'Backlog', color: 'slate' },
      { id: '2', name: 'Em Produção', color: 'blue' },
      { id: '3', name: 'Revisão', color: 'purple' },
      { id: '4', name: 'Aprovado', color: 'emerald' },
    ]
  },
  { id: '4', name: 'Felipe Neves', email: 'felipe@nobre.com', role: 'Produção', status: 'offline', activeLeads: 0 },
  { id: '5', name: 'Amanda Souza', email: 'amanda@nobre.com', role: 'Pós-Venda', status: 'online', activeLeads: 24 },
  { id: '6', name: 'Carlos Mendes', email: 'carlos@nobre.com', role: 'Vendas', status: 'offline', activeLeads: 5 },
];

interface TeamManagementProps {
  onMonitor: (user: Agent) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ onMonitor }) => {
  const [filter, setFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Definição das categorias e sua ordem de exibição
  const CATEGORIES: AgentRole[] = ['Vendas', 'Produção', 'Pós-Venda'];

  // Determina quais categorias exibir com base no filtro
  const visibleCategories = filter === 'Todos' ? CATEGORIES : [filter as AgentRole];

  const getRoleStyle = (role: AgentRole) => {
    switch (role) {
      case 'Vendas': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Produção': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Pós-Venda': return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const getSectionHeaderColor = (role: AgentRole) => {
    switch (role) {
      case 'Vendas': return 'bg-rose-500';
      case 'Produção': return 'bg-blue-500';
      case 'Pós-Venda': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] animate-in fade-in duration-700">
      <header className="px-10 pt-10 pb-8 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Team Launchpad</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Centro de Comando da Equipe</p>
          </div>
          <button className="bg-rose-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/20 active:scale-95 transition-all hover:bg-rose-700">
            <Plus size={16} /> Adicionar Membro
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
            {['Todos', 'Vendas', 'Produção', 'Pós-Venda'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:border-rose-600/50 transition-all shadow-inner"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-12">
        {visibleCategories.map((category) => {
          // Filtra e Ordena os agentes para esta categoria
          const categoryAgents = MOCK_AGENTS
            .filter(agent => agent.role === category)
            .filter(agent => agent.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name)); // Ordem Alfabética

          if (categoryAgents.length === 0) return null;

          return (
            <div key={category} className="animate-in slide-in-from-bottom-4 duration-500">
              {/* Cabeçalho da Seção */}
              <div className="flex items-center gap-4 mb-6">
                 <div className={`w-1.5 h-8 rounded-full ${getSectionHeaderColor(category)}`}></div>
                 <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{category}</h2>
                 <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-2 py-1 rounded-lg border border-slate-200">
                    {categoryAgents.length.toString().padStart(2, '0')}
                 </span>
                 <div className="h-px bg-slate-100 flex-1"></div>
              </div>

              {/* Grid de Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {categoryAgents.map((agent) => (
                  <div 
                    key={agent.id}
                    className="group bg-white border border-slate-100 rounded-[3rem] p-8 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:border-rose-600/20 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                  >
                    {/* Avatar e Status */}
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-rose-600 text-3xl group-hover:scale-105 transition-transform duration-500">
                          {agent.name.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white shadow-md ${
                          agent.status === 'online' ? 'bg-emerald-500' : agent.status === 'busy' ? 'bg-rose-500' : 'bg-slate-300'
                        }`}></div>
                      </div>
                      
                      <h3 className="text-xl font-black text-slate-900 tracking-tighter text-center uppercase">{agent.name}</h3>
                      <div className={`mt-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getRoleStyle(agent.role)}`}>
                        {agent.role}
                      </div>
                    </div>

                    {/* KPI */}
                    <div className="bg-slate-50 rounded-3xl p-6 mb-8 flex flex-col items-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Leads Ativos</span>
                       <div className="text-3xl font-black text-slate-900 tracking-tighter">
                         {agent.activeLeads}
                       </div>
                    </div>

                    {/* Ação */}
                    <button 
                      onClick={() => onMonitor(agent)}
                      className="w-full bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 group-hover:shadow-xl group-hover:shadow-rose-600/20"
                    >
                      <Monitor size={16} /> Monitorar Workspace
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Estado Vazio (Caso a busca não retorne nada) */}
        {MOCK_AGENTS.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Nenhum membro encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
