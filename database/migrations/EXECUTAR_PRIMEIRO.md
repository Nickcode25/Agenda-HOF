# 🚨 INSTRUÇÕES PARA CONFIGURAR O PRONTUÁRIO ELETRÔNICO

## Passo a Passo

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Selecione seu projeto

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **New Query**

### 3. Execute as Migrações na Ordem

#### **MIGRAÇÃO 1: Criar Tabelas**
- Cole o conteúdo do arquivo `021_create_medical_records.sql`
- Clique em **RUN** ou pressione `Ctrl+Enter`
- Aguarde a confirmação "Success. No rows returned"

#### **MIGRAÇÃO 2: Criar Bucket de Fotos**
- Crie uma **New Query**
- Cole o conteúdo do arquivo `022_create_medical_photos_bucket.sql`
- Clique em **RUN**
- Aguarde a confirmação

### 4. Verificar Instalação

Execute esta query para verificar se as tabelas foram criadas:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('anamnesis', 'clinical_evolutions', 'medical_photos', 'informed_consents');
```

Você deve ver 4 tabelas listadas.

### 5. Verificar Bucket de Fotos

- Vá em **Storage** no menu lateral
- Você deve ver um bucket chamado `medical-photos`

---

## ✅ Após Executar as Migrações

O sistema de prontuário eletrônico estará pronto com:

- ✅ Anamnese Digital
- ✅ Evolução Clínica (método SOAP)
- ✅ Upload de Fotos (antes/depois)
- ✅ Termos de Consentimento

## 🆘 Em Caso de Erro

Se aparecer erro de "permission denied" ou "already exists":

1. **Tabela já existe**: Não tem problema, pule para próxima migração
2. **Permission denied**: Verifique se está usando o usuário correto do Supabase
3. **Bucket já existe**: Vá em Storage e verifique se o bucket `medical-photos` já está criado

---

## 📞 Testando o Sistema

Após executar as migrações:

1. Acesse a ficha de um paciente
2. Clique em **"Prontuário Eletrônico"**
3. Teste cada funcionalidade:
   - Nova Anamnese
   - Nova Evolução
   - Upload de Fotos
   - Novo Consentimento
