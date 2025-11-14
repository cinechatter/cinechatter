// Check if admin user was created
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

console.log('🔍 Checking admin setup...\n')

async function checkAdminSetup() {
  try {
    // Check users table
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching users:', error.message)
      return
    }

    console.log(`✅ Found ${users.length} user(s) in database:\n`)

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Name: ${user.name || 'N/A'}`)
      console.log(`  Is Admin: ${user.is_admin ? '✅ YES' : '❌ NO'}`)
      console.log(`  Email Verified: ${user.email_verified ? '✅ YES' : '❌ NO'}`)
      console.log(`  Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log('')
    })

    // Check for admin users
    const admins = users.filter(u => u.is_admin)
    console.log(`\n📊 Summary:`)
    console.log(`   Total users: ${users.length}`)
    console.log(`   Admin users: ${admins.length}`)

    if (admins.length === 0) {
      console.log('\n⚠️  No admin users found!')
      console.log('\nTo manually set a user as admin:')
      console.log('1. Go to Supabase Dashboard → Table Editor → users')
      console.log('2. Find your user')
      console.log('3. Set is_admin = TRUE')
    }

  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

checkAdminSetup()
