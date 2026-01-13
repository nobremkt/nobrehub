
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, LogOut, Eye, ArrowLeft, Trash2, Settings, DollarSign, Factory, HeartHandshake, Layers } from 'lucide-react';
import { Agent, BoardStageConfig } from '../types';
import LeadModal from './LeadModal';

interface KanbanProps {
  monitoredUser?: Agent | null;
  onExitMonitor?: () => void;
}

// Configurações de colunas por setor
const PIPELINE_TEMPLATES = {
  sales: [
    { id: 'novo', name: 'Novo Lead', color: 'slate' },
    { id: 'qualificado', name: 'Qualificado', color: 'amber' },
    { id: 'proposta', name: 'Proposta', color: 'purple' },
    { id: 'fechado', name: 'Fechado', color: 'emerald' },
  ] as BoardStageConfig[],
  production: [
    { id: 'backlog', name: 'A Fazer', color: 'slate' },
    { id: 'doing', name: 'Em Produção', color: 'blue' },
    { id: 'review', name: 'Revisão', color: 'orange' },
    { id: 'done', name: 'Entregue', color: 'emerald' },
  ] as BoardStageConfig[],
  post_sales: [
    { id: 'onboarding', name: 'Onboarding', color: 'indigo' },
    { id: 'active', name: 'Carteira Ativa', color: 'emerald' },
    { id: 'renew', name: 'Renovação', color: 'amber' },
    { id: 'churn', name: 'Risco Churn', color: 'rose' },
  ] as BoardStageConfig[]
};

const COLORS = [
  { name: 'rose', bg: 'bg-rose-500' },
  { name: 'emerald', bg: 'bg-emerald-500' },
  { name: 'amber', bg: 'bg-amber-500' },
  { name: 'blue', bg: 'bg-blue-500' },
  { name: 'purple', bg: 'bg-purple-500' },
  { name: 'slate', bg: 'bg-slate-500' },
  { name: 'orange', bg: 'bg-orange-500' },
  { name: 'indigo', bg: 'bg-indigo-500' },
];

