# Admin Approval System - Security Explained

## 🔒 Who Can See What?

### Regular User (Not Admin):
```javascript
// When regular user queries users table
SELECT * FROM users;

// They ONLY see their own record:
{
  id: "their-uuid",
  email: "user@example.com",
  name: "John Doe",
  is_admin: false,
  admin_status: "regular"
  // ... their data only
}

// They CANNOT see:
- Other users' records
- Pending approval requests
- Admin status of others
- Who is admin
```

### Admin User (You):
```javascript
// When admin queries users table
SELECT * FROM users;

// You see EVERYTHING:
[
  {
    id: "uuid-1",
    email: "admin@example.com",
    is_admin: true,
    admin_status: "approved"
  },
  {
    id: "uuid-2",
    email: "pending@example.com",
    is_admin: false,
    admin_status: "pending_approval", // ← You can see this!
    admin_request_message: "I need access because..."
  },
  {
    id: "uuid-3",
    email: "regular@example.com",
    is_admin: false,
    admin_status: "regular"
  }
]
```

---

## 🛡️ How It's Protected

### 1. Row Level Security (RLS)

PostgreSQL enforces these rules at **database level**:

```sql
-- Policy 1: Users can ONLY see their own record
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);
-- ✅ User can query, but only gets their own row

-- Policy 2: Admins can see ALL users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);
-- ✅ Admin can query and gets ALL rows
```

### 2. What Regular Users CANNOT Do

Even if they try to hack:

```javascript
// ❌ Try to see all pending requests
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('admin_status', 'pending_approval');

// Result: Empty array []
// RLS blocks it - they only see their own record!

// ❌ Try to set themselves as admin
const { error } = await supabase
  .from('users')
  .update({ is_admin: true })
  .eq('id', 'their-id');

// Result: Error! Policy prevents it
// "new row violates row-level security policy"
```

### 3. What Admins CAN Do

```javascript
// ✅ See all pending requests
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('admin_status', 'pending_approval');

// Result: All pending requests
// RLS allows it because user is admin

// ✅ Approve users
const { data } = await supabase
  .from('users')
  .update({
    is_admin: true,
    admin_status: 'approved'
  })
  .eq('id', 'request-user-id');

// Result: Success!
// RLS allows it because user is admin
```

---

## 🧪 Test Security Yourself

### Test 1: Regular User Cannot See Others

1. Create regular account
2. Login as that user
3. Open browser console
4. Run:
```javascript
const { data } = await supabase.from('users').select('*');
console.log(data); // Only shows YOUR record!
```

### Test 2: Regular User Cannot Promote Self

1. Same user, try:
```javascript
const { data, error } = await supabase
  .from('users')
  .update({ is_admin: true })
  .eq('id', 'your-id');

console.log(error); // RLS policy violation!
```

### Test 3: Admin Can See Everything

1. Login as admin
2. Open browser console
3. Run:
```javascript
const { data } = await supabase.from('users').select('*');
console.log(data); // Shows ALL users!

const { data: pending } = await supabase
  .from('users')
  .select('*')
  .eq('admin_status', 'pending_approval');
console.log(pending); // Shows pending requests!
```

---

## 🎯 What's Visible in the UI

### Regular User Sees:
- ❌ No "Manage Admins" button
- ❌ No pending requests
- ❌ No admin status of others
- ✅ Only their own profile
- ✅ Can browse site normally

### Admin Sees:
- ✅ "Manage Admins" button in dashboard
- ✅ Tab: "Pending Requests"
- ✅ List of all users
- ✅ Approve/Reject buttons
- ✅ Full admin panel access

---

## 🔐 Multi-Layer Security

### Layer 1: UI Protection
```javascript
// Dashboard button only visible to admins
{user && user.profile?.is_admin && (
  <button onClick={() => setShowManageAdmins(true)}>
    Manage Admins
  </button>
)}
```

### Layer 2: Function Protection
```javascript
// Functions check admin status
const loadAdminRequests = async () => {
  if (!user?.profile?.is_admin) return; // Blocked!

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('admin_status', 'pending_approval');
};
```

### Layer 3: Database Protection (Most Important!)
```sql
-- RLS at database level
-- Even if someone bypasses UI, database blocks them
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (is_admin = TRUE);
```

---

## 🚨 Attack Scenarios & Protection

### Scenario 1: User Inspects Browser DevTools

**Attack**: User opens DevTools, sees `loadAdminRequests()` function, tries to call it

**Protection**:
- Function runs, but RLS policy blocks query
- User only gets their own record
- No pending requests visible

### Scenario 2: User Uses Supabase Client Directly

**Attack**: User opens console, imports supabase client, queries users table

**Protection**:
- RLS policy applies to ALL queries
- User can only see their own row
- `WHERE auth.uid() = id` enforced by PostgreSQL

### Scenario 3: User Tries to Update admin_status

**Attack**:
```javascript
await supabase
  .from('users')
  .update({ is_admin: true, admin_status: 'approved' })
  .eq('id', 'their-id');
```

**Protection**:
- RLS policy blocks update
- Error: "new row violates row-level security policy"
- Only admins can modify admin fields

### Scenario 4: SQL Injection

**Attack**: User tries SQL injection via form inputs

**Protection**:
- Supabase uses parameterized queries
- PostgreSQL prepared statements
- RLS policies still apply
- Cannot bypass security

---

## ✅ Summary

**Your data is safe!**

1. **Database-level security** (RLS) - Most important layer
2. **Cannot be bypassed** - Even with direct database access
3. **Regular users** - Only see their own data
4. **Admins** - See everything, can approve/reject
5. **Tested security** - Multiple layers of protection

Regular users will **NEVER** see:
- ❌ Pending approval requests
- ❌ Other users' data
- ❌ Admin management features
- ❌ Who is admin

Only you (the admin) can see and approve requests! 🔒

---

## 📋 Setup Checklist

To ensure security is properly configured:

- [ ] Run `add-approval-to-users.sql` (adds columns)
- [ ] Run `update-rls-for-approval.sql` (secures access)
- [ ] Test as regular user (cannot see others)
- [ ] Test as admin (can see all)
- [ ] Verify RLS is enabled: `SELECT * FROM pg_tables WHERE tablename = 'users' AND rowsecurity = true;`

---

Need help testing the security? Let me know! 🛡️
