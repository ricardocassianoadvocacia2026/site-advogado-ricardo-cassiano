# Configuração do Supabase - Ricardo Cassiano Advogado

Este diretório contém os scripts de banco de dados e funções serverless para o formulário de contato e CRM de solicitações.

## 1. Estrutura dos Arquivos
- `migrations/20261021_create_solicitacoes.sql`: Migration completa com tabela `solicitacoes`, Row Level Security (RLS), trigger de `updated_at`, índices e publicação para Realtime.
- `functions/submit-solicitacao/index.ts`: Edge Function com validação de dados, proteção Honeypot e persistência segura.

## 2. Como Aplicar a Migration no seu Supabase
1. Acesse o painel do seu projeto Supabase: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. No menu lateral, clique em **SQL Editor**.
3. Crie uma **New query**.
4. Copie todo o conteúdo do arquivo `supabase/migrations/20261021_create_solicitacoes.sql` e cole no editor.
5. Clique em **Run** (Executar).
6. Pronto! A tabela `solicitacoes` estará criada com todas as políticas de segurança ativas.

## 3. Criando o Usuário Administrador para o CRM
Para acessar o CRM em `/admin/solicitacoes`:
1. No painel do Supabase, vá em **Authentication** -> **Users**.
2. Clique no botão **Add user** -> **Create user**.
3. Insira o e-mail do advogado (ex: `contato@ricardocassiano.adv.br` ou seu e-mail de acesso) e defina uma senha segura.
4. Marque a opção de confirmação automática de e-mail (Auto-confirm user) caso deseje acesso imediato.
5. Pronto! Esse será o usuário e senha utilizados para autenticar no CRM.

## 4. Variáveis de Conexão no Frontend
O frontend lê as credenciais através do arquivo `js/supabase-config.js`.
Por padrão, ele permite configurar a URL e a Anon Key:
- Diretamente no arquivo `js/supabase-config.js`
- Ou no próprio painel CRM (que salva no `localStorage` do navegador para conveniência durante testes e produção)
- Ou injetadas via `window.__SUPABASE_ENV__`
