# Admin System Implementation Plan

## Overview
Implementing a secure admin system with:
- Dedicated `/admin` route
- Email OTP 2FA authentication
- Admin management screen
- Login attempt tracking

## Step 1: Run Database Schema

**Run this in Supabase SQL Editor:**
```bash
database/add-admin-system.sql
```

This creates:
- `is_admin` column in users table
- `admin_login_attempts` table (security tracking)
- `otp_codes` table (2FA codes)
- Helper functions for OTP generation/verification
- Security policies

## Step 2: Update App.jsx Structure

The app currently uses a simple view system. We need to add routing for `/admin`:

### Current Structure:
```javascript
currentView: 'home' | 'category' | 'search' | 'about' | 'contact' | 'admin'
```

### New Structure:
```javascript
// Add admin-specific states
const [adminRoute, setAdminRoute] = useState('login'); // 'login' | 'otp' | 'dashboard' | 'setup'
const [otpCode, setOtpCode] = useState('');
const [otpSent, setOtpSent] = useState(false);
```

## Step 3: Admin Authentication Flow

```
User visits /admin or types cinechatter.com/admin
    ↓
Check: Is user logged in?
    ↓ NO → Show admin login form
    ↓ YES
    ↓
Check: Is user admin?
    ↓ NO → Show "Access Denied"
    ↓ YES
    ↓
Check: Does user have 2FA enabled?
    ↓ NO → Go to admin dashboard
    ↓ YES → Send OTP to email → Show OTP input
    ↓
User enters OTP → Verify → Admin dashboard
```

## Step 4: Key Features to Implement

### A. Admin Login Screen (`/admin`)
- Email + Password fields
- "Login as Admin" button
- Check if user is admin after login
- If not admin: Show "Access Denied"
- If admin + 2FA: Send OTP

### B. OTP Verification Screen
- 6-digit code input
- "Verify" button
- "Resend Code" button
- Auto-send email with OTP code

### C. First-Time Admin Setup
- If no admins exist in database
- Show "Create First Admin" screen
- Create account → Set as admin automatically

### D. Admin Dashboard (Enhanced)
- Current features (articles, untold stories, etc.)
- **NEW: "Manage Admins" button**

### E. Manage Admins Screen
- List all current admins
- Search user by email
- "Make Admin" button for regular users
- "Remove Admin" button (can't remove yourself)
- Toggle 2FA per admin

## Step 5: Implementation Approach

Given the complexity, I recommend breaking this into phases:

**Phase A (Essential - Today):**
1. Run database schema
2. Add admin check on login
3. Hide/show Dashboard button based on is_admin
4. Protect admin routes

**Phase B (2FA - Next):**
1. Implement OTP generation
2. Send OTP via email
3. Verify OTP before admin access
4. Add "Enable 2FA" toggle in settings

**Phase C (Management - Final):**
1. Admin management screen
2. Promote/demote users
3. View login attempts
4. Security dashboard

## Immediate Next Steps

**Would you like me to:**

**Option 1**: Implement just Phase A first (basic admin authentication without 2FA)
- Remove old admin login with password
- Use Supabase authentication + is_admin check
- Dashboard only visible to admin users
- **Simpler, get it working today**

**Option 2**: Implement full system (A + B + C)
- Complete admin system with 2FA
- All management features
- **More complex, takes more time**

**My Recommendation**: Start with Option 1, test it, then add Phase B and C later.

Which would you prefer?
