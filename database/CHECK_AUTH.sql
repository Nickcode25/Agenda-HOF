-- Verificar autenticação e dados

-- 1. Ver todos os usuários cadastrados
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Tentar inserir como um usuário específico (substitua o UUID pelo ID do seu usuário)
-- Primeiro, pegue o ID do usuário acima, depois execute:
-- SET LOCAL jwt.claims.sub = 'SEU-USER-ID-AQUI';
-- INSERT INTO students (user_id, name) VALUES ('SEU-USER-ID-AQUI', 'Teste');

-- 3. Ver se já existe algum aluno cadastrado (sem RLS - admin view)
SELECT * FROM students LIMIT 10;
