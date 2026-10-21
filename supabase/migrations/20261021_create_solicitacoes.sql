-- ==============================================================================
-- MIGRATION: 20261021_create_solicitacoes.sql
-- TABELA: solicitacoes (Leads / Contatos do site Ricardo Cassiano Advogado)
-- ==============================================================================

-- 1. Criação da tabela de solicitações
CREATE TABLE IF NOT EXISTS public.solicitacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL CHECK (char_length(trim(nome)) >= 2 AND char_length(nome) <= 150),
    whatsapp TEXT NOT NULL CHECK (char_length(trim(whatsapp)) >= 10 AND char_length(whatsapp) <= 25),
    apenas_contato BOOLEAN NOT NULL DEFAULT false,
    descricao_caso TEXT CHECK (descricao_caso IS NULL OR char_length(descricao_caso) <= 3000),
    status TEXT NOT NULL DEFAULT 'Novo' CHECK (status IN ('Novo', 'Em atendimento', 'Aguardando retorno', 'Concluído')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentários descritivos da tabela e colunas
COMMENT ON TABLE public.solicitacoes IS 'Tabela que armazena os contatos e solicitações recebidos pelo formulário do site institucional';
COMMENT ON COLUMN public.solicitacoes.id IS 'Identificador único (UUID) da solicitação';
COMMENT ON COLUMN public.solicitacoes.nome IS 'Nome completo informado pelo visitante';
COMMENT ON COLUMN public.solicitacoes.whatsapp IS 'Telefone celular / WhatsApp informado pelo visitante';
COMMENT ON COLUMN public.solicitacoes.apenas_contato IS 'Indica se o visitante solicitou apenas retorno direto sem detalhar o caso';
COMMENT ON COLUMN public.solicitacoes.descricao_caso IS 'Descrição opcional prévia do caso ou assunto jurídico';
COMMENT ON COLUMN public.solicitacoes.status IS 'Status do fluxo no CRM: Novo, Em atendimento, Aguardando retorno, Concluído';
COMMENT ON COLUMN public.solicitacoes.created_at IS 'Data e hora da criação da solicitação';
COMMENT ON COLUMN public.solicitacoes.updated_at IS 'Data e hora da última modificação';

-- 2. Índices de performance para busca e filtros no CRM
CREATE INDEX IF NOT EXISTS idx_solicitacoes_created_at ON public.solicitacoes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes (status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_nome ON public.solicitacoes (nome);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_whatsapp ON public.solicitacoes (whatsapp);

-- 3. Função e Trigger para atualização automática da coluna updated_at
CREATE OR REPLACE FUNCTION public.handle_solicitacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_solicitacoes_updated_at ON public.solicitacoes;
CREATE TRIGGER trg_solicitacoes_updated_at
    BEFORE UPDATE ON public.solicitacoes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_solicitacoes_updated_at();

-- 4. Habilitação de Row Level Security (RLS)
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)

-- POLÍTICA 1 (INSERT PÚBLICO SEGURO):
-- Visitantes anônimos ou autenticados podem inserir apenas novas solicitações com status 'Novo'.
-- Não é permitido que um usuário anônimo crie registros com status diferente de 'Novo'.
DROP POLICY IF EXISTS "Permitir insercao publica anonima" ON public.solicitacoes;
CREATE POLICY "Permitir insercao publica anonima"
    ON public.solicitacoes
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'Novo'
        AND char_length(trim(nome)) >= 2
        AND char_length(trim(whatsapp)) >= 10
    );

-- POLÍTICA 2 (SELECT APENAS AUTENTICADOS):
-- Somente usuários devidamente autenticados (Supabase Auth) podem ler/consultar as solicitações.
-- Visitantes anônimos não possuem permissão de leitura.
DROP POLICY IF EXISTS "Permitir leitura apenas para usuarios autenticados" ON public.solicitacoes;
CREATE POLICY "Permitir leitura apenas para usuarios autenticados"
    ON public.solicitacoes
    FOR SELECT
    TO authenticated
    USING (true);

-- POLÍTICA 3 (UPDATE APENAS AUTENTICADOS):
-- Apenas usuários autenticados podem alterar status ou atualizar os dados das solicitações.
DROP POLICY IF EXISTS "Permitir atualizacao apenas para usuarios autenticados" ON public.solicitacoes;
CREATE POLICY "Permitir atualizacao apenas para usuarios autenticados"
    ON public.solicitacoes
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (status IN ('Novo', 'Em atendimento', 'Aguardando retorno', 'Concluído'));

-- POLÍTICA 4 (DELETE APENAS AUTENTICADOS):
-- Apenas usuários autenticados podem excluir solicitações, caso necessário.
DROP POLICY IF EXISTS "Permitir exclusao apenas para usuarios autenticados" ON public.solicitacoes;
CREATE POLICY "Permitir exclusao apenas para usuarios autenticados"
    ON public.solicitacoes
    FOR DELETE
    TO authenticated
    USING (true);

-- 6. Habilitação no Realtime (Supabase Realtime)
-- Permite que o CRM receba notificações instantâneas via WebSocket sem recarregar a página
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'solicitacoes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes;
    END IF;
END $$;
