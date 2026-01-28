import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, Edit2, LogOut, Eye, ArrowLeft, Trash2, Filter, X } from 'lucide-react';
import { Agent, BoardStageConfig } from '../types';
import LeadModal from './LeadModal';
import Lead360Modal from './Lead360Modal';
import ProjectDetailModal from './ProjectDetailModal';
// Removed api.ts import - fully migrated to supabaseApi.ts
import {
  supabaseGetLeads,
  supabaseUpdateLeadStage,
  supabaseUpdateLead,
  Lead,
  supabaseGetPipelineStages,
  getProjects,
  updateProjectStatus,
  Project
} from '../services/supabaseApi';
import { toast } from 'sonner';
import { useFirebase } from '../contexts/FirebaseContext';
import LeadCard from './kanban/LeadCard';
import KanbanColumn from './kanban/KanbanColumn';
import KanbanSidebar from './kanban/KanbanSidebar';
import { SECTORS } from '../config/permissions';
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
  // Route params for board navigation
  const { userId, sectorId } = useParams<{ userId?: string; sectorId?: string }>();

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Lead 360 Modal State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLead360Open, setIsLead360Open] = useState(false);

  // Project Detail Modal State (for production pipeline)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);

  // User board filter
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Get current user from supabase auth session storage
  const getCurrentUser = (): { id: string; role: string } | null => {
    try {
      const session = localStorage.getItem('supabase_session');
      if (session) {
        const parsed = JSON.parse(session);
        return { id: parsed.user?.id, role: parsed.user?.user_metadata?.role || 'admin' };
      }
    } catch { /* ignore */ }
    return null;
  };
  const currentUser = getCurrentUser();

  const navigate = useNavigate();

  // Determine board title based on route context
  const boardTitle = useMemo(() => {
    if (monitoredUser) return `Board: ${monitoredUser.name}`;
    if (sectorId) {
      const sector = SECTORS.find(s => s.id === sectorId);
      return sector ? `${sector.label} - Visão do Setor` : 'Setor';
    }
    if (userId) {
      // Will be updated when we know the user's name
      return 'Board do Usuário';
    }
    return 'Pipeline Master';
  }, [monitoredUser, sectorId, userId]);

  // Quick Action Handlers for LeadCard
  const handleOpenChat = (lead: Lead) => {
    // Navigate to inbox with lead ID to open their conversation
    navigate(`/inbox?leadId=${lead.id}`);
  };

  const handleScheduleTask = (lead: Lead) => {
    // Open the lead in Lead360Modal on tasks/activities tab
    setSelectedLead(lead);
    setIsLead360Open(true);
    toast.info(`Agendar tarefa para ${lead.name}`);
  };

  const handleMoreOptions = (lead: Lead) => {
    // For now, open the Lead360Modal - can be expanded to dropdown menu later
    setSelectedLead(lead);
    setIsLead360Open(true);
  };

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [kanbanFilters, setKanbanFilters] = useState({
    source: '',
    valueMin: '',
    valueMax: '',
    dateRange: '' as '' | '7d' | '30d' | '90d',
    hasNotes: '' as '' | 'yes' | 'no'
  });

  // Filtered leads based on search and filters
  const displayLeads = useMemo(() => {
    const now = new Date();
    return leads
      .filter(l => {
        // User board filter (filter by assignedTo)
        if (selectedUserId && l.assignedTo !== selectedUserId) return false;
        // Text search
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchesSearch = l.name.toLowerCase().includes(term) ||
            l.email?.toLowerCase().includes(term) ||
            l.company?.toLowerCase().includes(term) ||
            l.phone?.includes(term);
          if (!matchesSearch) return false;
        }
        // Source filter
        if (kanbanFilters.source && l.source !== kanbanFilters.source) return false;
        // Value filters
        if (kanbanFilters.valueMin && (l.estimatedValue || 0) < parseFloat(kanbanFilters.valueMin)) return false;
        if (kanbanFilters.valueMax && (l.estimatedValue || 0) > parseFloat(kanbanFilters.valueMax)) return false;
        // Date range filter
        if (kanbanFilters.dateRange) {
          const createdAt = new Date(l.createdAt);
          const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          if (kanbanFilters.dateRange === '7d' && diffDays > 7) return false;
          if (kanbanFilters.dateRange === '30d' && diffDays > 30) return false;
          if (kanbanFilters.dateRange === '90d' && diffDays > 90) return false;
        }
        // Has notes filter
        if (kanbanFilters.hasNotes === 'yes' && !l.notes) return false;
        if (kanbanFilters.hasNotes === 'no' && l.notes) return false;
        return true;
      });
  }, [leads, searchTerm, kanbanFilters, selectedUserId]);

  // Get unique sources for filter dropdown with counts
  const sourceFiltersWithCounts = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    leads.forEach(l => {
      if (l.source) {
        sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
      }
    });
    return Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  const uniqueSources = useMemo(() => {
    return [...new Set(leads.filter(l => l.source).map(l => l.source as string))];
  }, [leads]);

  // Pipeline counts for sidebar
  const pipelineCounts = useMemo(() => ({
    high_ticket: allSalesLeads.filter(l => l.pipeline === 'high_ticket').length,
    low_ticket: allSalesLeads.filter(l => l.pipeline === 'low_ticket').length,
    production: currentPipeline === 'production' ? leads.length : 0,
    post_sales: currentPipeline === 'post_sales' ? leads.length : 0,
  }), [allSalesLeads, leads, currentPipeline]);

  // Count active filters
  const activeFilterCount = Object.values(kanbanFilters).filter(v => v !== '').length;

  const clearKanbanFilters = () => {
    setKanbanFilters({ source: '', valueMin: '', valueMax: '', dateRange: '', hasNotes: '' });
  };

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
  const { subscribeToNewLeads, subscribeToLeadUpdates } = useFirebase();

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
            supabaseGetLeads({ pipeline: 'high_ticket' }),
            supabaseGetLeads({ pipeline: 'low_ticket' })
          ]);
          let allSales = [...htData, ...ltData];

          // Filter by route params (userId or monitoredUser)
          if (userId) {
            allSales = allSales.filter(l => l.assignedAgentId === userId);
          } else if (monitoredUser) {
            allSales = allSales.filter(l => l.assignedAgentId === monitoredUser.id);
          }

          setAllSalesLeads(allSales);
          setProjects([]); // Clear projects when on sales
        } else if (currentPipeline === 'production') {
          // For production: fetch projects instead of leads
          let projectsData = await getProjects();

          // Filter by route params
          if (userId) {
            projectsData = projectsData.filter(p => p.assignedTo === userId);
          } else if (monitoredUser) {
            projectsData = projectsData.filter(p => p.assignedTo === monitoredUser.id);
          }

          setProjects(projectsData);

          // Convert projects to Lead-like format for display in existing cards
          const projectsAsLeads: Lead[] = projectsData.map(p => ({
            id: p.id,
            name: p.name,
            email: '',
            phone: '',
            company: p.lead?.company || '',
            source: 'project',
            pipeline: 'production' as any,
            statusHT: p.status, // Use status for production kanban columns
            statusLT: undefined,
            estimatedValue: 0,
            notes: p.notes,
            createdAt: p.createdAt,
            tags: p.deadline ? [`📅 ${new Date(p.deadline).toLocaleDateString('pt-BR')}`] : [],
            assignedAgentId: p.assignedTo,
            assignee: p.assignee
          }));

          setLeads(projectsAsLeads);
          setAllSalesLeads([]);
        } else {
          // For post_sales: just fetch that pipeline
          const pipelineType = getApiPipelineType(currentPipeline);
          let data = await supabaseGetLeads({ pipeline: pipelineType });

          // Filter by route params
          if (userId) {
            data = data.filter(l => l.assignedAgentId === userId);
          } else if (monitoredUser) {
            data = data.filter(l => l.assignedAgentId === monitoredUser.id);
          }

          setLeads(data);
          setAllSalesLeads([]);
          setProjects([]);
        }
      } catch (error) {
        console.error('Failed to load leads', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLeads();
  }, [currentPipeline, monitoredUser, userId, sectorId]);

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
    const fetchStages = async () => {
      if (monitoredUser) {
        setBoardStages(monitoredUser.boardConfig || PIPELINE_TEMPLATES.high_ticket);
        return;
      }

      try {
        const pipelineType = currentPipeline === 'sales' ? salesSubPipeline : currentPipeline;
        const data = await supabaseGetPipelineStages(pipelineType);
        if (data && data.length > 0) {
          setBoardStages(data as BoardStageConfig[]);
        } else {
          // Fallback to static if no dynamic stages found (e.g. before seed)
          setBoardStages(PIPELINE_TEMPLATES[pipelineType as keyof typeof PIPELINE_TEMPLATES]);
        }
      } catch (error) {
        console.error("Failed to fetch stages", error);
        setBoardStages(PIPELINE_TEMPLATES[currentPipeline === 'sales' ? salesSubPipeline : currentPipeline as keyof typeof PIPELINE_TEMPLATES]);
      }
    };

    fetchStages();
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
        // Use transactional endpoint with audit log
        const pipelineType = currentPipeline === 'sales' ? salesSubPipeline : currentPipeline as any;
        await supabaseUpdateLeadStage(leadId, newStatus, pipelineType);
        toast.success('Etapa atualizada');
      } catch (error) {
        console.error('Failed to update stage', error);
        toast.error('Erro ao atualizar etapa');
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

            <div className="flex items-center gap-3 w-full xl:w-auto">
              <div className="relative flex-1 xl:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-rose-600/50 transition-all shadow-inner"
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative p-3.5 rounded-2xl border transition-all ${activeFilterCount > 0
                  ? 'bg-violet-100 border-violet-300 text-violet-700'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                  }`}
              >
                <Filter size={18} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleOpenLeadModal()}
                className="flex-shrink-0 bg-rose-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={18} strokeWidth={3} /> Novo Registro
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-700">Filtros</span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearKanbanFilters}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <X size={12} /> Limpar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Source */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Origem</label>
                  <select
                    value={kanbanFilters.source}
                    onChange={(e) => setKanbanFilters(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Todas</option>
                    {uniqueSources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>

                {/* Value Range */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Valor Mín</label>
                  <input
                    type="number"
                    placeholder="R$ 0"
                    value={kanbanFilters.valueMin}
                    onChange={(e) => setKanbanFilters(prev => ({ ...prev, valueMin: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Valor Máx</label>
                  <input
                    type="number"
                    placeholder="R$ ∞"
                    value={kanbanFilters.valueMax}
                    onChange={(e) => setKanbanFilters(prev => ({ ...prev, valueMax: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Período</label>
                  <select
                    value={kanbanFilters.dateRange}
                    onChange={(e) => setKanbanFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Todos</option>
                    <option value="7d">7 dias</option>
                    <option value="30d">30 dias</option>
                    <option value="90d">90 dias</option>
                  </select>
                </div>

                {/* Results */}
                <div className="flex items-end">
                  <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm">
                    <span className="font-bold text-slate-700">{displayLeads.length}</span>
                    <span className="text-slate-400 ml-1">/ {leads.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* MAIN CONTENT: Sidebar + Board */}
        <div className="flex-1 flex overflow-hidden">
          {/* Pipeline Sidebar */}
          {!monitoredUser && (
            <KanbanSidebar
              currentPipeline={currentPipeline}
              salesSubPipeline={salesSubPipeline}
              onPipelineChange={handlePipelineChange}
              onSubPipelineChange={handleSubPipelineChange}
              pipelineCounts={pipelineCounts}
              sourceFilters={sourceFiltersWithCounts}
              activeSourceFilter={kanbanFilters.source}
              onSourceFilterChange={(source) => setKanbanFilters(prev => ({ ...prev, source }))}
              currentUser={currentUser}
              selectedUserId={selectedUserId}
              onUserFilterChange={setSelectedUserId}
            />
          )}

          {/* BOARD CANVAS */}
          <div className="flex-1 overflow-x-auto p-10 flex gap-8 items-start no-scrollbar bg-slate-50/50">
            {boardStages.map((stage) => {
              const stageLeads = displayLeads.filter(l => l.statusHT === stage.id || l.statusLT === stage.id);
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
                      onClick={() => { setSelectedLead(lead); setIsLead360Open(true); }}
                      onOpenChat={handleOpenChat}
                      onSchedule={handleScheduleTask}
                      onMoreOptions={handleMoreOptions}
                      agentName={lead.assignee?.name}
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
        </div>

        <LeadModal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          initialStage={activeStageForLead}
          onSave={handleSaveLead}
        />

        {/* Lead 360 Modal */}
        <Lead360Modal
          isOpen={isLead360Open}
          lead={selectedLead}
          onClose={() => { setIsLead360Open(false); setSelectedLead(null); }}
          onUpdateLead={async (updates) => {
            if (!selectedLead) return;
            await supabaseUpdateLead(selectedLead.id, updates as any);
            setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, ...updates } as Lead : l));
          }}
        />

        {/* Project Detail Modal (for production pipeline) */}
        <ProjectDetailModal
          isOpen={isProjectDetailOpen}
          project={selectedProject}
          onClose={() => { setIsProjectDetailOpen(false); setSelectedProject(null); }}
          onUpdate={(updatedProject) => {
            // Update the project in local state and refresh leads display
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            // Also update the leads-like display
            setLeads(prev => prev.map(l => {
              if (l.id === updatedProject.id) {
                return {
                  ...l,
                  name: updatedProject.name,
                  statusHT: updatedProject.status,
                  tags: updatedProject.deadline ? [`📅 ${new Date(updatedProject.deadline).toLocaleDateString('pt-BR')}`] : []
                } as Lead;
              }
              return l;
            }));
          }}
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
