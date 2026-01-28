/**
 * Supabase API - Barrel Re-export
 * 
 * This file maintains backward compatibility by re-exporting all functions
 * from the modular API structure in src/services/api/
 * 
 * For new code, consider importing directly from the domain modules:
 * - import { supabaseGetLeads } from '@/services/api/leads'
 * - import { supabaseGetUsers } from '@/services/api/users'
 * 
 * Or from the barrel file:
 * - import { supabaseGetLeads, supabaseGetUsers } from '@/services/api'
 */

// Re-export everything from the modular API
export * from './api';
