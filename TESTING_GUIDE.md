# Testing Guide - Admin Approval Security

## 🚀 Step-by-Step Testing

### STEP 1: Run SQL Scripts (Do This First!)

#### 1a. Add Approval Columns
1. Go to: https://supabase.com/dashboard/project/xpogipevekygeznakfjc/sql
2. Click **"New query"**
3. Copy entire contents of: **`database/add-approval-to-users.sql`**
4. Click **"Run"**
5. Should see: **"Success"** with a verification table

#### 1b. Update Security Policies
1. Still in SQL Editor, click **"New query"** again
2. Copy entire contents of: **`database/update-rls-for-approval.sql`**
3. Click **"Run"**
4. Should see: List of RLS policies

---

### STEP 2: Test as Regular User

#### 2a. Create Test Account
1. Visit: `http://localhost:3000#admin`
2. Modal should appear
3. Fill in:
   - Name: Test User
   - Email: testuser@example.com
   - Password: test123
   - Message: "Testing admin request"
4. Click **"Submit Request"**
5. Should see success message

#### 2b. Verify Account Created
Go to Supabase Table Editor → users table

You should see:
```
email: testuser@example.com
is_admin: FALSE
admin_status: pending_approval
admin_request_message: "Testing admin request"
admin_requested_at: [timestamp]
```

#### 2c. Login as Test User
1. Close modal (X button)
2. Click "Login" in navigation
3. Enter: testuser@example.com / test123
4. Click "Login"

**Expected Result:**
- ✅ Login successful
- ✅ User's name appears in top right
- ❌ NO "Dashboard" button visible (not admin yet!)
- ❌ Cannot access admin features

#### 2d. Test Security - Can User See Others?
1. Open browser console (F12)
2. Paste this:
```javascript
const { data, error } = await supabase.from('users').select('*');
console.log('Data:', data);
console.log('Count:', data?.length);
```

**Expected Result:**
- ✅ `data.length === 1` (only sees themselves)
- ✅ Data only contains testuser@example.com
- ❌ Does NOT see other users
- ❌ Does NOT see pending requests

#### 2e. Test Security - Can User Make Self Admin?
1. Still in console, paste:
```javascript
const { data, error } = await supabase
  .from('users')
  .update({ is_admin: true, admin_status: 'approved' })
  .eq('email', 'testuser@example.com');
console.log('Error:', error);
```

**Expected Result:**
- ✅ Error message about RLS policy violation
- ❌ Update blocked!
- ❌ User is NOT admin

---

### STEP 3: Test as Admin (You)

#### 3a. Login as Existing Admin
1. Logout from test user
2. Login with your admin credentials
3. Should see green **"Dashboard"** button

#### 3b. Access Manage Admins
1. Click "Dashboard"
2. In admin panel, click **"Manage Admins"** (gray button on right)
3. Should see "Manage Admins" modal

#### 3c. Check Pending Requests
In the console, test:
```javascript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('admin_status', 'pending_approval');
console.log('Pending requests:', data);
```

**Expected Result:**
- ✅ Shows testuser@example.com
- ✅ Shows admin_request_message
- ✅ Shows admin_requested_at
- ✅ No error!

#### 3d. Approve the Request

**Option 1: Via Console (Quick Test)**
```javascript
// Get current user (you)
const { data: { user } } = await supabase.auth.getUser();
const adminEmail = user.email;

// Find pending user
const { data: pending } = await supabase
  .from('users')
  .select('*')
  .eq('admin_status', 'pending_approval')
  .single();

console.log('Found pending user:', pending.email);

// Approve
const { data, error } = await supabase
  .from('users')
  .update({
    is_admin: true,
    admin_status: 'approved',
    admin_reviewed_at: new Date().toISOString(),
    admin_reviewed_by: adminEmail
  })
  .eq('id', pending.id);

console.log('Approval result:', { data, error });
```

