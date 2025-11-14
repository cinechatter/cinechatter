// Simple environment variable checker
import { config } from 'dotenv'

config()

console.log('🔍 Checking your .env file...\n')

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

console.log('VITE_SUPABASE_URL:', url || '❌ NOT SET')
console.log('VITE_SUPABASE_ANON_KEY:', key ? `✅ SET (${key.substring(0, 20)}...)` : '❌ NOT SET')

if (!url || !key) {
  console.log('\n❌ Error: Environment variables not configured properly')
  process.exit(1)
}

// Decode JWT to see project reference
if (key) {
  try {
    const parts = key.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      console.log('\n📋 JWT Token Info:')
      console.log('   Issuer:', payload.iss)
      console.log('   Project ref:', payload.ref)
      console.log('   Role:', payload.role)

      if (payload.ref) {
        console.log('\n💡 Your Supabase URL should be:')
        console.log(`   https://${payload.ref}.supabase.co`)

        if (url !== `https://${payload.ref}.supabase.co`) {
          console.log('\n⚠️  WARNING: Your .env URL does not match the JWT token!')
          console.log(`   Current URL:  ${url}`)
          console.log(`   Expected URL: https://${payload.ref}.supabase.co`)
        }
      }
    }
  } catch (e) {
    console.log('\n⚠️  Could not decode JWT token')
  }
}

console.log('\n📝 To fix:')
console.log('1. Go to: https://supabase.com/dashboard')
console.log('2. Select your project')
console.log('3. Go to: Settings > API')
console.log('4. Copy the EXACT "Project URL" shown there')
console.log('5. Update your .env file with that URL')
console.log('6. Make sure there are NO extra characters or spaces\n')
