/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - PROJECTS SIDEBAR
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Search, Plus, FolderOpen, Users, User, ChevronRight } from 'lucide-react';
import { Input, Button } from '@/design-system';
import { useStrategicProjectsStore } from '../../stores/useStrategicProjectsStore';
import { useAuthStore } from '@/stores';
import styles from './ProjectsSidebar.module.css';

interface ProjectsSidebarProps {
    onCreateProject: () => void;
}

export function ProjectsSidebar({ onCreateProject }: ProjectsSidebarProps) {
    const {
        projects,
        selectedProjectId,
        searchQuery,
        setSearchQuery,
        selectProject,
    } = useStrategicProjectsStore();

    const user = useAuthStore((state) => state.user);
    const userId = user?.id || '';

    // Categorize projects
    const personalProjects = projects.filter(p => !p.isShared && p.ownerId === userId);
    const sharedProjects = projects.filter(p => p.isShared);

    // Apply search filter
    const filterBySearch = (list: typeof projects) => {
        if (!searchQuery.trim()) return list;
        const query = searchQuery.toLowerCase();
        return list.filter(p =>
            p.title.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
        );
    };

    const filteredPersonal = filterBySearch(personalProjects);
    const filteredShared = filterBySearch(sharedProjects);

    const handleProjectClick = (projectId: string) => {
        selectProject(projectId === selectedProjectId ? null : projectId);
    };

    return (
        <div className={styles.sidebar}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>Projetos</h2>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={onCreateProject}
                    leftIcon={<Plus size={16} />}
                >
                    Novo
                </Button>
            </div>

            {/* Search */}
            <div className={styles.search}>
                <Input
                    placeholder="Buscar projetos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search size={16} />}
                />
            </div>

            {/* Projects List */}
            <div className={styles.projectsList}>
                {/* Personal Projects Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <User size={16} />
                        <span>Meus Projetos</span>
                        <span className={styles.count}>{filteredPersonal.length}</span>
                    </div>
                    <div className={styles.sectionContent}>
                        {filteredPersonal.length === 0 ? (
                            <p className={styles.emptyText}>Nenhum projeto pessoal</p>
                        ) : (
                            filteredPersonal.map((project) => (
                                <button
                                    key={project.id}
                                    className={`${styles.projectItem} ${selectedProjectId === project.id ? styles.selected : ''}`}
                                    onClick={() => handleProjectClick(project.id)}
                                >
                                    <FolderOpen size={16} className={styles.projectIcon} />
                                    <span className={styles.projectTitle}>{project.title}</span>
                                    <ChevronRight size={14} className={styles.chevron} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Shared Projects Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Users size={16} />
                        <span>Compartilhados</span>
                        <span className={styles.count}>{filteredShared.length}</span>
                    </div>
                    <div className={styles.sectionContent}>
                        {filteredShared.length === 0 ? (
                            <p className={styles.emptyText}>Nenhum projeto compartilhado</p>
                        ) : (
                            filteredShared.map((project) => (
                                <button
                                    key={project.id}
                                    className={`${styles.projectItem} ${selectedProjectId === project.id ? styles.selected : ''}`}
                                    onClick={() => handleProjectClick(project.id)}
                                >
                                    <FolderOpen size={16} className={styles.projectIcon} />
                                    <span className={styles.projectTitle}>{project.title}</span>
                                    <ChevronRight size={14} className={styles.chevron} />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
