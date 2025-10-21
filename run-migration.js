// Script para executar a migração do banco de dados
// Execute: node run-migration.js

const fs = require('fs');
const path = require('path');

// Ler variáveis de ambiente
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas!');
  process.exit(1);
}

console.log('📋 Lendo arquivo de migração...');
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250121_cash_control_and_expenses.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');

console.log('⚠️  IMPORTANTE: Este script NÃO pode executar a migração diretamente.');
console.log('');
console.log('🔹 Para executar a migração, siga os passos:');
console.log('');
console.log('1. Acesse: https://supabase.com/dashboard');
console.log('2. Selecione o projeto: zgdxszwjbbxepsvyjtrb');
console.log('3. Vá em: SQL Editor > New Query');
console.log('4. Copie o conteúdo do arquivo:');
console.log('   supabase/migrations/20250121_cash_control_and_expenses.sql');
console.log('5. Cole no editor e clique em RUN');
console.log('');
console.log('📄 Arquivo de migração: ' + migrationPath);
console.log('');
console.log('Ou abra o arquivo de instruções:');
console.log('   INSTRUCOES_MIGRACAO_DESPESAS.md');
console.log('');
