# Blog Foreign Key Fix - THE SOLUTION!

## Problem Found!

The `blog_posts` table has a foreign key `blog_posts_author_id_fkey` that references the **`students`** table, but blog post authors should be users from the `profiles` table!

Your user ID `8bcb36bf-3771-40b6-8b1b-2f9d64fefb82` exists in `profiles` (you're logged in as admin), but it doesn't exist in `students` table.

## The Fix (RECOMMENDED)

Drop the incorrect foreign key constraint. Run this in Supabase Dashboard SQL Editor:

```sql
-- Drop the incorrect foreign key constraint
ALTER TABLE blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
```

That's it! After running this one line, your blog updates will work immediately.

## Why This Works

- Blog posts don't need to be linked to the students table
- You already have `author_name` field to store the author's name as text
- The `author_id` can either be NULL or reference a user ID from profiles
- Removing the constraint allows the update to proceed

## After the Fix

Once you run the SQL above, try clicking "Update & Republish" again - it should work!
