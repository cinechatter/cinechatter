// Check auth.users table directly
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

console.log('🔍 Checking auth.users...\n')

async function checkAuthUsers() {
  try {
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.log('❌ Not authenticated or error:', userError.message)
    } else if (user) {
      console.log('✅ Current authenticated user:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅ YES' : '❌ NO'}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log('')

      // Now check if this user exists in users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.log('❌ User NOT found in users table!')
        console.log('   Error:', profileError.message)
        console.log('\n💡 This means the trigger did not create the user record.')
        console.log('\n🔧 Let me create the user record manually...\n')

        // Create the user record manually
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            is_admin: true,
            email_verified: user.email_confirmed_at ? true : false
          })
          .select()
          .single()

        if (insertError) {
          console.log('❌ Failed to create user record:', insertError.message)
        } else {
          console.log('✅ User record created successfully!')
          console.log('   ID:', newProfile.id)
          console.log('   Email:', newProfile.email)
          console.log('   Is Admin: ✅ YES')
        }
      } else {
        console.log('✅ User found in users table:')
        console.log(`   ID: ${profile.id}`)
        console.log(`   Email: ${profile.email}`)
        console.log(`   Name: ${profile.name}`)
        console.log(`   Is Admin: ${profile.is_admin ? '✅ YES' : '❌ NO'}`)
        console.log(`   Email Verified: ${profile.email_verified ? '✅ YES' : '❌ NO'}`)

        if (!profile.is_admin) {
          console.log('\n⚠️  User exists but is NOT admin. Setting as admin...')
          const { error: updateError } = await supabase
            .from('users')
            .update({ is_admin: true })
            .eq('id', user.id)

          if (updateError) {
            console.log('❌ Failed to set admin:', updateError.message)
          } else {
            console.log('✅ User set as admin!')
          }
        }
      }
    } else {
      console.log('❌ No authenticated user found')
      console.log('\n💡 You need to login first or create an account')
    }
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

checkAuthUsers()
