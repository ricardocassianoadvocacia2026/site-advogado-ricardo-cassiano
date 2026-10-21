/**
 * Ricardo Cassiano Advogado - Configuração e Cliente Supabase
 * Suporta injeção de credenciais via window.__SUPABASE_ENV__,
 * localStorage (para testes e painel administrativo) e valores padrão.
 */

(function (window) {
  'use strict';

  // Configurações do Supabase para conexão oficial em produção
  const DEFAULT_CONFIG = {
    url: 'https://vohrgcwisxzbleglcryd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvaHJnY3dpc3h6YmxlZ2xjcnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTQ1ODAsImV4cCI6MjEwODE3MDU4MH0.IJPYxwbHP5eqGeCshyUQDDOQkzQUPXIAoR5m93GPhZI',
    edgeFunctionUrl: ''
  };

  const STORAGE_KEYS = {
    URL: 'RC_SUPABASE_URL',
    ANON_KEY: 'RC_SUPABASE_ANON_KEY'
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

    const config = getStoredConfig();
    if (!window.supabase) {
      throw new Error('Biblioteca do Supabase não carregada.');
    }

    // Cliente anônimo exclusivo para envio público (sem herdar sessões ou tokens de admin expirados)
    const publicClient = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    try {
      const payload = {
        nome: String(nome).trim(),
        whatsapp: String(whatsapp).trim(),
        apenas_contato: Boolean(apenas_contato),
        descricao_caso: apenas_contato ? null : (descricao_caso ? String(descricao_caso).trim() : null),
        status: 'Novo'
      };

      // Importante: NÃO encadear .select() pois visitantes anônimos (RLS) têm permissão exclusiva de INSERT
      const { error } = await publicClient
        .from('solicitacoes')
        .insert([payload]);

      if (error) {
        console.error('Erro retornado pelo Supabase:', error);
        throw new Error(error.message || 'Erro ao gravar solicitação no banco.');
      }

      return {
        success: true,
        message: 'Solicitação enviada com sucesso! Entraremos em contato assim que possível.'
      };
    } catch (err) {
      console.error('Falha ao enviar para Supabase:', err);
      throw err;
    }
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
