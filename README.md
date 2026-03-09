# Gestão de Buffet - Micro SaaS

Plataforma completa para gestão de buffets, eventos e leads.

## 🚀 Funcionalidades

- **Multi-Tenancy**: Dados isolados por organização/empresa.
- **Gestão de Leads**: Funil de vendas (Kanban) e CRM.
- **Gestão de Eventos**: Controle de agenda, tarefas e checklists.
- **Equipe**: Convite de membros, controle de permissões (Admin/Colaborador).
- **Financeiro**: Receitas, despesas e relatórios.
- **Limites de Plano**: Free, Pro e Enterprise (Leads, Membros, Storage).

## 🛠️ Stack Tecnológico

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **Pagamentos**: Stripe (Mock implementation incluída)

## 📦 Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   Crie um arquivo `.env.local` na raiz com suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

## 🗄️ Setup do Banco de Dados (Supabase)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard).
2. Vá em **SQL Editor**.
3. Execute o script de migração localizado em `supabase/migrations/001_multi_tenancy.sql`.
   - Isso criará a tabela `organizations`, adicionará colunas `org_id` e configurará as políticas de segurança (RLS).

## 🏃‍♂️ Executando o Projeto

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse `http://localhost:5173`.

## 🧪 Testes

Para rodar os testes unitários:

```bash
npm test
```

## 💳 Sistema de Billing (Planos)

O projeto inclui um sistema de billing "mockado" para desenvolvimento sem conta Stripe ativa:

- **Free**: 15 Leads, 2 Membros, 500MB
- **Pro**: 500 Leads, 15 Membros, 5GB
- **Enterprise**: Ilimitado

Para testar o fluxo de upgrade:
1. Vá em **Configurações** > **Upgrade**.
2. Escolha um plano.
3. O sistema simulará o checkout e atualizará seu plano automaticamente.

---

**Desenvolvido como Micro SaaS escalável.**
