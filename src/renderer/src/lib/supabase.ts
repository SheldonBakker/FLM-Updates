/* eslint-disable prettier/prettier */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

const getSupabaseCredentials = async (): Promise<{
  supabaseUrl: string;
  supabaseAnonKey: string;
}> => {
  try {
    // Try electron API first
    if (window.electronAPI) {
      const credentials = await window.electronAPI.getCredentials();
      if (credentials) {
        return credentials as { supabaseUrl: string; supabaseAnonKey: string };
      }
    }

    // Fallback to environment variables
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
      };
    }

    throw new Error('No credentials available');
  } catch (error) {
    console.error('Failed to get credentials:', error);
    throw new Error('Database authentication failed');
  }
};

export const initializeSupabase = async (): Promise<SupabaseClient> => {
  if (supabaseInstance) return supabaseInstance

  const { supabaseUrl, supabaseAnonKey } = await getSupabaseCredentials()
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Database credentials required')
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    throw new Error('Database not initialized')
  }
  return supabaseInstance
} 