# Database Development Workflow

## 🚧 Pre-Launch Development Phase (CURRENT)

**Status:** Site is NOT live yet

### Workflow for Database Changes:

When making database changes:

1. **Update the migration files directly**
   - Edit `migrations/001_initial_schema.sql`
   - Edit `migrations/002_auth_triggers.sql`
   - Edit `migrations/003_admin_approval_system.sql`

2. **Update master script**
   - Update `master_fresh_install.sql` to match

3. **No new migration files needed**
   - Keep iterating on existing files
   - Faster development
   - Simpler structure

### Example:
```
Need to add a new column to users table?
→ Edit migrations/003_admin_approval_system.sql
→ Update master_fresh_install.sql
→ Run updated script on your dev database
✅ Done!
```

---

## 🚀 Post-Launch Phase (FUTURE)

**Status:** Site IS live with production data

### Workflow Changes:

When making database changes:

1. **DO NOT edit existing migrations**
   - Existing files are locked (already run on production)
   - Editing them could cause data loss

2. **Create NEW migration files**
   - `004_add_feature_x.sql`
   - `005_update_table_y.sql`
   - etc.

3. **Keep master script updated**
   - Add new changes to `master_fresh_install.sql`
   - For fresh installs, this includes everything

### Example:
```
Site is live, need to add comments feature?
→ Create migrations/004_add_comments_table.sql
→ Run on production
→ Update master_fresh_install.sql for future fresh installs
✅ Done!
```

---

## 📋 Checklist: Is Site Live?

I will ask this question whenever you request a database change:

**"Is the CineChatter site live in production yet?"**

### How to answer:
- **NO** → I'll update existing migration files
- **YES** → I'll create new migration file (004, 005, etc.)

### "Live" means:
- [ ] Real users are using the site
- [ ] Production database has actual data
- [ ] Cannot afford to lose data
- [ ] Site is publicly accessible

### "Not Live" means:
- [x] Still in development (CURRENT STATUS)
- [x] Only you and test users
- [x] Can reset database without issues
- [x] No production data to protect

---

## 🎯 Current Project Status

**Phase:** Pre-Launch Development
**Database:** Development/Testing only
**Strategy:** Update existing migrations
**Next Milestone:** Site goes live

---

## 📂 File Strategy

### Pre-Launch (NOW):
```
migrations/
  001_initial_schema.sql        ← Can edit
  002_auth_triggers.sql         ← Can edit
  003_admin_approval_system.sql ← Can edit

master_fresh_install.sql        ← Keep in sync
```

### Post-Launch (FUTURE):
```
migrations/
  001_initial_schema.sql        ← LOCKED (don't edit)
  002_auth_triggers.sql         ← LOCKED (don't edit)
  003_admin_approval_system.sql ← LOCKED (don't edit)
  004_new_feature.sql           ← New changes here
  005_another_update.sql        ← And here
  ...

master_fresh_install.sql        ← Includes all changes (001-00X)
```

---

## 🤝 Agreement

**Pre-Launch Development:**
- Update existing migration files
- Keep master script in sync
- Fast iteration

**Post-Launch Production:**
- Create new migration files only
- Never edit old migrations
- Protect production data

**Trigger Question:**
Before any database change, I'll ask:
> "Is the CineChatter site live in production yet?"

Your answer determines the workflow! ✅

---

Last Updated: 2024-11-12
Current Phase: Pre-Launch Development
