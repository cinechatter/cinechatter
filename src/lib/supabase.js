import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Get these values from: Supabase Dashboard > Settings > API
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// Validate configuration in development
if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('❌ Supabase configuration missing! Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
}

// Supabase client options
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}
