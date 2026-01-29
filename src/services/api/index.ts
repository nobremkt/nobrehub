// API Barrel File - Re-exports all domain modules
// Import from this file for clean imports: import { supabaseGetLeads } from '@/services/api'

// Types
export type { Lead, CreateLeadData, DashboardStats, User, LossReason, Conversation, Deal, PipelineType } from '../../types/models';
export type { Project, CreateProjectData, UpdateProjectData, ProjectStatus, ChecklistItem } from '../../types/project';

// Leads API
export {
    supabaseGetLeads,
    supabaseGetLead,
    supabaseCreateLead,
    supabaseUpdateLead,
    supabaseUpdateLeadStatus,
    supabaseDeleteLead,
    supabaseUpdateLeadStage,
    supabaseGetAllTags,
    supabaseUpdateLeadTags,
    supabaseMarkLeadAsLost,
    supabaseGetLossReasons,
    supabaseAssignLead,
    type StageChangeResult
} from './leads';

// Dashboard API
export { supabaseGetDashboardStats } from './dashboard';

// Users API
export {
    supabaseGetUsers,
    supabaseGetUser,
    supabaseGetAvailableAgents
} from './users';

// Conversations API
export {
    supabaseGetActiveConversations,
    supabaseGetConversation,
    supabaseGetConversationByLead,
    supabaseUpdateConversation,
    supabaseCloseConversation,
    supabaseHoldConversation,
    supabaseResumeConversation,
    supabaseTransferConversation
} from './conversations';

// Miscellaneous APIs
export {
    // Deals
    supabaseGetDeals,
    supabaseCreateDeal,
    supabaseUpdateDeal,
    supabaseDeleteDeal,
    supabaseGetLeadDeals,
    // Products
    supabaseGetProducts,
    supabaseCreateProduct,
    supabaseUpdateProduct,
    supabaseDeleteProduct,
    type Product,
    // Pipeline Stages
    supabaseGetPipelineStages,
    supabaseCreatePipelineStage,
    supabaseUpdatePipelineStage,
    supabaseDeletePipelineStage,
    supabaseReorderPipelineStages,
    type PipelineStage,
    // Sectors
    supabaseGetSectors,
    supabaseUpdateSector,
    supabaseDeleteSector,
    supabaseGetSectorsWithCount,
    supabaseCreateSector,
    type Sector,
    // Organization
    supabaseGetOrganization,
    supabaseUpdateOrganization,
    type Organization,
    // Notification Preferences
    supabaseGetNotificationPreferences,
    supabaseUpdateNotificationPreferences,
    type NotificationPreferences,
    // WhatsApp
    supabaseSendWhatsAppMessage,
    supabaseSendWhatsAppTemplate,
    supabaseGetWhatsAppTemplates,
    // Messages
    supabaseGetMessages,
    // User Management
    supabaseCreateUser,
    supabaseUpdateUser,
    supabaseDeactivateUser,
    supabaseGetUsersWithSector,
    // Lead Details
    supabaseGetLeadConversations,
    supabaseGetLeadHistory,
    // Scheduled Messages
    supabaseCreateScheduledMessage,
    type ScheduledMessage,
    // Permissions
    supabaseGetPermissions,
    supabaseUpdatePermissions,
    type RoleAccess,
    // Channels
    supabaseGetChannels,
    supabaseCreateChannel,
    supabaseUpdateChannel,
    supabaseToggleChannel,
    supabaseDeleteChannel,
    type Channel,
    // Custom Fields
    supabaseGetCustomFields,
    supabaseGetCustomFieldValues,
    supabaseSetCustomFieldValue,
    supabaseCreateCustomField,
    supabaseDeleteCustomField,
    type CustomField,
    // Activities
    supabaseGetLeadActivities,
    supabaseCreateActivity,
    supabaseCompleteActivity,
    supabaseSkipActivity,
    type Activity
} from './misc';

// Projects API
export {
    getProjects,
    getProject,
    createProject,
    updateProject,
    updateProjectStatus,
    deleteProject
} from './projects';