const Kanban: React.FC<KanbanProps> = ({ monitoredUser, onExitMonitor }) => {
  const [currentPipeline, setCurrentPipeline] = useState<'sales' | 'production' | 'post_sales'>('sales');
  
  // Se estiver monitorando, usa o board do usuário. Se não, usa o template do pipeline selecionado.
  const getInitialStages = () => {
    if (monitoredUser?.boardConfig) return monitoredUser.boardConfig;
    return PIPELINE_TEMPLATES['sales'];
  };

  const [boardStages, setBoardStages] = useState<BoardStageConfig[]>(getInitialStages());
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [activeStageForLead, setActiveStageForLead] = useState<string | undefined>(undefined);
  const editRef = useRef<HTMLDivElement>(null);

  // Atualiza colunas quando o usuário monitorado muda ou o pipeline selecionado muda
  useEffect(() => {
    if (monitoredUser) {
      setBoardStages(monitoredUser.boardConfig || PIPELINE_TEMPLATES.sales);
    } else {
      setBoardStages(PIPELINE_TEMPLATES[currentPipeline]);
    }
  }, [monitoredUser, currentPipeline]);

  // Handler para fechar ao clicar fora e pressionar ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEditingStageId(null);
    };
    
    const handleClickOutside = (event: MouseEvent) => {
      if (editRef.current && !editRef.current.contains(event.target as Node)) {
        setEditingStageId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const addStage = () => {
    const newStage: BoardStageConfig = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Nova Etapa',
      color: 'slate'
    };
    setBoardStages([...boardStages, newStage]);
  };

  const removeStage = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const stage = boardStages.find(s => s.id === id);
    if (stage && window.confirm(`Deseja excluir permanentemente a coluna "${stage.name}"?`)) {
      setBoardStages(prev => prev.filter(s => s.id !== id));
      if (editingStageId === id) setEditingStageId(null);
    }
  };

  const updateStage = (id: string, updates: Partial<BoardStageConfig>) => {
    setBoardStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleOpenLeadModal = (stageId?: string) => {
    setActiveStageForLead(stageId);
    setIsLeadModalOpen(true);
  };

  const handleSaveLead = (lead: any) => {
    console.log("Novo lead salvo:", lead);
    alert(`Lead "${lead.name}" registrado com sucesso!`);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] animate-in slide-in-from-right duration-500">
      
      {/* SUPERVISION HEADER */}
      {monitoredUser && (
        <div className="bg-amber-400 px-10 py-4 flex items-center justify-between shadow-lg shadow-amber-400/20 z-[60] animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4">
             <div className="bg-amber-900/10 p-2 rounded-xl">
               <Eye size={20} className="text-amber-900" />
             </div>
             <div className="flex flex-col">
               <span className="text-amber-900 text-[10px] font-black uppercase tracking-widest leading-none">Modo Supervisão Ativado</span>
               <span className="text-amber-950 text-sm font-black tracking-tight">Você está visualizando o Workspace de <span className="underline">{monitoredUser.name}</span></span>
             </div>
          </div>
          <button 
            onClick={onExitMonitor}
            className="flex items-center gap-2 bg-white text-amber-900 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-50 transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            <LogOut size={14} /> Sair da Supervisão
          </button>
        </div>
      )}

      <header className="px-10 pt-10 pb-8 border-b border-slate-200 bg-white shadow-sm z-10 transition-all">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full xl:w-auto">
            {monitoredUser && (
              <button 
                onClick={onExitMonitor}
                className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none whitespace-nowrap">
                {monitoredUser ? `Board: ${monitoredUser.name}` : 'Pipeline Master'}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">
                   {monitoredUser ? `Personalizado: ${monitoredUser.role}` : 'Visão Global da Operação'}
                 </p>
              </div>
            </div>
          </div>

          {/* SELETOR DE PIPELINE (Aparece apenas se não estiver em modo supervisão) */}
          {!monitoredUser && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full xl:w-auto overflow-x-auto no-scrollbar">
              <button
                onClick={() => setCurrentPipeline('sales')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  currentPipeline === 'sales' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <DollarSign size={14} /> Vendas
              </button>
              <button
                onClick={() => setCurrentPipeline('production')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  currentPipeline === 'production' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Factory size={14} /> Produção
              </button>
              <button
                onClick={() => setCurrentPipeline('post_sales')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  currentPipeline === 'post_sales' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <HeartHandshake size={14} /> Pós-Venda
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 w-full xl:w-auto">
             <div className="relative flex-1 xl:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" 
                  placeholder="Pesquisar..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-rose-600/50 transition-all shadow-inner"
                />
             </div>
             
             <button 
              onClick={() => handleOpenLeadModal()}
              className="flex-shrink-0 bg-rose-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
             >
                <Plus size={18} strokeWidth={3} /> Novo Registro
             </button>
          </div>
        </div>
      </header>

      {/* BOARD CANVAS */}
      <div className="flex-1 overflow-x-auto p-10 flex gap-8 items-start no-scrollbar bg-slate-50/50">
        {boardStages.map((stage) => (
          <div key={stage.id} className="min-w-[320px] w-[320px] flex flex-col h-full gap-5 relative group/column">
            
            {/* Header de Coluna conforme imagem */}
            <div className="flex items-center justify-between px-2 relative min-h-[40px]">
               <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-${stage.color}-500 shadow-lg shadow-${stage.color}-500/20`}></div>
                  <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">{stage.name}</h2>
                  <span className="bg-slate-200/60 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md">{0}</span>
               </div>
               
               {/* Use onMouseDown stopPropagation to prevent conflict with click-outside listener */}
               <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
                 <button 
                  type="button"
                  onClick={() => setEditingStageId(stage.id)}
                  className="p-2 text-slate-400 hover:text-slate-900 transition-all rounded-xl hover:bg-slate-100"
                  title="Editar Etapa"
                 >
                    <Edit2 size={16} strokeWidth={2.5} />
                 </button>
                 <button 
                  type="button"
                  onClick={(e) => removeStage(e, stage.id)}
                  className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all rounded-xl shadow-sm border border-rose-100/50"
                  title="Excluir Coluna"
                 >
                    <Trash2 size={16} strokeWidth={2.5} />
                 </button>
               </div>

               {/* Popover de Edição com visual fiel à imagem */}
               {editingStageId === stage.id && (
                 <div 
                   ref={editRef}
                   className="absolute top-12 right-0 w-72 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl z-[80] p-8 animate-in zoom-in-95 duration-200"
                   onMouseDown={(e) => e.stopPropagation()} 
                 >
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Nome da Etapa</label>
                        <input 
                          autoFocus
                          type="text" 
                          value={stage.name}
                          onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                          className="w-full bg-white border-2 border-rose-500 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/5 transition-all"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Personalizar Cor</label>
                        <div className="flex flex-wrap gap-2.5">
                          {COLORS.map((c) => (
                            <button 
                              key={c.name}
                              onClick={() => updateStage(stage.id, { color: c.name as any })}
                              className={`w-8 h-8 rounded-full transition-all relative border-2 ${
                                stage.color === c.name 
                                  ? 'border-slate-900 scale-110 shadow-lg' 
                                  : 'border-transparent hover:scale-110'
                              } ${c.bg}`}
                            >
                               {stage.color === c.name && <div className="absolute inset-0 flex items-center justify-center text-white"><Plus size={12} strokeWidth={4} /></div>}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-50">
                        <button 
                          onClick={() => setEditingStageId(null)}
                          className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-rose-700 active:scale-95 shadow-xl shadow-rose-600/20"
                        >
                          Pronto
                        </button>
                      </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20 mt-4">
              <div 
                onClick={() => handleOpenLeadModal(stage.id)}
                className="bg-white/40 border-2 border-dashed border-slate-200 rounded-[2.5rem] py-16 flex flex-col items-center justify-center text-slate-300 gap-4 group/card hover:border-rose-600/30 hover:bg-white transition-all cursor-pointer shadow-sm"
              >
                 <div className="p-4 bg-slate-100/50 rounded-full group-hover/card:bg-rose-50 group-hover/card:text-rose-600 transition-all">
                    <Plus size={32} strokeWidth={1} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/card:text-rose-600/60">Adicionar Card</span>
              </div>
            </div>
          </div>
        ))}

        {/* Botão Nova Coluna */}
        <div className="min-w-[280px] w-[280px] flex flex-col h-full gap-5">
          <div className="min-h-[40px] invisible select-none">Spacer</div>
          <button 
            onClick={addStage}
            className="w-full h-[140px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 hover:text-rose-600 hover:border-rose-200 hover:bg-white transition-all gap-3 group shadow-sm shrink-0"
          >
            <div className="p-3 rounded-2xl bg-slate-100 group-hover:bg-rose-50 group-hover:text-rose-600 transition-all">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Nova Coluna</span>
          </button>
        </div>
      </div>

      <LeadModal 
        isOpen={isLeadModalOpen} 
        onClose={() => setIsLeadModalOpen(false)} 
        initialStage={activeStageForLead}
        onSave={handleSaveLead}
      />
    </div>
  );
};

export default Kanban;
