/**
 * Projects API
 * 
 * CRUD operations for production projects.
 * Projects are created when leads are "sent to production" after closing.
 */

import { supabase } from '../../lib/supabase';
import { Project, CreateProjectData, UpdateProjectData, ProjectStatus } from '../../types/project';

// Transform snake_case to camelCase
function transformProject(row: any): Project {
    return {
        id: row.id,
        name: row.name,
        leadId: row.lead_id,
        driveLink: row.drive_link,
        deadline: row.deadline,
        status: row.status as ProjectStatus,
        assignedTo: row.assigned_to,
        checklist: row.checklist || [],
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        assignee: row.users ? {
            id: row.users.id,
            name: row.users.name,
            avatar: row.users.avatar
        } : undefined,
        lead: row.leads ? {
            id: row.leads.id,
            name: row.leads.name,
            company: row.leads.company
        } : undefined
    };
}

/**
 * Get all projects with optional filtering
 */
export async function getProjects(filters?: {
    assignedTo?: string;
    status?: ProjectStatus;
    leadId?: string;
}): Promise<Project[]> {
    let query = supabase
        .from('projects')
        .select(`
      *,
      users:assigned_to (id, name, avatar),
      leads:lead_id (id, name, company)
    `)
        .order('created_at', { ascending: false });

    if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
    }
    if (filters?.status) {
        query = query.eq('status', filters.status);
    }
    if (filters?.leadId) {
        query = query.eq('lead_id', filters.leadId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }

    return (data || []).map(transformProject);
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase
        .from('projects')
        .select(`
      *,
      users:assigned_to (id, name, avatar),
      leads:lead_id (id, name, company)
    `)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error fetching project:', error);
        throw error;
    }

    return data ? transformProject(data) : null;
}

/**
 * Create a new project
 */
export async function createProject(data: CreateProjectData): Promise<Project> {
    const { data: project, error } = await supabase
        .from('projects')
        .insert({
            name: data.name,
            lead_id: data.leadId,
            drive_link: data.driveLink,
            deadline: data.deadline,
            assigned_to: data.assignedTo,
            notes: data.notes,
            checklist: data.checklist || [],
            status: 'backlog'
        })
        .select(`
      *,
      users:assigned_to (id, name, avatar),
      leads:lead_id (id, name, company)
    `)
        .single();

    if (error) {
        console.error('Error creating project:', error);
        throw error;
    }

    return transformProject(project);
}

/**
 * Update a project
 */
export async function updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.driveLink !== undefined) updateData.drive_link = data.driveLink;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;
    if (data.checklist !== undefined) updateData.checklist = data.checklist;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { data: project, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select(`
      *,
      users:assigned_to (id, name, avatar),
      leads:lead_id (id, name, company)
    `)
        .single();

    if (error) {
        console.error('Error updating project:', error);
        throw error;
    }

    return transformProject(project);
}

/**
 * Update project status (convenience method for drag-and-drop)
 */
export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<void> {
    const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating project status:', error);
        throw error;
    }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}
