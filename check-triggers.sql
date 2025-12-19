-- Check for triggers on blog_posts table
SELECT
    trigger_name,
    event_manipulation as trigger_event,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'blog_posts'
ORDER BY trigger_name;

-- Check for any functions called by triggers
SELECT DISTINCT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'blog_posts';

-- Check table constraints
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 't' THEN 'TRIGGER'
        WHEN 'x' THEN 'EXCLUSION'
    END AS constraint_description
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'blog_posts';