**Expected Result:**
- ✅ No error
- ✅ User updated successfully

**Option 2: Via UI (After I add it)**
- I'll add a "Pending Requests" tab
- You'll see the request
- Click "Approve" button

#### 3e. Verify Approval
Check users table again:
```sql
SELECT email, is_admin, admin_status, admin_reviewed_by
FROM users
WHERE email = 'testuser@example.com';
```

**Expected Result:**
```
email: testuser@example.com
is_admin: TRUE
admin_status: approved
admin_reviewed_by: your-email@example.com
admin_reviewed_at: [timestamp]
```

---

### STEP 4: Test Approved User

#### 4a. Login as Test User Again
1. Logout from admin
2. Login as testuser@example.com
3. Now should see green **"Dashboard"** button! ✅

#### 4b. Access Admin Panel
1. Click "Dashboard"
2. Should see full admin panel
3. Can access all admin features

---

## ✅ Security Checklist

After testing, verify:

- [ ] Regular user created with `admin_status = 'pending_approval'`
- [ ] Regular user can only see their own record
- [ ] Regular user cannot set themselves as admin
- [ ] Regular user does NOT see "Dashboard" button
- [ ] Admin can see all users
- [ ] Admin can see pending requests
- [ ] Admin can approve requests
- [ ] Approved user becomes admin
- [ ] Approved user can access admin panel
- [ ] RLS policies are enabled and working

---

## 🧪 Advanced Security Tests

### Test 1: Multiple Pending Requests
1. Create 2-3 test accounts via `#admin` modal
2. Login as admin
3. Query: Should see multiple pending requests
```javascript
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('admin_status', 'pending_approval');
console.log('Count:', data.length); // Should be 2-3
```

### Test 2: Rejected User
1. Login as admin
2. Reject a pending request:
```javascript
const { data: pending } = await supabase
  .from('users')
  .select('*')
  .eq('admin_status', 'pending_approval')
  .single();

await supabase
  .from('users')
  .update({
    admin_status: 'rejected',
    rejection_reason: 'Test rejection',
    admin_reviewed_at: new Date().toISOString()
  })
  .eq('id', pending.id);
```

3. User should have `admin_status = 'rejected'`
4. User can still login but is NOT admin

### Test 3: Direct Database Access
1. Try to bypass RLS with service role key
2. RLS should still be enforced for application users
3. Only database admins can bypass RLS

---

## 🐛 Troubleshooting

### Issue: User sees other users in console test

**Cause**: RLS policies not applied

**Fix**: Run `update-rls-for-approval.sql` again

### Issue: Admin cannot see pending requests

**Cause**: Not properly authenticated as admin

**Fix**:
1. Check `is_admin = TRUE` in database
2. Logout and login again
3. Check `user.profile?.is_admin` in console

### Issue: Approval fails

**Cause**: Missing permissions or RLS policy issue

**Fix**: Check console for error message, verify admin status

### Issue: Modal doesn't fit on screen

**Already Fixed**: Modal now has:
- `max-h-[90vh]` - Max height 90% of viewport
- `overflow-y-auto` - Scrollable
- `my-8` - Margin from edges

---

## 📊 Expected Database State After Testing

### users table:
```
| email                      | is_admin | admin_status      |
|----------------------------|----------|-------------------|
| your-admin@example.com     | TRUE     | approved          |
| testuser@example.com       | TRUE     | approved          |
| testuser2@example.com      | FALSE    | pending_approval  |
| testuser3@example.com      | FALSE    | rejected          |
```

---

## 🎯 What's Next

Once security is verified:
1. ✅ System works correctly
2. ✅ Security is enforced
3. ⏳ I'll add the "Pending Requests" tab UI in "Manage Admins"
4. ⏳ You can approve/reject with one click
5. ⏳ (Optional) Email notifications setup

---

Ready to start testing? Let me know when you've run the SQL scripts and I'll help you through each step! 🧪
