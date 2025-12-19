# Blog Update Troubleshooting Guide

## Problem
Blog post updates are timing out after 10 seconds when clicking "Update & Publish" or "Update Draft" buttons in `/blog/admin`.

## Diagnostic Steps

### Step 1: Check RLS Policies in Supabase Dashboard

Go to Supabase Dashboard → SQL Editor and run this:

```sql
-- Check current RLS policies on blog_posts table
SELECT
  policyname,
  cmd,
  roles::text[],
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'blog_posts'
ORDER BY cmd, policyname;
```

**Expected result:**
- `blog_select_published` (SELECT) - `using: (status = 'published'::text)`
- `blog_insert_admin` (INSERT) - `with_check: true`
- `blog_update_admin` (UPDATE) - `using: true`, `with_check: true`
- `blog_delete_admin` (DELETE) - `using: true`

If you see different policies (especially ones with `EXISTS` or `is_user_admin()` function calls), run the fix:
```bash
# In Supabase Dashboard SQL Editor, run:
cat fix-rls-simple.sql
```

### Step 2: Check Browser Console Logs

1. Open `/blog/admin` in your browser
2. Open DevTools (F12) → Console tab
3. Click "Update & Publish" or "Update Draft"
4. Look for these log messages:

```
[Auth Check] Getting session...
[Auth Check] Session: Active
[Auth Check] User ID: <your-user-id>
[Auth Check] User email: <your-email>
```

**If you see "Session: None":**
- You're not logged in properly
- Refresh the page and log in again via GitHub

**If you see an active session but update still times out:**
- Continue to Step 3

### Step 3: Check Network Tab

1. Open DevTools → Network tab
2. Filter for "blog_posts"
3. Click the update button
4. Look for a PATCH request to `/rest/v1/blog_posts`

**What to check:**
- Does the request appear? (If no, there's a client-side issue)
- What's the status? (Pending/200/401/403/504)
- How long does it take? (If it's pending for 10+ seconds, it's timing out)
- Response body (if any error message)

### Step 4: Test Update Directly in SQL

In Supabase Dashboard SQL Editor, try updating a post directly:

```sql
-- First, get your user ID (you need to be logged in to Supabase Dashboard)
SELECT auth.uid() as my_user_id;

-- Check if you're in the profiles table and marked as admin
SELECT id, full_name, email, is_admin
FROM profiles
WHERE id = auth.uid();

-- If is_admin is false, you need to set it to true:
UPDATE profiles
SET is_admin = true
WHERE id = auth.uid();

-- Now try to update a blog post
UPDATE blog_posts
SET excerpt = 'Test update from SQL at ' || NOW()
WHERE id = (SELECT id FROM blog_posts LIMIT 1)
RETURNING *;
```

**Expected:**
- Update should succeed in < 100ms
- You should see the updated row returned

**If update fails:**
- Check the error message
- You might not be authenticated in the SQL Editor context

### Step 5: Check for Cached Policies

Sometimes Supabase caches policies. Try:

1. Go to Supabase Dashboard → Database → Roles
2. Find the `authenticated` role
3. Click "Refresh" or restart the Supabase instance

OR run this in SQL Editor:
```sql
-- Force a schema cache refresh
NOTIFY pgrst, 'reload schema';
```

## Common Issues and Fixes

### Issue: "No active session"
**Fix:** Refresh the page and log in again

### Issue: "PGRST116: Cannot coerce the result to a single JSON object"
**Cause:** RLS is blocking the update (returning 0 rows affected)
**Fix:**
1. Verify you're logged in
2. Verify `is_admin = true` in your profile
3. Verify RLS policies are set to `WITH CHECK (true)` for authenticated users

### Issue: Request times out after 10 seconds
**Possible causes:**
1. Old slow RLS policies still cached (use `NOTIFY pgrst, 'reload schema'`)
2. Network connectivity issue between browser and Supabase
3. Supabase region is slow/down (check status.supabase.com)
4. Session expired or invalid

### Issue: Network request never appears in Network tab
**Cause:** Client-side JavaScript error preventing request
**Fix:** Check Console tab for JavaScript errors

## Test Files Created

- `test-blog-update.js` - Tests update without authentication
- `test-authenticated-update.js` - Tests with authentication (requires session)
- `check-current-rls.sql` - SQL to inspect RLS policies
- `fix-rls-simple.sql` - Simplest RLS fix (trust app-level auth)

## Next Steps if Still Failing

If all diagnostics pass but updates still fail:

1. **Check Supabase project health:**
   - Go to https://status.supabase.com
   - Check if there are any incidents

2. **Try from a different browser:**
   - Clear cache and cookies
   - Try in incognito mode

3. **Check browser console for CORS errors:**
   - CORS issues would show as network errors

4. **Verify environment variables:**
   ```bash
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```
   - Make sure they match your Supabase project

5. **Contact support:**
   - Share the exact error message from console logs
   - Share the Network tab screenshot
   - Share the RLS policies output
