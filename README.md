# Gestão de Buffet

Sistema pessoal para organizar leads, eventos, equipe e financeiro de um buffet.

## Funcionalidades

- **Gestão de Leads**: Funil de vendas em Kanban.
- **Gestão de Eventos**: Controle de agenda, tarefas e checklists.
- **Equipe**: Cadastro de colaboradores e permissões de acesso.
- **Financeiro**: Receitas, despesas e relatórios.
- **Documentos**: Armazenamento de contratos e arquivos por evento.

## Stack Tecnológico

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)

## Instalação

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente em um arquivo `.env.local`:
   ```env
   VITE_SUPABASE_URL=sua_url_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

## Banco de Dados

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard).
2. Vá em **SQL Editor**.
3. Execute as migrações em `supabase/migrations`.

## Executando o Projeto

```bash
npm run dev
```

Acesse `http://localhost:5173`.

## Testes

```bash
npm test
```
