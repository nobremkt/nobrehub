/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - PROJECT DETAIL
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Visualização detalhada do projeto selecionado com tarefas avançadas.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus,
    Trash2,
    FolderOpen,
    Users,
    User,
    UserPlus,
    CalendarDays,
    ListPlus,
} from 'lucide-react';
import { Checkbox, Input, Button, Dropdown, ConfirmModal, Badge, Switch } from '@/design-system';
import { useStrategicProjectsStore } from '../../stores/useStrategicProjectsStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useAuthStore } from '@/stores';
import { ProjectTask, TaskPriority } from '../../types';
import { STRATEGIC_SECTOR_ID } from '../../services/StrategicProjectsService';
import styles from './ProjectDetail.module.css';

// Priority dropdown options with colored icons
const PRIORITY_OPTIONS = [
    { label: 'Baixa', value: 'low', icon: <span className={styles.priorityDot} style={{ backgroundColor: '#22c55e' }} /> },
    { label: 'Média', value: 'medium', icon: <span className={styles.priorityDot} style={{ backgroundColor: '#eab308' }} /> },
    { label: 'Alta', value: 'high', icon: <span className={styles.priorityDot} style={{ backgroundColor: '#f97316' }} /> },
    { label: 'Urgente', value: 'urgent', icon: <span className={styles.priorityDot} style={{ backgroundColor: '#dc2626' }} /> },
];

interface TaskItemProps {
    task: ProjectTask;
    projectId: string;
    members: { id: string; name: string; profilePhotoUrl?: string }[];
    isSubTask?: boolean;
    subTaskCount?: number;
    subTaskCompleted?: number;
    onAddSubTask?: (parentId: string) => void;
}
// Predefined color palette for tags
const TAG_COLORS = [
    '#dc2626', '#ea580c', '#d97706', '#16a34a',
    '#0891b2', '#2563eb', '#7c3aed', '#db2777',
];

// Due date status calculator
type DueDateStatus = 'overdue' | 'today' | 'upcoming' | 'future' | null;
function getDueDateStatus(dueDate: Date | null | undefined): DueDateStatus {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff <= 3) return 'upcoming';
    return 'future';
}

