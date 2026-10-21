/**
 * Ricardo Cassiano Advogado - Configuração e Cliente Supabase
 * Suporta injeção de credenciais via window.__SUPABASE_ENV__,
 * localStorage (para testes e painel administrativo) e valores padrão.
 */

(function (window) {
  'use strict';

  // Configurações padrão (Podem ser preenchidas diretamente aqui ou no painel CRM)
  const DEFAULT_CONFIG = {
    url: '',
    anonKey: '',
    edgeFunctionUrl: '' // Opcional, caso use Supabase Edge Function dedicada
  };

  const STORAGE_KEYS = {
    URL: 'RC_SUPABASE_URL',
    ANON_KEY: 'RC_SUPABASE_ANON_KEY',
    LOCAL_LEADS: 'RC_DEV_MOCK_LEADS' // Fallback para visualização imediata se chaves não informadas
  };

  let clientInstance = null;

  function getStoredConfig() {
    const envConfig = window.__SUPABASE_ENV__ || {};
    const storedUrl = localStorage.getItem(STORAGE_KEYS.URL);
    const storedKey = localStorage.getItem(STORAGE_KEYS.ANON_KEY);

    const url = (storedUrl || envConfig.url || DEFAULT_CONFIG.url || '').trim();
    const anonKey = (storedKey || envConfig.anonKey || DEFAULT_CONFIG.anonKey || '').trim();

    return {
      url: url.replace(/\/$/, ''),
      anonKey: anonKey
    };
  }

  function isConfigured() {
    const config = getStoredConfig();
    return Boolean(
      config.url && 
      config.url.startsWith('https://') && 
      !config.url.includes('your-project-id') &&
      config.anonKey && 
      config.anonKey.length > 20
    );
  }

  function setCredentials(url, anonKey) {
    if (url) {
      localStorage.setItem(STORAGE_KEYS.URL, url.trim().replace(/\/$/, ''));
    } else {
      localStorage.removeItem(STORAGE_KEYS.URL);
    }

    if (anonKey) {
      localStorage.setItem(STORAGE_KEYS.ANON_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
    }

    clientInstance = null;
    return isConfigured();
  }

  function getClient() {
    if (clientInstance) return clientInstance;

    const config = getStoredConfig();
    if (!window.supabase) {
      console.warn('Biblioteca @supabase/supabase-js não encontrada no escopo global.');
      return null;
    }

    if (!isConfigured()) {
      return null;
    }

    try {
      clientInstance = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
      return clientInstance;
    } catch (err) {
      console.error('Erro ao inicializar cliente Supabase:', err);
      return null;
    }
  }

  /**
   * Envia uma nova solicitação pública para o banco de dados.
   * Prioriza a tabela com RLS público ou a Edge Function.
   */
  async function submitSolicitacao(dados) {
    const { nome, whatsapp, apenas_contato, descricao_caso, _hp } = dados;

    // Proteção honeypot no frontend
    if (_hp && String(_hp).trim() !== '') {
      return { success: true, message: 'Solicitação enviada com sucesso!' };
    }

    const client = getClient();

    // Se o Supabase estiver configurado, envia diretamente pelo Supabase Client (RLS)
    if (client) {
      try {
        const payload = {
          nome: String(nome).trim(),
          whatsapp: String(whatsapp).trim(),
          apenas_contato: Boolean(apenas_contato),
          descricao_caso: apenas_contato ? null : (descricao_caso ? String(descricao_caso).trim() : null),
          status: 'Novo'
        };

        const { data, error } = await client
          .from('solicitacoes')
          .insert([payload])
          .select('id, created_at')
          .single();

        if (error) {
          console.error('Erro retornado pelo Supabase:', error);
          throw new Error(error.message || 'Erro ao gravar solicitação no banco.');
        }

        return {
          success: true,
          message: 'Solicitação enviada com sucesso! Entraremos em contato assim que possível.',
          data: data
        };
      } catch (err) {
        console.error('Falha ao enviar para Supabase:', err);
        throw err;
      }
    }

    // Modo de demonstração / Fallback local para ambiente de desenvolvimento quando chaves ainda não foram configuradas
    console.info('Aviso: Supabase URL e Anon Key ainda não foram inseridas. Registrando no armazenamento de desenvolvimento para testes locais.');
    
    const localLeads = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_LEADS) || '[]');
    const newLead = {
      id: 'demo-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
      nome: String(nome).trim(),
      whatsapp: String(whatsapp).trim(),
      apenas_contato: Boolean(apenas_contato),
      descricao_caso: apenas_contato ? null : (descricao_caso ? String(descricao_caso).trim() : null),
      status: 'Novo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_local_mock: true
    };
    localLeads.unshift(newLead);
    localStorage.setItem(STORAGE_KEYS.LOCAL_LEADS, JSON.stringify(localLeads));

    // Notifica eventuais abas locais do admin
    window.dispatchEvent(new CustomEvent('rc-local-lead-created', { detail: newLead }));

    return {
      success: true,
      message: 'Solicitação enviada com sucesso! Entraremos em contato assim que possível.',
      data: newLead,
      warning: 'Salvo em modo local (configure o Supabase para sincronização em nuvem).'
    };
  }

  // Exporta objeto global
  window.SupabaseApp = {
    isConfigured,
    getStoredConfig,
    setCredentials,
    getClient,
    submitSolicitacao,
    STORAGE_KEYS
  };

})(window);
