# Quick Fix - Admin Request System

## Issue: "Could not find table 'public.admin_requests'"

**Solution**: You need to create the table first!

---

## 🚀 Fix Steps (2 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/xpogipevekygeznakfjc/sql
2. Click **"New query"**

### Step 2: Run This SQL

Copy and paste the **entire contents** of this file:
```
database/add-admin-approval-system.sql
```

Or copy this directly:

```sql
-- Admin Approval System
CREATE TABLE IF NOT EXISTS admin_requests (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_message TEXT,
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_requests_email ON admin_requests(email);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status);

ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit admin request"
ON admin_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all requests"
ON admin_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

CREATE POLICY "Admins can update requests"
ON admin_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);
```

### Step 3: Click "Run"

You should see: **"Success. No rows returned"**

### Step 4: Test

1. Refresh your app: `http://localhost:3000#admin`
2. Modal should appear (now fits on screen!)
3. Fill form and submit
4. Should work! ✅

---

## ✅ What Was Fixed

1. **Modal Size**:
   - Reduced padding: `p-8` → `p-6`
   - Smaller text sizes
   - Compact form inputs
   - Scrollable if needed: `max-h-[90vh] overflow-y-auto`
   - Added margin: `my-8` so it doesn't touch edges

2. **Table Creation**:
   - SQL script creates `admin_requests` table
   - Adds RLS policies for security
   - Allows anyone to submit requests
   - Only admins can view/approve

---

## 🧪 Test Checklist

- [ ] SQL script ran successfully
- [ ] Visit `localhost:3000#admin`
- [ ] Modal appears and fits on screen
- [ ] Fill form with test data
- [ ] Click "Submit Request"
- [ ] See success message (no errors!)
- [ ] Check Supabase → Table Editor → admin_requests
- [ ] Your request should be there with status "pending"

---

## 📧 Email Notifications (Optional - Later)

The system works without emails! You can:
- Manually check "Manage Admins" for new requests
- Approve/reject from there

To add email notifications later:
- Set up Supabase Edge Functions
- Or use Zapier/Make.com to watch the table
- Sends email to cinechattercontact@gmail.com

---

## Next Steps

Once the table is created:
1. Test submitting a request
2. I'll finish the "Pending Requests" tab in "Manage Admins"
3. You can approve requests from the admin panel

Let me know when you've run the SQL and I'll help you test it!
