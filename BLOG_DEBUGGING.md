# Blog Update Debugging - Critical Discovery

## The Problem
- Direct `fetch()` works and returns HTTP 200
- But response data is empty array `[]`
- This means UPDATE succeeded but returned 0 rows

## Possible Causes

### 1. RLS is blocking the response (most likely)
Even if UPDATE succeeds, RLS might block the SELECT portion of `Prefer: return=representation`

### 2. No matching row found
The `id=eq.{uuid}` filter might not be matching

### 3. Missing author_id
If there's an `author_id` foreign key constraint and we're not setting it

## Immediate Tests

Run these in Supabase Dashboard SQL Editor:

```sql
-- Test 1: Check if RLS is actually disabled or enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'blog_posts';
-- Should show: rowsecurity = false (disabled) or true (enabled)

-- Test 2: Check the actual post data
SELECT id, title, excerpt, author_id, created_at, updated_at
FROM blog_posts
WHERE id = 'fd946767-6d84-4536-92e3-1f088ce00daf';

-- Test 3: Try a simple UPDATE directly in SQL
UPDATE blog_posts
SET excerpt = 'Direct SQL update test at ' || NOW()
WHERE id = 'fd946767-6d84-4536-92e3-1f088ce00daf'
RETURNING *;
-- This should return the updated row

-- Test 4: Check author_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blog_posts'
  AND column_name = 'author_id';
```

## What to tell me:
1. Is RLS enabled (true) or disabled (false)?
2. What is the author_id value for the post?
3. Did the direct SQL UPDATE work and return data?
4. Did the excerpt actually change in the database?
