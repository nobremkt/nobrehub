import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, LogOut, Eye, ArrowLeft, Trash2, Settings, DollarSign, Factory, HeartHandshake, Layers, Headphones, User } from 'lucide-react';
import { Agent, BoardStageConfig } from '../types';
import LeadModal from './LeadModal';
import { getLeads, Lead, updateLeadStatus } from '../services/api';
import { toast } from 'sonner';
import { useSocket } from '../hooks/useSocket';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';

interface KanbanProps {
  monitoredUser?: Agent | null;
  onExitMonitor?: () => void;
}

// Configurações de colunas por setor
const PIPELINE_TEMPLATES = {
  high_ticket: [
    { id: 'novo', name: 'Novo Lead', color: 'slate' },
    { id: 'qualificado', name: 'Qualificado', color: 'amber' },
    { id: 'call_agendada', name: 'Call Agendada', color: 'blue' },
    { id: 'proposta', name: 'Proposta', color: 'purple' },
    { id: 'negociacao', name: 'Negociação', color: 'orange' },
    { id: 'fechado', name: 'Fechado', color: 'emerald' },
  ] as BoardStageConfig[],
  low_ticket: [
    { id: 'novo', name: 'Novo', color: 'slate' },
    { id: 'atribuido', name: 'Atribuído', color: 'blue' },
    { id: 'em_negociacao', name: 'Em Negociação', color: 'amber' },
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

const DraggableLeadCard = ({ lead, onClick }: { lead: Lead; onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style: React.CSSProperties = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 9999,
    position: 'relative',
    pointerEvents: 'none',
  } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:border-rose-200 hover:shadow-md ${isDragging ? 'opacity-80 ring-2 ring-rose-500 shadow-2xl scale-105' : 'transition-all'
        }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.company || 'Sem Empresa'}</span>
        {lead.estimatedValue && (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lead.estimatedValue)}
          </span>
        )}
      </div>
      <h3 className="font-bold text-slate-800 leading-tight mb-2">{lead.name}</h3>

      {/* Last Message Preview */}
      {/* Last Message Preview */}
      {lead.lastMessage && (
        <div className={`text-[11px] px-3 py-2 rounded-lg mb-3 line-clamp-2 italic border-l-2 flex gap-2 items-start ${lead.lastMessageFrom === 'out' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-500 border-slate-300'}`}>
          <span className="shrink-0 mt-0.5 opacity-70">
            {lead.lastMessageFrom === 'out' ? <Headphones size={12} /> : <User size={12} />}
          </span>
          <span className="leading-tight">"{lead.lastMessage}"</span>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
        {lead.source && <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] uppercase">{lead.source}</span>}
      </div>
    </div>
  );
};

// Componente Droppable Column interno para usar o hook
const DroppableColumn = ({ stage, children, count, onAddLead, buttons, editor }: any) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[320px] w-[320px] flex flex-col h-full gap-5 relative group/column ${isOver ? 'bg-slate-100/50 rounded-[2.5rem]' : ''}`}
    >
      {/* Header de Coluna */}
      <div className="flex items-center justify-between px-2 relative min-h-[40px]">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full bg-${stage.color}-500 shadow-lg shadow-${stage.color}-500/20`}></div>
          <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">{stage.name}</h2>
          <span className="bg-slate-200/60 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md">{count}</span>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
          {buttons}
        </div>

        {/* Editor Popover */}
        {editor}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-20 mt-4 px-1">
        {children}

        <div
          onClick={() => onAddLead(stage.id)}
          className="bg-white/40 border-2 border-dashed border-slate-200 rounded-[2.5rem] py-8 flex flex-col items-center justify-center text-slate-300 gap-4 group/card hover:border-rose-600/30 hover:bg-white transition-all cursor-pointer shadow-sm opacity-60 hover:opacity-100"
        >
          <div className="p-3 bg-slate-100/50 rounded-full group-hover/card:bg-rose-50 group-hover/card:text-rose-600 transition-all">
            <Plus size={24} strokeWidth={1.5} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/card:text-rose-600/60">Adicionar Card</span>
        </div>
      </div>
    </div>
  );
};


