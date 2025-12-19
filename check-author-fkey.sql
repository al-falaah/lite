-- Check the foreign key constraint on author_id
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'blog_posts';

-- Check if author_id is in the update data
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blog_posts'
    AND column_name = 'author_id';

-- Check current value of author_id for the post
SELECT id, author_id, author_name
FROM blog_posts
WHERE id = 'fd946767-6d84-4536-92e3-1f088ce00daf';