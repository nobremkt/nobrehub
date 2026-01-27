// Supabase Client Configuration for Nobre Hub
// Primary data source for all persistent data and authentication

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xedfkizltrervaltuzrx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZGZraXpsdHJlcnZhbHR1enJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODAyNDIsImV4cCI6MjA4MzU1NjI0Mn0.FzURRgpYo7VlVo4-pHoEBLn2S3sO7jqDYrza5DqkiWw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Helper function to get current session
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session;
}

// Helper function to get current user
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting user:', error);
        return null;
    }
    return user;
}

// Auth event listener
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
}

// Debug helper
console.log('🗄️ Supabase initialized:', { url: supabaseUrl });
