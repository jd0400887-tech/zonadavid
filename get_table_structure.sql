SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'adoption_compliance_history'
ORDER BY ordinal_position;
