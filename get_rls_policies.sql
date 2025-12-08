SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'adoption_compliance_history';
