SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('applications', 'payments', 'students', 'class_schedules')
ORDER BY tablename, policyname;
