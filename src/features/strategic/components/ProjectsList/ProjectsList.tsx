/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - PROJECTS LIST
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Trash2,
    FolderOpen,
    Users,
    User
} from 'lucide-react';
import { Checkbox, Input, Button } from '@/design-system';
import { useStrategicProjectsStore } from '../../stores/useStrategicProjectsStore';
import { useAuthStore } from '@/stores';
import { StrategicProject } from '../../types';
import styles from './ProjectsList.module.css';

interface ProjectCardProps {
    project: StrategicProject;
}

function ProjectCard({ project }: ProjectCardProps) {
    const {
        tasks,
        subscribeToProjectTasks,
        createTask,
        toggleTaskCompletion,
        deleteTask,
        deleteProject,
        getProjectProgress,
    } = useStrategicProjectsStore();

    const user = useAuthStore((state) => state.user);
    const [isExpanded, setIsExpanded] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);

    // Subscribe to tasks when expanded
    useEffect(() => {
        subscribeToProjectTasks(project.id);
    }, [project.id, subscribeToProjectTasks]);

    const projectTasks = tasks[project.id] || [];
    const progress = getProjectProgress(project.id);
    const isOwner = project.ownerId === user?.id;

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        await createTask(project.id, { title: newTaskTitle });
        setNewTaskTitle('');
        setIsAddingTask(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddTask();
        } else if (e.key === 'Escape') {
            setNewTaskTitle('');
            setIsAddingTask(false);
        }
    };

    return (
        <div className={styles.projectCard}>
            {/* Project Header */}
            <div className={styles.projectHeader}>
                <button
                    className={styles.expandBtn}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                <div className={styles.projectInfo}>
                    <div className={styles.projectTitleRow}>
                        <FolderOpen size={18} className={styles.folderIcon} />
                        <h3 className={styles.projectTitle}>{project.title}</h3>
                        {project.isShared ? (
                            <Users size={14} className={styles.sharedIcon} />
                        ) : (
                            <User size={14} className={styles.personalIcon} />
                        )}
                    </div>

                    {project.description && (
                        <p className={styles.projectDescription}>{project.description}</p>
                    )}

                    {/* Progress Bar */}
                    <div className={styles.progressContainer}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                        <span className={styles.progressText}>
                            {progress.completed}/{progress.total} ({progress.percentage}%)
                        </span>
                    </div>
                </div>

                {/* Delete Button */}
                {isOwner && (
                    <button
                        className={styles.menuBtn}
                        onClick={() => {
                            if (confirm('Excluir este projeto e todas as tarefas?')) {
                                deleteProject(project.id);
                            }
                        }}
                        title="Excluir projeto"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Tasks List */}
            {isExpanded && (
                <div className={styles.tasksList}>
                    {projectTasks.map((task) => (
                        <div key={task.id} className={styles.taskItem}>
                            <Checkbox
                                checked={task.completed}
                                onChange={() => toggleTaskCompletion(project.id, task.id)}
                            />
                            <span className={`${styles.taskTitle} ${task.completed ? styles.completed : ''}`}>
                                {task.title}
                            </span>
                            <button
                                className={styles.deleteTaskBtn}
                                onClick={() => deleteTask(project.id, task.id)}
                                title="Excluir tarefa"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    {/* Add Task Input */}
                    {isAddingTask ? (
                        <div className={styles.addTaskInput}>
                            <Input
                                placeholder="Nome da tarefa..."
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <Button size="sm" onClick={handleAddTask}>
                                Adicionar
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setNewTaskTitle('');
                                    setIsAddingTask(false);
                                }}
                            >
                                Cancelar
                            </Button>
                        </div>
                    ) : (
                        <button
                            className={styles.addTaskBtn}
                            onClick={() => setIsAddingTask(true)}
                        >
                            <Plus size={14} />
                            Adicionar tarefa
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export function ProjectsList() {
    const { getFilteredProjects, isLoading } = useStrategicProjectsStore();
    const projects = getFilteredProjects();

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Carregando projetos...</div>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <FolderOpen size={48} className={styles.emptyIcon} />
                    <h3>Nenhum projeto encontrado</h3>
                    <p>Crie um novo projeto usando o botão "Novo" na sidebar.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.projectsGrid}>
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        </div>
    );
}
