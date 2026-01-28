/**
 * Production Page
 * 
 * Shows production projects in a list format.
 * - Producers see only their own projects
 * - Admins/Managers/Post-Sales see a sidebar with all producers to navigate
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    CheckCircle,
    Clock,
    Calendar,
    User,
    Loader2,
    Users,
    ListFilter,
    AlertTriangle,
    CheckCheck,
    RefreshCw,
    Search,
    X,
    Building2,
    FileText,
    HardDrive
} from 'lucide-react';
import { toast } from 'sonner';

import { getProjects, updateProject } from '../services/api/projects';
import { supabaseGetUsers } from '../services/supabaseApi';
import { Project, ProjectStatus, PROJECT_STATUS_CONFIG } from '../types/project';

// Tabs configuration
type TabId = 'todos' | 'alteracoes' | 'finalizados';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'todos', label: 'Todos', icon: <ListFilter size={16} /> },
    { id: 'alteracoes', label: 'Alterações', icon: <AlertTriangle size={16} /> },
    { id: 'finalizados', label: 'Finalizados', icon: <CheckCheck size={16} /> },
];

// Roles that can see the producer sidebar
const SUPERVISOR_ROLES = ['admin', 'strategic', 'manager_production', 'post_sales'];

// MOCK_PROJECTS removed to use real data

// Get current user from localStorage
const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

const ProductionPage: React.FC = () => {
    const currentUser = getCurrentUser();
    const userRole = currentUser?.role || 'production';
    const userId = currentUser?.id || '';

    const isSupervisor = SUPERVISOR_ROLES.includes(userRole);

    // State
    const [activeTab, setActiveTab] = useState<TabId>('todos');
    const [projects, setProjects] = useState<Project[]>([]);
    const [producers, setProducers] = useState<{ id: string; name: string }[]>([]);
    const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [priorityIds, setPriorityIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [allProjects, setAllProjects] = useState<Project[]>([]); // For supervisor universal search
    const [seenProjectIds, setSeenProjectIds] = useState<Record<TabId, Set<string>>>(() => {
        // Load from local storage
        try {
            const saved = localStorage.getItem('nobrehub_seen_projects');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    todos: new Set(parsed.todos),
                    alteracoes: new Set(parsed.alteracoes),
                    finalizados: new Set(parsed.finalizados),
                };
            }
        } catch (e) {
            console.error('Failed to load seen projects', e);
        }
        return {
            todos: new Set(),
            alteracoes: new Set(),
            finalizados: new Set(),
        };
    });
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Fetch producers (for sidebar)
    useEffect(() => {
        if (isSupervisor) {
            supabaseGetUsers()
                .then((users) => {
                    const productionUsers = users.filter(
                        (u: any) => u.role === 'production' || u.role === 'manager_production'
                    );
                    setProducers(productionUsers.map((u: any) => ({ id: u.id, name: u.name })));
                })
                .catch((err) => {
                    console.error('Failed to fetch producers:', err);
                });
        }
    }, [isSupervisor]);

    // Fetch projects
    const fetchProjects = async () => {
        setIsRefreshing(true);
        try {
            const targetUserId = isSupervisor ? (selectedProducerId || undefined) : userId;
            const data = await getProjects(targetUserId ? { assignedTo: targetUserId } : undefined);
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
            setProjects([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    // Fetch all projects for supervisor universal search
    const fetchAllProjectsForSearch = async () => {
        if (!isSupervisor) return;
        try {
            const data = await getProjects(); // No filter - get all
            setAllProjects(data);
        } catch (error) {
            console.error('Failed to fetch all projects for search:', error);
            setAllProjects([]);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [selectedProducerId, isSupervisor, userId]);

    // Save seen projects to local storage
    useEffect(() => {
        const toSave = {
            todos: Array.from(seenProjectIds.todos),
            alteracoes: Array.from(seenProjectIds.alteracoes),
            finalizados: Array.from(seenProjectIds.finalizados),
        };
        localStorage.setItem('nobrehub_seen_projects', JSON.stringify(toSave));
    }, [seenProjectIds]);

    // Fetch all projects once for supervisor search
    useEffect(() => {
        if (isSupervisor) {
            fetchAllProjectsForSearch();
        }
    }, [isSupervisor]);

    // Filter projects based on active tab
    const filteredProjects = useMemo(() => {
        let filtered: Project[] = [];
        switch (activeTab) {
            case 'todos':
                // Show only active work: Aguardando and Em Produção
                filtered = projects.filter(p => ['backlog', 'doing'].includes(p.status));
                break;
            case 'alteracoes':
                // Show only revision (Alteração)
                filtered = projects.filter(p => p.status === 'revision');
                break;
            case 'finalizados':
                // Show review (Revisão) and done (Entregue)
                filtered = projects.filter(p => ['review', 'done'].includes(p.status));
                break;
            default:
                filtered = projects;
        }

        // Sort: priority items first, then by createdAt desc
        return filtered.sort((a, b) => {
            const aPriority = priorityIds.has(a.id) ? 1 : 0;
            const bPriority = priorityIds.has(b.id) ? 1 : 0;
            if (aPriority !== bPriority) return bPriority - aPriority;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [projects, activeTab, priorityIds]);

    // Count projects per tab
    const tabCounts = useMemo(() => ({
        todos: projects.filter(p => ['backlog', 'doing'].includes(p.status)).length,
        alteracoes: projects.filter(p => p.status === 'revision').length,
        finalizados: projects.filter(p => ['review', 'done'].includes(p.status)).length,
    }), [projects]);

    // Check for unseen projects in each tab
    const hasUnseenProjects = useMemo(() => {
        const getProjectIdsForTab = (tabId: TabId) => {
            switch (tabId) {
                case 'todos':
                    return projects.filter(p => ['backlog', 'doing'].includes(p.status)).map(p => p.id);
                case 'alteracoes':
                    return projects.filter(p => p.status === 'revision').map(p => p.id);
                case 'finalizados':
                    return projects.filter(p => ['review', 'done'].includes(p.status)).map(p => p.id);
                default:
                    return [];
            }
        };

        return {
            todos: getProjectIdsForTab('todos').some(id => !seenProjectIds.todos.has(id)),
            alteracoes: getProjectIdsForTab('alteracoes').some(id => !seenProjectIds.alteracoes.has(id)),
            finalizados: getProjectIdsForTab('finalizados').some(id => !seenProjectIds.finalizados.has(id)),
        };
    }, [projects, seenProjectIds]);

    // Mark all projects in a tab as seen
    const markTabAsSeen = (tabId: TabId) => {
        const getProjectIdsForTab = () => {
            switch (tabId) {
                case 'todos':
                    return projects.filter(p => ['backlog', 'doing'].includes(p.status)).map(p => p.id);
                case 'alteracoes':
                    return projects.filter(p => p.status === 'revision').map(p => p.id);
                case 'finalizados':
                    return projects.filter(p => ['review', 'done'].includes(p.status)).map(p => p.id);
                default:
                    return [];
            }
        };

        setSeenProjectIds(prev => ({
            ...prev,
            [tabId]: new Set([...prev[tabId], ...getProjectIdsForTab()]),
        }));
    };

    // Handle tab change - mark as seen
    const handleTabChange = (tabId: TabId) => {
        setActiveTab(tabId);
        markTabAsSeen(tabId);
    };

    // Mark current tab as seen on initial load
    useEffect(() => {
        if (!isLoading && projects.length > 0) {
            markTabAsSeen(activeTab);
        }
    }, [isLoading, projects]);

    // Search results for dropdown (different logic for producers vs supervisors)
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase().trim();

        // For supervisors: search ALL projects across all producers
        // For producers: search only their own projects
        const projectsToSearch = isSupervisor ? allProjects : projects;

        const results = projectsToSearch.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.lead?.name?.toLowerCase().includes(query) ||
            p.lead?.company?.toLowerCase().includes(query)
        ).slice(0, 8); // Limit to 8 results

        return results;
    }, [searchQuery, isSupervisor, allProjects, projects]);

    // Get tab name from status
    const getTabFromStatus = (status: ProjectStatus): TabId => {
        if (['backlog', 'doing'].includes(status)) return 'todos';
        if (status === 'revision') return 'alteracoes';
        return 'finalizados';
    };

    // Handle search result click
    const handleSearchResultClick = (project: Project) => {
        if (isSupervisor && project.assignedTo) {
            // Navigate to the producer and correct tab
            setSelectedProducerId(project.assignedTo);
        }
        setActiveTab(getTabFromStatus(project.status));
        setSearchQuery('');
        setIsSearchFocused(false);
    };

    // Handle status change
    const handleStartProject = async (project: Project) => {
        try {
            await updateProject(project.id, { status: 'doing' });
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'doing' as ProjectStatus } : p));
            toast.success(`Projeto "${project.name}" iniciado!`);
        } catch (error) {
            toast.error('Erro ao iniciar projeto');
        }
    };

    const handleFinishProject = async (project: Project) => {
        try {
            await updateProject(project.id, { status: 'review' });
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'review' as ProjectStatus } : p));
            toast.success(`Projeto "${project.name}" enviado para revisão!`);
        } catch (error) {
            toast.error('Erro ao finalizar projeto');
        }
    };

    // Handle priority toggle (for supervisors)
    const handleSetPriority = (projectId: string) => {
        setPriorityIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
                toast.success('Prioridade removida');
            } else {
                newSet.add(projectId);
                toast.success('Projeto marcado como prioridade máxima!');
            }
            return newSet;
        });
    };

    // Handle deliver project (for supervisors - changes review to done)
    const handleDeliverProject = async (project: Project) => {
        try {
            await updateProject(project.id, { status: 'done' });
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: 'done' as ProjectStatus } : p));
            // Remove priority when delivered
            setPriorityIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(project.id);
                return newSet;
            });
            toast.success(`Projeto "${project.name}" marcado como entregue!`);
        } catch (error) {
            toast.error('Erro ao entregar projeto');
        }
    };

    // Get the display name for selected producer
    const selectedProducerName = selectedProducerId
        ? producers.find(p => p.id === selectedProducerId)?.name || 'Produtor'
        : 'Todos os Produtores';

    return (
        <div className="h-dvh flex bg-slate-50">
            {/* Sidebar - Only for supervisors */}
            {isSupervisor && (
                <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Users size={14} />
                            Produtores
                        </h2>
                    </div>
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        <button
                            onClick={() => setSelectedProducerId(null)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedProducerId === null
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            Todos
                        </button>
                        {producers.map((producer) => (
                            <button
                                key={producer.id}
                                onClick={() => setSelectedProducerId(producer.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedProducerId === producer.id
                                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {producer.name}
                            </button>
                        ))}
                        {producers.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-4">
                                Nenhum produtor encontrado
                            </p>
                        )}
                    </nav>
                </aside>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                                Produção
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                {isSupervisor ? selectedProducerName : 'Meus Projetos'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Search Bar with Dropdown */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={16} />
                                <input
                                    type="text"
                                    placeholder={isSupervisor ? "Buscar em todos os produtores..." : "Buscar projeto..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                    className="pl-10 pr-4 py-2.5 bg-slate-100 border-0 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white w-72 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                                    >
                                        ×
                                    </button>
                                )}

                                {/* Dropdown Results */}
                                {isSearchFocused && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-80 overflow-y-auto">
                                        {searchResults.map((project) => {
                                            const statusConfig = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.backlog;
                                            const tabName = getTabFromStatus(project.status) === 'todos' ? 'Todos'
                                                : getTabFromStatus(project.status) === 'alteracoes' ? 'Alterações'
                                                    : 'Finalizados';
                                            const producerName = isSupervisor
                                                ? producers.find(p => p.id === project.assignedTo)?.name || 'Sem produtor'
                                                : null;

                                            return (
                                                <button
                                                    key={project.id}
                                                    onClick={() => handleSearchResultClick(project)}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-slate-900 truncate text-sm">
                                                                {project.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {project.lead?.name || 'Sem cliente'}
                                                                {isSupervisor && producerName && (
                                                                    <span className="text-rose-500 ml-2">• {producerName}</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusConfig.bgColor} ${statusConfig.color}`}>
                                                                {statusConfig.label}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 uppercase font-medium">
                                                                {tabName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* No results message */}
                                {isSearchFocused && searchQuery.trim() && searchResults.length === 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
                                        <p className="text-sm text-slate-500 text-center">Nenhum projeto encontrado</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={fetchProjects}
                                disabled={isRefreshing}
                                className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {TABS.map((tab) => {
                            const count = tabCounts[tab.id];
                            const hasUnseen = hasUnseenProjects[tab.id] && activeTab !== tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {/* Notification dot for unseen projects */}
                                    {hasUnseen && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                                    )}
                                    {tab.icon}
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[10px] font-black ${activeTab === tab.id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-300 text-slate-600'
                                            }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </header>

                {/* Project List */}
                <div className="flex-1 overflow-y-auto p-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="animate-spin text-slate-400" size={32} />
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <CheckCircle size={48} className="mb-4 opacity-30" />
                            <p className="text-sm font-bold uppercase tracking-widest">Nenhum projeto nesta lista</p>
                        </div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            {filteredProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    canEdit={userRole === 'production' || userRole === 'manager_production'}
                                    isSupervisor={isSupervisor}
                                    isPriority={priorityIds.has(project.id)}
                                    onStart={() => handleStartProject(project)}
                                    onFinish={() => handleFinishProject(project)}
                                    onSetPriority={() => handleSetPriority(project.id)}
                                    onDeliver={() => handleDeliverProject(project)}
                                    onClick={() => setSelectedProject(project)}
                                />
                            ))}
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Project Detail Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedProject(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-start justify-between p-6 border-b border-slate-100">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${PROJECT_STATUS_CONFIG[selectedProject.status]?.bgColor} ${PROJECT_STATUS_CONFIG[selectedProject.status]?.color}`}>
                                            {PROJECT_STATUS_CONFIG[selectedProject.status]?.label}
                                        </span>
                                        {priorityIds.has(selectedProject.id) && (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1">
                                                <AlertTriangle size={10} />
                                                Prioridade
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                        {selectedProject.name}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {/* Client Info */}
                                <div className="mb-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                                        Cliente
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <User size={16} className="text-slate-400" />
                                            <span className="font-semibold text-slate-700">
                                                {selectedProject.lead?.name || 'Sem cliente'}
                                            </span>
                                        </div>
                                        {selectedProject.lead?.company && (
                                            <div className="flex items-center gap-3">
                                                <Building2 size={16} className="text-slate-400" />
                                                <span className="text-slate-600">
                                                    {selectedProject.lead.company}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Drive Link */}
                                {selectedProject.driveLink && (
                                    <div className="mb-6">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                                            Arquivos
                                        </h3>
                                        <a
                                            href={selectedProject.driveLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 hover:bg-blue-100 hover:border-blue-200 transition-all group"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="bg-white rounded-lg p-2 shadow-sm group-hover:scale-110 transition-transform">
                                                <HardDrive size={20} className="text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-blue-900 text-sm">Pasta do Projeto</p>
                                                <p className="text-blue-700 text-xs truncate max-w-[300px] hover:underline">
                                                    {selectedProject.driveLink}
                                                </p>
                                            </div>
                                        </a>
                                    </div>
                                )}

                                {/* Dates */}
                                <div className="mb-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                                        Datas
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <p className="text-xs text-slate-400 mb-1">Criado em</p>
                                            <p className="font-semibold text-slate-700">
                                                {new Date(selectedProject.createdAt).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className={`rounded-xl p-4 ${selectedProject.deadline && new Date(selectedProject.deadline) < new Date() && selectedProject.status !== 'done'
                                            ? 'bg-red-50 border border-red-200'
                                            : 'bg-slate-50'
                                            }`}>
                                            <p className="text-xs text-slate-400 mb-1">Prazo de entrega</p>
                                            <p className={`font-semibold ${selectedProject.deadline && new Date(selectedProject.deadline) < new Date() && selectedProject.status !== 'done'
                                                ? 'text-red-600'
                                                : 'text-slate-700'
                                                }`}>
                                                {selectedProject.deadline
                                                    ? new Date(selectedProject.deadline).toLocaleDateString('pt-BR', {
                                                        day: '2-digit',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })
                                                    : 'Sem prazo definido'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedProject.notes && (
                                    <div className="mb-6">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                                            Observações
                                        </h3>
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <FileText size={16} className="text-slate-400 mt-0.5" />
                                                <p className="text-slate-600 text-sm leading-relaxed">
                                                    {selectedProject.notes}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Checklist */}
                                {selectedProject.checklist && selectedProject.checklist.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                                            Checklist
                                        </h3>
                                        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                                            {selectedProject.checklist.map((item, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${item.completed
                                                        ? 'bg-emerald-500 border-emerald-500'
                                                        : 'border-slate-300'
                                                        }`}>
                                                        {item.completed && (
                                                            <CheckCircle size={12} className="text-white" />
                                                        )}
                                                    </div>
                                                    <span className={`text-sm ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                        {item.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50">
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => setSelectedProject(null)}
                                        className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Project Card Component
const ProjectCard: React.FC<{
    project: Project;
    canEdit: boolean;
    isSupervisor: boolean;
    isPriority: boolean;
    onStart: () => void;
    onFinish: () => void;
    onSetPriority: () => void;
    onDeliver: () => void;
    onClick: () => void;
}> = ({ project, canEdit, isSupervisor, isPriority, onStart, onFinish, onSetPriority, onDeliver, onClick }) => {
    const statusConfig = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.backlog;

    const isActionable = canEdit && (project.status === 'backlog' || project.status === 'doing');
    const showStartButton = canEdit && project.status === 'backlog';
    const showFinishButton = canEdit && project.status === 'doing';
    const showPriorityButton = isSupervisor && !canEdit && ['backlog', 'doing', 'revision'].includes(project.status);
    const showDeliverButton = isSupervisor && project.status === 'review';

    const formatDeadline = (deadline?: string) => {
        if (!deadline) return 'Sem prazo';
        const date = new Date(deadline);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'done';

    // Determine card style based on priority and overdue status
    const getCardStyle = () => {
        if (isPriority && isOverdue) {
            return 'bg-gradient-to-r from-amber-50/60 to-red-50/40 border-amber-300';
        }
        if (isPriority) {
            return 'bg-amber-50/60 border-amber-300';
        }
        if (isOverdue) {
            return 'bg-red-50/40 border-red-200';
        }
        return 'bg-white border-slate-100';
    };

    return (
        <div
            onClick={onClick}
            className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer ${getCardStyle()}`}
        >
            {/* Gradient overlay for priority items */}
            {isPriority && (
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-amber-400/30 to-transparent pointer-events-none" />
            )}
            {/* Gradient overlay for overdue items */}
            {isOverdue && !isPriority && (
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-red-500/20 to-transparent pointer-events-none" />
            )}
            {/* Right-side red accent when both priority and overdue */}
            {isOverdue && isPriority && (
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-red-400/20 to-transparent pointer-events-none" />
            )}
            <div className="flex items-center justify-between gap-4 relative z-10">
                {/* Left side - Project info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-bold truncate text-base ${isPriority ? 'text-amber-900' : isOverdue ? 'text-red-900' : 'text-slate-900'
                            }`}>
                            {project.name}
                        </h3>
                        {/* Status Pill */}
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                        </span>
                        {/* Priority Badge */}
                        {isPriority && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1">
                                <AlertTriangle size={10} />
                                Prioridade
                            </span>
                        )}
                        {/* Overdue Badge */}
                        {isOverdue && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500 text-white flex items-center gap-1">
                                <Clock size={10} />
                                Atrasado
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <User size={12} />
                            {project.lead?.name || 'Sem cliente'}
                        </span>
                        <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                            <Calendar size={12} />
                            {formatDeadline(project.deadline)}
                        </span>
                    </div>
                </div>

                {/* Right side - Action Buttons */}
                <div className="flex-shrink-0">
                    {/* Producer buttons */}
                    {isActionable && (
                        <>
                            {showStartButton && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStart();
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                >
                                    <Play size={14} fill="currentColor" />
                                    Iniciar
                                </button>
                            )}
                            {showFinishButton && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFinish();
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    <CheckCircle size={14} />
                                    Finalizar
                                </button>
                            )}
                        </>
                    )}
                    {/* Supervisor priority button */}
                    {showPriorityButton && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSetPriority();
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${isPriority
                                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                }`}
                        >
                            <AlertTriangle size={14} />
                            {isPriority ? 'Remover Prioridade' : 'Aumentar Prioridade'}
                        </button>
                    )}
                    {/* Supervisor deliver button (only for review status) */}
                    {showDeliverButton && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeliver();
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <CheckCircle size={14} />
                            Entregar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductionPage;
