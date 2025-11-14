# Database Scripts - CineChatter

## 📁 Active Scripts (Use These)

### 1. `schema.sql`
**Purpose:** Complete database schema with all tables, triggers, and initial setup
**When to use:**
- Setting up a new database from scratch
- Understanding the complete database structure

**Status:** ✅ Core schema

---

### 2. `migrate-admin-status-to-char.sql`
**Purpose:** Migrate admin_status to single character codes
**Changes:**
- NULL = Regular user
- `'P'` = Pending approval
- `'A'` = Approved admin
- `'R'` = Rejected

**When to use:**
- Run ONCE to migrate from full-text status to char codes
- Already applied if you've run it

**Status:** ✅ Latest migration (Nov 12, 2024)

---

### 3. `add-approval-to-users.sql`
**Purpose:** Adds admin approval columns to users table
**Adds:**
- `admin_status` VARCHAR(20)
- `admin_request_message` TEXT
- `admin_requested_at` TIMESTAMPTZ
- `admin_reviewed_at` TIMESTAMPTZ
- `admin_reviewed_by` VARCHAR(255)
- `rejection_reason` TEXT

**When to use:**
- Historical reference (superseded by migrate-admin-status-to-char.sql)

**Status:** ⚠️ Deprecated - Use `migrate-admin-status-to-char.sql` instead

---

## 📦 Archive Folder

Old/deprecated scripts moved to `archive/` folder:
- `add-admin-approval-system.sql` - Old separate table approach
- `add-admin-system.sql` - Early admin system
- `check-and-fix-users.sql` - Diagnostic script
- `check-trigger.sql` - Trigger verification
- `fix-missing-users.sql` - User sync fix
- `master-setup.sql` - Old combined setup
- `migrate-to-admin-status-only.sql` - Intermediate migration
- `secure-admin-creation.sql` - Old admin creation
- `update-rls-for-approval.sql` - Old RLS policies
- `update-rls-for-approval-v2.sql` - Old RLS policies v2

These are kept for reference but should NOT be used.

---

## 🎯 Current System

### Admin Status Values:
| Code | Meaning | Description |
|------|---------|-------------|
| `NULL` | Regular User | Default for normal users |
| `'P'` | Pending | Requested admin access, awaiting approval |
| `'A'` | Approved | Admin user with full access |
| `'R'` | Rejected | Request was denied |

### Key Tables:
- `users` - User profiles with admin status
- `articles` - Blog posts
- `featured_images` - Homepage carousel

### Security:
- Row Level Security (RLS) enabled
- `is_admin()` function checks if user has `admin_status = 'A'`
- Regular users can only see their own data
- Admins can see all users

---

## 📚 Documentation Files

- `README.md` - Original database documentation
- `SCRIPTS_README.md` - Detailed script history
- `fix-email-confirmation.md` - Email confirmation setup guide
- `CURRENT_SCRIPTS.md` - This file (current status)

---

## ✅ Setup Checklist

For a fresh database:

1. ✅ Run `schema.sql` - Creates all tables
2. ✅ Run `migrate-admin-status-to-char.sql` - Sets up admin approval system
3. ✅ Create your first admin:
   ```sql
   UPDATE users
   SET admin_status = 'A'
   WHERE email = 'your-email@example.com';
   ```

That's it! Your database is ready. 🚀
