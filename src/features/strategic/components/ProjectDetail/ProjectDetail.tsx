/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - PROJECT DETAIL
 * TaskItem extracted to TaskItem.tsx. This is the project detail view.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    FolderOpen,
    Users,
    User,
} from 'lucide-react';
import { Input, Button, ConfirmModal, Switch } from '@/design-system';
import { useStrategicProjectsStore } from '../../stores/useStrategicProjectsStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useAuthStore } from '@/stores';
import { STRATEGIC_SECTOR_ID } from '@/config/constants';
import styles from './ProjectDetail.module.css';
import { TaskItem } from './TaskItem';

export function ProjectDetail() {
    const {
        selectedProjectId,
        getSelectedProject,
        getFilteredTasks,
        getProjectProgress,
        subscribeToProjectTasks,
        createTask,
        deleteProject,
        taskFilter,
        setTaskFilter,
    } = useStrategicProjectsStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();
    const user = useAuthStore(state => state.user);

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);
    const [addingSubTaskFor, setAddingSubTaskFor] = useState<string | null>(null);
    const [subTaskTitle, setSubTaskTitle] = useState('');

    const project = getSelectedProject();
    const tasks = getFilteredTasks();

    // Get strategic members for assignment
    const strategicMembers = collaborators
        .filter(c => c.sectorId === STRATEGIC_SECTOR_ID && c.active)
        .map(c => ({ id: c.id, name: c.name, profilePhotoUrl: c.profilePhotoUrl }));

    // Subscribe to tasks when project changes
    useEffect(() => {
        if (selectedProjectId) {
            subscribeToProjectTasks(selectedProjectId);
            fetchCollaborators();
        }
    }, [selectedProjectId, subscribeToProjectTasks, fetchCollaborators]);

    if (!project) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <FolderOpen size={48} className={styles.emptyIcon} />
                    <h3>Selecione um projeto</h3>
                    <p>Escolha um projeto na sidebar para visualizar os detalhes.</p>
                </div>
            </div>
        );
    }

    const progress = getProjectProgress(project.id);
    const isOwner = project.ownerId === user?.id;

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        await createTask(project.id, { title: newTaskTitle.trim() });
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

    const confirmDeleteProject = async () => {
        await deleteProject(project.id);
        setShowDeleteProjectConfirm(false);
    };

    return (
        <div className={styles.container}>
            {/* Project Header */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <div className={styles.titleRow}>
                        <FolderOpen size={24} className={styles.folderIcon} />
                        <h2 className={styles.title}>{project.title}</h2>
                        {project.isShared ? (
                            <Users size={18} className={styles.sharedIcon} />
                        ) : (
                            <User size={18} className={styles.personalIcon} />
                        )}

                        {/* Show Completed Toggle */}
                        <div className={styles.headerFilter}>
                            <Switch
                                checked={taskFilter.showCompleted}
                                onChange={(checked) => setTaskFilter({ showCompleted: checked })}
                                noSound
                            />
                            <span>Concluídas</span>
                        </div>
                    </div>
                    {project.description && (
                        <p className={styles.description}>{project.description}</p>
                    )}
                </div>

                {isOwner && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteProjectConfirm(true)}
                    >
                        <Trash2 size={16} />
                    </Button>
                )}
            </div>

            {/* Progress */}
            <div className={styles.progressSection}>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progress.percentage}%` }}
                    />
                </div>
                <span className={styles.progressText}>
                    {progress.completed} de {progress.total} tarefas concluídas ({progress.percentage}%)
                </span>
            </div>

            {/* Tasks List */}
            <div className={styles.tasksSection}>
                <div className={styles.tasksSectionHeader}>
                    <h3>Tarefas</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingTask(true)}
                        leftIcon={<Plus size={14} />}
                    >
                        Adicionar
                    </Button>
                </div>


                {/* Add Task Input */}
                {isAddingTask && (
                    <div className={styles.addTaskRow}>
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
                )}

                {/* Tasks */}
                <div className={styles.tasksList}>
                    {tasks.length === 0 ? (
                        <p className={styles.noTasks}>Nenhuma tarefa ainda. Clique em "Adicionar" para criar.</p>
                    ) : (
                        (() => {
                            const parentTasks = tasks.filter(t => !t.parentTaskId);
                            const childTasks = tasks.filter(t => t.parentTaskId);
                            const getSubTasks = (parentId: string) => childTasks.filter(t => t.parentTaskId === parentId);

                            return parentTasks.map(task => {
                                const subTasks = getSubTasks(task.id);
                                return (
                                    <div key={task.id} className={styles.taskGroup}>
                                        <TaskItem
                                            task={task}
                                            projectId={project.id}
                                            members={strategicMembers}
                                            subTaskCount={subTasks.length}
                                            subTaskCompleted={subTasks.filter(st => st.completed).length}
                                            onAddSubTask={(parentId) => {
                                                setAddingSubTaskFor(parentId);
                                                setSubTaskTitle('');
                                            }}
                                        />
                                        {/* Sub-tasks */}
                                        {subTasks.map(subTask => (
                                            <div key={subTask.id} className={styles.subTaskWrapper}>
                                                <TaskItem
                                                    task={subTask}
                                                    projectId={project.id}
                                                    members={strategicMembers}
                                                    isSubTask
                                                />
                                            </div>
                                        ))}
                                        {/* Add Sub-task Input */}
                                        {addingSubTaskFor === task.id && (
                                            <div className={styles.addSubTaskRow}>
                                                <Input
                                                    placeholder="Nome da sub-tarefa..."
                                                    value={subTaskTitle}
                                                    onChange={(e) => setSubTaskTitle(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter' && subTaskTitle.trim()) {
                                                            await createTask(project.id, { title: subTaskTitle.trim(), parentTaskId: task.id });
                                                            setSubTaskTitle('');
                                                            setAddingSubTaskFor(null);
                                                        } else if (e.key === 'Escape') {
                                                            setAddingSubTaskFor(null);
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                                <Button size="sm" onClick={async () => {
                                                    if (subTaskTitle.trim()) {
                                                        await createTask(project.id, { title: subTaskTitle.trim(), parentTaskId: task.id });
                                                        setSubTaskTitle('');
                                                        setAddingSubTaskFor(null);
                                                    }
                                                }}>Adicionar</Button>
                                                <Button variant="ghost" size="sm" onClick={() => setAddingSubTaskFor(null)}>Cancelar</Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()
                    )}
                </div>
            </div>

            {/* Delete Project Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteProjectConfirm}
                onClose={() => setShowDeleteProjectConfirm(false)}
                onConfirm={confirmDeleteProject}
                title="Excluir projeto"
                description={`Deseja realmente excluir o projeto "${project.title}" e todas as suas tarefas?`}
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </div>
    );
}
