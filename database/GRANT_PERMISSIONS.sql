-- Conceder permissões para as tabelas students e mentorships

-- Permissões para a tabela students
GRANT ALL ON TABLE students TO postgres;
GRANT ALL ON TABLE students TO anon;
GRANT ALL ON TABLE students TO authenticated;
GRANT ALL ON TABLE students TO service_role;

-- Permissões para a tabela mentorships
GRANT ALL ON TABLE mentorships TO postgres;
GRANT ALL ON TABLE mentorships TO anon;
GRANT ALL ON TABLE mentorships TO authenticated;
GRANT ALL ON TABLE mentorships TO service_role;

-- Verificar permissões concedidas
SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('students', 'mentorships')
ORDER BY table_name, grantee;
