import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Search, Edit2, LogOut, Eye, ArrowLeft, Trash2, DollarSign, Factory, HeartHandshake, Layers } from 'lucide-react';
import { Agent, BoardStageConfig } from '../types';
import LeadModal from './LeadModal';
import { getLeads, Lead, updateLeadStatus } from '../services/api';
import { toast } from 'sonner';
import { useSocket } from '../hooks/useSocket';
import LeadCard from './kanban/LeadCard';
import KanbanColumn from './kanban/KanbanColumn';
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
} from '@dnd-kit/core';

interface KanbanProps {
  monitoredUser?: Agent | null;
  onExitMonitor?: () => void;
  isOwnWorkspace?: boolean; // When true, don't show supervision banner (viewing own workspace)
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

// Old inline components removed - now using LeadCard and KanbanColumn from ./kanban/


const Kanban: React.FC<KanbanProps> = ({ monitoredUser, onExitMonitor, isOwnWorkspace = false }) => {
  const [currentPipeline, setCurrentPipeline] = useState<'sales' | 'production' | 'post_sales'>('sales');
  const [salesSubPipeline, setSalesSubPipeline] = useState<'high_ticket' | 'low_ticket'>('high_ticket');

  // Simple pipeline change handlers (CSS handles the animation)
  const handlePipelineChange = (newPipeline: 'sales' | 'production' | 'post_sales') => {
    if (newPipeline !== currentPipeline) setCurrentPipeline(newPipeline);
  };

  const handleSubPipelineChange = (sub: 'high_ticket' | 'low_ticket') => {
    if (sub !== salesSubPipeline) setSalesSubPipeline(sub);
  };

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

  // Cache for all leads - enables instant HT/LT switching
  const [allSalesLeads, setAllSalesLeads] = useState<Lead[]>([]);
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

  // Fetch Leads on Mount and when main pipeline changes (not sub-pipeline)
  useEffect(() => {
    const loadLeads = async () => {
      setIsLoading(true);
      try {
        if (currentPipeline === 'sales') {
          // For sales: fetch BOTH HT and LT at once for instant switching
          const [htData, ltData] = await Promise.all([
            getLeads({ pipeline: 'high_ticket' }),
            getLeads({ pipeline: 'low_ticket' })
          ]);
          const allSales = [...htData, ...ltData];

          if (monitoredUser) {
            setAllSalesLeads(allSales.filter(l => l.assignedAgentId === monitoredUser.id));
          } else {
            setAllSalesLeads(allSales);
          }
        } else {
          // For production/post_sales: just fetch that pipeline
          const pipelineType = getApiPipelineType(currentPipeline);
          const data = await getLeads({ pipeline: pipelineType });

          if (monitoredUser) {
            setLeads(data.filter(l => l.assignedAgentId === monitoredUser.id));
          } else {
            setLeads(data);
          }
          setAllSalesLeads([]); // Clear sales cache when on other pipelines
        }
      } catch (error) {
        console.error('Failed to load leads', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLeads();
  }, [currentPipeline, monitoredUser]); // Note: removed salesSubPipeline dependency

  // Filter sales leads locally when HT/LT changes (instant!)
  useEffect(() => {
    if (currentPipeline === 'sales' && allSalesLeads.length > 0) {
      const filtered = allSalesLeads.filter(l => l.pipeline === salesSubPipeline);
      setLeads(filtered);
    }
  }, [currentPipeline, salesSubPipeline, allSalesLeads]);

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
      // Optimistic Update - properly clear old status and set new one
      setLeads(prev => prev.map(l => {
        if (l.id === leadId) {
          // Determine which status field to update based on the current sub-pipeline
          const isHighTicket = salesSubPipeline === 'high_ticket';
          return {
            ...l,
            // Clear the OTHER status field to prevent appearing in multiple columns
            statusHT: isHighTicket ? newStatus : undefined,
            statusLT: !isHighTicket ? newStatus : undefined
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

        {/* SUPERVISION HEADER - Only show when supervising ANOTHER user's workspace */}
        {monitoredUser && !isOwnWorkspace && onExitMonitor && (
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
              {monitoredUser && !isOwnWorkspace && onExitMonitor && (
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

            {/* SELETOR DE PIPELINE + SUBTABS - Container com transição de slide */}
            {!monitoredUser && (
              <div className="flex items-center justify-center gap-3 transition-all duration-300 ease-out">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => handlePipelineChange('sales')}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentPipeline === 'sales' ? 'bg-white text-rose-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <DollarSign size={14} /> Vendas
                  </button>
                  <button
                    onClick={() => handlePipelineChange('production')}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentPipeline === 'production' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <Factory size={14} /> Produção
                  </button>
                  <button
                    onClick={() => handlePipelineChange('post_sales')}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentPipeline === 'post_sales' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <HeartHandshake size={14} /> Pós-Venda
                  </button>
                </div>

                {/* SUBTABS HT/LT - Aparece com animação de slide quando 'sales' está selecionado */}
                <div className={`flex bg-slate-50 p-1 rounded-xl border border-slate-200 gap-1 transition-all duration-300 ease-out origin-left ${currentPipeline === 'sales'
                  ? 'opacity-100 scale-x-100 max-w-[280px]'
                  : 'opacity-0 scale-x-0 max-w-0 overflow-hidden'
                  }`}>
                  <button
                    onClick={() => handleSubPipelineChange('high_ticket')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${salesSubPipeline === 'high_ticket'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                      : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                  >
                    <Layers size={12} /> High Ticket
                  </button>
                  <button
                    onClick={() => handleSubPipelineChange('low_ticket')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${salesSubPipeline === 'low_ticket'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    <Layers size={12} /> Low Ticket
                  </button>
                </div>
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
            const totalValue = stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

            return (
              <KanbanColumn
                key={stage.id}
                id={stage.id}
                name={stage.name}
                color={stage.color}
                count={stageLeads.length}
                totalValue={totalValue}
                onAddLead={() => handleOpenLeadModal(stage.id)}
                actionButtons={
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingStageId(stage.id)}
                      className="p-2 text-slate-400 hover:text-slate-900 transition-all rounded-xl hover:bg-slate-100"
                      aria-label="Editar Etapa"
                    >
                      <Edit2 size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => removeStage(e, stage.id)}
                      className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all rounded-xl shadow-sm border border-rose-100/50"
                      aria-label="Excluir Coluna"
                    >
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </>
                }
                editorPanel={editingStageId === stage.id && (
                  <div
                    ref={editRef}
                    className="absolute top-14 right-0 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-[80] p-6"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-2 block">Nome da Etapa</label>
                        <input
                          autoFocus
                          type="text"
                          value={stage.name}
                          onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-2 block">Cor</label>
                        <div className="flex flex-wrap gap-2">
                          {COLORS.map((c) => (
                            <button
                              key={c.name}
                              onClick={() => updateStage(stage.id, { color: c.name as any })}
                              className={`w-7 h-7 rounded-full transition-all relative border-2 ${stage.color === c.name
                                ? 'border-slate-900 scale-110 shadow-lg'
                                : 'border-transparent hover:scale-110'
                                } ${c.bg}`}
                              aria-label={`Cor ${c.name}`}
                            >
                              {stage.color === c.name && <div className="absolute inset-0 flex items-center justify-center text-white"><Plus size={10} strokeWidth={4} /></div>}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingStageId(null)}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all hover:bg-blue-700"
                      >
                        Pronto
                      </button>
                    </div>
                  </div>
                )}
              >
                {stageLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => toast.info('Detalhes do lead em breve!')}
                    agentName={lead.assignedUser?.name}
                  />
                ))}
              </KanbanColumn>
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
          <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-blue-500 cursor-grabbing scale-105">
            {/* Company + Value */}
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                {activeLead.company || 'Sem empresa'}
              </span>
              {activeLead.estimatedValue && activeLead.estimatedValue > 0 && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(activeLead.estimatedValue)}
                </span>
              )}
            </div>
            {/* Name */}
            <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-2">{activeLead.name}</h3>
            {/* Tags */}
            {activeLead.tags && activeLead.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {activeLead.tags.slice(0, 2).map((tag, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{tag}</span>
                ))}
              </div>
            )}
            {/* Source */}
            {activeLead.source && (
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{activeLead.source}</span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Kanban;