function TaskItem({ task, projectId, members, isSubTask, subTaskCount, subTaskCompleted, onAddSubTask }: TaskItemProps) {
    const { toggleTaskCompletion, updateTask, deleteTask } = useStrategicProjectsStore();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTagCreator, setShowTagCreator] = useState(false);
    const [showAssigneePicker, setShowAssigneePicker] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const [assigneePickerPos, setAssigneePickerPos] = useState({ top: 0, left: 0 });
    const addBtnRef = useRef<HTMLButtonElement>(null);
    const assigneeBtnRef = useRef<HTMLButtonElement>(null);

    // Parse assigneeIds (support single or multiple)
    const assigneeIds: string[] = task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []);

    // Get assigned members with their data
    const assignedMembers = members.filter(m => assigneeIds.includes(m.id));

    const handlePriorityChange = async (value: string | number) => {
        await updateTask(projectId, task.id, { priority: value as TaskPriority });
    };

    const handleToggleAssignee = async (memberId: string) => {
        console.log('Toggling assignee:', memberId);
        console.log('Current assigneeIds:', assigneeIds);

        const newIds = assigneeIds.includes(memberId)
            ? assigneeIds.filter(id => id !== memberId)
            : [...assigneeIds, memberId];

        console.log('New assigneeIds:', newIds);

        // Build update data - only include assigneeId if there are assignees
        const updateData: { assigneeIds: string[]; assigneeId?: string | null } = {
            assigneeIds: newIds,
        };
        if (newIds.length > 0) {
            updateData.assigneeId = newIds[0];
        } else {
            updateData.assigneeId = null; // Explicitly clear assigneeId
        }

        console.log('Sending update:', updateData);
        await updateTask(projectId, task.id, updateData);
    };

    const handleAddTag = async () => {
        if (!newTagName.trim()) return;
        const tagValue = `${newTagName.trim()}|${newTagColor}`;
        const newTags = [...task.tags, tagValue];
        await updateTask(projectId, task.id, { tags: newTags });
        setNewTagName('');
        setNewTagColor(TAG_COLORS[0]);
        setShowTagCreator(false);
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        const newTags = task.tags.filter(t => t !== tagToRemove);
        await updateTask(projectId, task.id, { tags: newTags });
    };

    const confirmDelete = async () => {
        await deleteTask(projectId, task.id);
        setShowDeleteConfirm(false);
    };

    const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const newDate = value ? new Date(value + 'T12:00:00') : null;
        await updateTask(projectId, task.id, { dueDate: newDate });
    };

    // Format date for input
    const formattedDueDate = task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : '';
    const dueDateStatus = getDueDateStatus(task.dueDate);

    // Parse tag format: "name|color" or just "name"
    const parseTag = (tag: string) => {
        const [name, color] = tag.split('|');
        return { name, color: color || '#666' };
    };

    return (
        <div className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : ''} ${isSubTask ? styles.subTask : ''}`}>
            <Checkbox
                checked={task.completed}
                onChange={() => toggleTaskCompletion(projectId, task.id)}
            />

            <span className={styles.taskTitle}>{task.title}</span>

            {/* Tags Display with Add Button */}
            <div className={styles.taskTags}>
                {task.tags.map(tag => {
                    const { name, color } = parseTag(tag);
                    return (
                        <Badge
                            key={tag}
                            content={name}
                            customColor={color}
                            onRemove={() => handleRemoveTag(tag)}
                        />
                    );
                })}

                {/* Add Tag Button */}
                <div className={styles.addTagWrapper}>
                    <button
                        ref={addBtnRef}
                        className={styles.addTagBtn}
                        onClick={() => {
                            if (!showTagCreator && addBtnRef.current) {
                                const rect = addBtnRef.current.getBoundingClientRect();
                                setTooltipPos({
                                    top: rect.bottom + window.scrollY + 4,
                                    left: rect.left + window.scrollX
                                });
                            }
                            setShowTagCreator(!showTagCreator);
                        }}
                        title="Adicionar tag"
                    >
                        +
                    </button>
                </div>

            </div>

            {/* Tag Creator Portal */}
            {showTagCreator && createPortal(
                <div
                    className={styles.tagCreatorPortal}
                    style={{ top: tooltipPos.top, left: tooltipPos.left }}
                >
                    <div className={styles.tagCreator}>
                        <Input
                            placeholder="Nome da tag..."
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            size="sm"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTag();
                                if (e.key === 'Escape') setShowTagCreator(false);
                            }}
                        />
                        <div className={styles.colorPicker}>
                            {TAG_COLORS.map(color => (
                                <button
                                    key={color}
                                    className={`${styles.colorOption} ${newTagColor === color ? styles.colorSelected : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewTagColor(color)}
                                />
                            ))}
                        </div>
                        <div className={styles.tagActions}>
                            <Button variant="ghost" size="sm" onClick={() => setShowTagCreator(false)}>
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleAddTag}>
                                Adicionar
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Priority Dropdown */}
            <div className={styles.dropdownWrapper}>
                <Dropdown
                    options={PRIORITY_OPTIONS}
                    value={task.priority}
                    onChange={handlePriorityChange}
                    placeholder="Prioridade"
                    noSound
                />
            </div>

            {/* Due Date Picker */}
            <div className={`${styles.dueDatePicker} ${dueDateStatus ? styles[`dueDate${dueDateStatus.charAt(0).toUpperCase() + dueDateStatus.slice(1)}`] : ''}`}>
                <CalendarDays size={14} className={styles.dueDateIcon} />
                <input
                    type="date"
                    className={styles.dueDateInput}
                    value={formattedDueDate}
                    onChange={handleDueDateChange}
                    title={dueDateStatus === 'overdue' ? 'Atrasado!' : dueDateStatus === 'today' ? 'Vence hoje!' : dueDateStatus === 'upcoming' ? 'Próximo...' : 'Definir prazo'}
                />
            </div>

            {/* Assignee Picker */}
            <div className={styles.assigneePicker}>
                {/* Assigned Avatars */}
                {assignedMembers.length > 0 && (
                    <div className={styles.avatarStack}>
                        {assignedMembers.slice(0, 3).map(member => (
                            <div
                                key={member.id}
                                className={styles.avatar}
                                title={member.name}
                            >
                                {member.profilePhotoUrl ? (
                                    <img src={member.profilePhotoUrl} alt={member.name} />
                                ) : (
                                    <span>{member.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        ))}
                        {assignedMembers.length > 3 && (
                            <div className={styles.avatarMore}>
                                +{assignedMembers.length - 3}
                            </div>
                        )}
                    </div>
                )}

                {/* Add/Edit Assignee Button */}
                <button
                    ref={assigneeBtnRef}
                    className={styles.assigneeBtn}
                    onClick={() => {
                        if (!showAssigneePicker && assigneeBtnRef.current) {
                            const rect = assigneeBtnRef.current.getBoundingClientRect();
                            setAssigneePickerPos({
                                top: rect.bottom + window.scrollY + 4,
                                left: rect.right + window.scrollX - 200 // Align right edge (200px menu width)
                            });
                        }
                        setShowAssigneePicker(!showAssigneePicker);
                    }}
                    title="Atribuir pessoas"
                >
                    <UserPlus size={14} />
                </button>
            </div>

            {/* Assignee Picker Portal */}
            {showAssigneePicker && createPortal(
                <div
                    className={styles.assigneePickerPortal}
                    style={{ top: assigneePickerPos.top, left: assigneePickerPos.left }}
                >
                    <div className={styles.assigneePickerMenu}>
                        <div className={styles.assigneePickerHeader}>Atribuir a:</div>
                        {members.length === 0 ? (
                            <div className={styles.noMembers}>Nenhum membro disponível</div>
                        ) : (
                            members.map(member => (
                                <div
                                    key={member.id}
                                    className={styles.assigneeOption}
                                    onClick={() => handleToggleAssignee(member.id)}
                                >
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={assigneeIds.includes(member.id)}
                                            onChange={() => handleToggleAssignee(member.id)}
                                            noSound
                                        />
                                    </div>
                                    <div className={styles.assigneeAvatar}>
                                        {member.profilePhotoUrl ? (
                                            <img src={member.profilePhotoUrl} alt={member.name} />
                                        ) : (
                                            <span>{member.name.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <span>{member.name}</span>
                                </div>
                            ))
                        )}
                        <button
                            className={styles.assigneePickerClose}
                            onClick={() => setShowAssigneePicker(false)}
                        >
                            Fechar
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Sub-Task Count Badge */}
            {!isSubTask && subTaskCount !== undefined && subTaskCount > 0 && (
                <span className={styles.subTaskBadge} title={`${subTaskCompleted}/${subTaskCount} sub-tarefas concluídas`}>
                    {subTaskCompleted}/{subTaskCount}
                </span>
            )}

            {/* Add Sub-Task Button (only for parent tasks) */}
            {!isSubTask && onAddSubTask && (
                <button
                    className={styles.addSubTaskBtn}
                    onClick={() => onAddSubTask(task.id)}
                    title="Adicionar sub-tarefa"
                >
                    <ListPlus size={14} />
                </button>
            )}

            {/* Delete Button */}
            <button
                className={styles.deleteBtn}
                onClick={() => setShowDeleteConfirm(true)}
                title="Excluir tarefa"
            >
                <Trash2 size={14} />
            </button>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Excluir tarefa"
                description={`Deseja realmente excluir a tarefa "${task.title}"?`}
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </div>
    );
}

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
                            // Group tasks: parent tasks first, then render sub-tasks under each parent
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
