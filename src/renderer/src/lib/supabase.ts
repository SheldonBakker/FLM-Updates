/* eslint-disable prettier/prettier */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

const getSupabaseCredentials = async (): Promise<{
  supabaseUrl: string;
  supabaseAnonKey: string;
}> => {
  try {
    // Try to get credentials from the main process first
    const credentials = await window.getCredentials()
    return {
      supabaseUrl: credentials.supabaseUrl,
      supabaseAnonKey: credentials.supabaseAnonKey
    }
  } catch (error) {
    // Fallback to environment variables
    return {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    }
  }
}

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