const Kanban: React.FC<KanbanProps> = ({ monitoredUser, onExitMonitor }) => {
  const [currentPipeline, setCurrentPipeline] = useState<'sales' | 'production' | 'post_sales'>('sales');
  const [salesSubPipeline, setSalesSubPipeline] = useState<'high_ticket' | 'low_ticket'>('high_ticket');

  // Se estiver monitorando, usa o board do usuário. Se não, usa o template do pipeline selecionado.
  const getInitialStages = () => {
    if (monitoredUser?.boardConfig) return monitoredUser.boardConfig;
    return PIPELINE_TEMPLATES['high_ticket'];
  };

  const [boardStages, setBoardStages] = useState<BoardStageConfig[]>(getInitialStages());
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [activeStageForLead, setActiveStageForLead] = useState<string | undefined>(undefined);
  const editRef = useRef<HTMLDivElement>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Map internal pipeline names to API pipeline types
  const getApiPipelineType = (pipeline: string) => {
    switch (pipeline) {
      case 'sales': return salesSubPipeline; // Uses the sub-pipeline (high_ticket or low_ticket)
      case 'production': return 'production';
      case 'post_sales': return 'post_sales';
      default: return 'high_ticket';
    }
  };

  // Socket Integration
  const { subscribeToNewLeads, subscribeToLeadUpdates } = useSocket(); // Using global socket

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Fetch Leads on Mount and when currentPipeline changes
  useEffect(() => {
    const loadLeads = async () => {
      setIsLoading(true);
      try {
        const pipelineType = getApiPipelineType(currentPipeline);
        const data = await getLeads({ pipeline: pipelineType });

        if (monitoredUser) {
          setLeads(data.filter(l => l.assignedAgentId === monitoredUser.id));
        } else {
          setLeads(data);
        }
      } catch (error) {
        console.error('Failed to load leads', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLeads();
  }, [currentPipeline, salesSubPipeline, monitoredUser]);

  // Real-time Updates: New Leads
  useEffect(() => {
    const isRelevantPipeline = (lead: Lead) => {
      if (monitoredUser && lead.assignedAgentId !== monitoredUser.id) return false;
      const pipelineType = getApiPipelineType(currentPipeline);
      return lead.pipeline === pipelineType;
    };

    const unsubscribeNew = subscribeToNewLeads((newLead: Lead) => {
      if (isRelevantPipeline(newLead)) {
        toast.success(`Novo Lead: ${newLead.name}`);
        setLeads(prev => [newLead, ...prev]);
      }
    });

    const unsubscribeUpdate = subscribeToLeadUpdates((updatedLead: Lead) => {
      const prevLead = leads.find(l => l.id === updatedLead.id);

      // If belongs to current view, update or add
      if (isRelevantPipeline(updatedLead)) {
        setLeads(prev => {
          const exists = prev.some(l => l.id === updatedLead.id);
          if (exists) {
            return prev.map(l => l.id === updatedLead.id ? updatedLead : l);
          }
          return [updatedLead, ...prev];
        });

        // Notify if moved pipeline/status significantly (optional)
        if (prevLead && prevLead.pipeline !== updatedLead.pipeline) {
          toast.info(`Lead movido para este pipeline: ${updatedLead.name}`);
        }
      } else {
        // If it was here but moved away (pipeline changed), remove it
        setLeads(prev => prev.filter(l => l.id !== updatedLead.id));
      }
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
    };
  }, [currentPipeline, salesSubPipeline, monitoredUser, leads, subscribeToNewLeads, subscribeToLeadUpdates]);

  // Atualiza colunas quando o usuário monitorado muda ou o pipeline selecionado muda
  useEffect(() => {
    if (monitoredUser) {
      setBoardStages(monitoredUser.boardConfig || PIPELINE_TEMPLATES.high_ticket);
    } else if (currentPipeline === 'sales') {
      // Use separate templates for HT and LT
      setBoardStages(PIPELINE_TEMPLATES[salesSubPipeline]);
    } else {
      setBoardStages(PIPELINE_TEMPLATES[currentPipeline]);
    }
  }, [monitoredUser, currentPipeline, salesSubPipeline]);

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find(l => l.id === active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null); // Clear active lead
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;
    const lead = leads.find(l => l.id === leadId);

    if (lead && (lead.statusHT !== newStatus && lead.statusLT !== newStatus)) {
      // Optimistic Update
      setLeads(prev => prev.map(l => {
        if (l.id === leadId) {
          // Determine which status field to update based on pipeline logic or existing data
          const isHT = currentPipeline === 'sales'; // Simplified logic, ideally check lead type
          return {
            ...l,
            statusHT: isHT ? newStatus : l.statusHT,
            statusLT: !isHT ? newStatus : l.statusLT
          };
        }
        return l;
      }));

      try {
        await updateLeadStatus(leadId, newStatus);
      } catch (error) {
        console.error('Failed to update status', error);
      }
    }
  };

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
    toast.success(`Lead "${lead.name}" registrado com sucesso!`);
    setIsLeadModalOpen(false);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-dvh flex flex-col bg-[#f8fafc] animate-in slide-in-from-right duration-500">

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
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentPipeline === 'sales' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <DollarSign size={14} /> Vendas
                </button>
                <button
                  onClick={() => setCurrentPipeline('production')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentPipeline === 'production' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <Factory size={14} /> Produção
                </button>
                <button
                  onClick={() => setCurrentPipeline('post_sales')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentPipeline === 'post_sales' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <HeartHandshake size={14} /> Pós-Venda
                </button>
              </div>
            )}

            {/* SUBTABS HT/LT - Aparece apenas quando 'sales' está selecionado */}
            {!monitoredUser && currentPipeline === 'sales' && (
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 gap-1">
                <button
                  onClick={() => setSalesSubPipeline('high_ticket')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${salesSubPipeline === 'high_ticket'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                    : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                >
                  <Layers size={12} /> High Ticket
                </button>
                <button
                  onClick={() => setSalesSubPipeline('low_ticket')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${salesSubPipeline === 'low_ticket'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                >
                  <Layers size={12} /> Low Ticket
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
          {boardStages.map((stage) => {
            const stageLeads = leads.filter(l => l.statusHT === stage.id || l.statusLT === stage.id);

            return (
              <DroppableColumn
                key={stage.id}
                stage={stage}
                count={stageLeads.length}
                onAddLead={handleOpenLeadModal}
                buttons={
                  <>
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
                  </>
                }
                editor={editingStageId === stage.id && (
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
                              className={`w-8 h-8 rounded-full transition-all relative border-2 ${stage.color === c.name
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
              >
                {stageLeads.map(lead => (
                  <DraggableLeadCard key={lead.id} lead={lead} onClick={() => toast.info('Detalhes do lead em breve!')} />
                ))}
              </DroppableColumn>
            );
          })}

          {/* Botão Nova Coluna */}
          <div className="min-w-[280px] w-[280px] flex flex-col gap-5">
            {/* Spacer to align with column header (40px) + gap (16px) = 56px */}
            <div className="h-[56px]" />
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

      {/* DragOverlay renders the dragging card in a portal above everything */}
      <DragOverlay dropAnimation={null}>
        {activeLead ? (
          <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-rose-500 cursor-grabbing scale-105 opacity-95">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeLead.company || 'Sem Empresa'}</span>
              {activeLead.estimatedValue && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(activeLead.estimatedValue)}
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-800 leading-tight mb-3">{activeLead.name}</h3>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{new Date(activeLead.createdAt).toLocaleDateString('pt-BR')}</span>
              {activeLead.source && <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] uppercase">{activeLead.source}</span>}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Kanban;
