import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Get these values from: Supabase Dashboard > Settings > API
// Trim values to remove any whitespace that might be added by build systems
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// Debug: Log if environment variables are missing (only in development)
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Config Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING'
  })
}

// Validate that we have the required values
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!', {
    VITE_SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing'
  })
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ Invalid Supabase URL format. Must start with https://')
}

// Validate key format (JWT should start with 'eyJ')
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.error('❌ Invalid Supabase Key format. JWT tokens should start with "eyJ"')
}

// Supabase client options for better CORS handling
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
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '')
}
