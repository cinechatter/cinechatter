// Test Supabase Connection
// Run with: node test-db.mjs

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')

// Check if credentials are configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Supabase credentials not found!')
  console.error('\nPlease create a .env file with:')
  console.error('VITE_SUPABASE_URL=https://xxxxx.supabase.co')
  console.error('VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  console.error('\nSee .env.example for reference.')
  process.exit(1)
}

console.log('✅ Credentials found')
console.log(`📍 URL: ${supabaseUrl}\n`)

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('1️⃣  Testing database connection...')

    // Test 1: Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')

    if (categoriesError) {
      console.error('❌ Categories fetch failed:', categoriesError.message)
      console.error('\nMake sure you ran database/schema.sql in Supabase SQL Editor!')
      process.exit(1)
    }

    console.log(`✅ Categories loaded: ${categories.length} categories`)
    console.log('   Categories:', categories.map(c => c.name).join(', '))

    // Test 2: Fetch admin settings
    console.log('\n2️⃣  Testing admin settings...')
    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value, is_public')
      .eq('is_public', true)
      .limit(5)

    if (settingsError) {
      console.error('❌ Settings fetch failed:', settingsError.message)
      process.exit(1)
    }

    console.log(`✅ Settings loaded: ${settings.length} public settings`)
    settings.forEach(s => {
      console.log(`   ${s.setting_key}: ${s.setting_value}`)
    })

    // Test 3: Check articles table
    console.log('\n3️⃣  Testing articles table...')
    const { data: articles, error: articlesError, count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })

    if (articlesError) {
      console.error('❌ Articles table check failed:', articlesError.message)
      process.exit(1)
    }

    console.log(`✅ Articles table accessible (${count || 0} articles)`)

    // Test 4: Check users table
    console.log('\n4️⃣  Testing users table...')
    const { data: users, error: usersError, count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('❌ Users table check failed:', usersError.message)
      process.exit(1)
    }

    console.log(`✅ Users table accessible (${usersCount || 0} users)`)

    // Test 5: Test authentication
    console.log('\n5️⃣  Testing authentication service...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError && authError.message !== 'Auth session missing!') {
      console.error('❌ Auth service failed:', authError.message)
      process.exit(1)
    }

    console.log('✅ Auth service is working')
    if (user) {
      console.log(`   Logged in as: ${user.email}`)
    } else {
      console.log('   No user logged in (expected for test)')
    }

    console.log('\n' + '='.repeat(50))
    console.log('🎉 All tests passed! Supabase is configured correctly.')
    console.log('='.repeat(50))
    console.log('\n✨ Next steps:')
    console.log('   1. Start your dev server: npm run dev')
    console.log('   2. Open http://localhost:3000')
    console.log('   3. Try signing up with the Sign Up button')
    console.log('   4. Check your email for verification link\n')

  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message)
    process.exit(1)
  }
}

// Run tests
testConnection()
