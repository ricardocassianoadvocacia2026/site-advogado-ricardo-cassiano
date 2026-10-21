/**
 * Ricardo Cassiano Advogado - Painel CRM Administrativo
 * Gerenciamento de solicitações, autenticação Supabase Auth e Realtime.
 */

(function () {
  'use strict';

  // Estado da Aplicação
  let currentUser = null;
  let allLeads = [];
  let currentFilter = 'Todos';
  let searchQuery = '';
  let activeModalLead = null;
  let realtimeChannel = null;

  // Elementos DOM
  const authScreen = document.getElementById('auth-screen');
  const crmDashboard = document.getElementById('crm-dashboard');
  const authForm = document.getElementById('auth-login-form');
  const authEmailInput = document.getElementById('auth-email');
  const authPasswordInput = document.getElementById('auth-password');
  const authErrorBox = document.getElementById('auth-error-box');
  const authConnectionStatus = document.getElementById('auth-connection-status');
  const loginSpinner = document.getElementById('login-spinner');
  const btnLoginSubmit = document.getElementById('btn-login-submit');

  const userDisplayEmail = document.getElementById('user-display-email');
  const btnLogout = document.getElementById('btn-logout');

  // Métricas
  const countTotalEl = document.getElementById('metric-count-total');
  const countNovoEl = document.getElementById('metric-count-novo');
  const countAtendEl = document.getElementById('metric-count-atendimento');
  const countAguardEl = document.getElementById('metric-count-aguardando');
  const countConclEl = document.getElementById('metric-count-concluido');

  // Toolbar & Tabela
  const searchInput = document.getElementById('crm-search-input');
  const searchClearBtn = document.getElementById('crm-search-clear');
  const filterPills = document.querySelectorAll('.filter-pill');
  const btnRefresh = document.getElementById('btn-refresh-leads');
  const tableBody = document.getElementById('leads-table-body');
  const loadingIndicator = document.getElementById('leads-loading');
  const emptyIndicator = document.getElementById('leads-empty');

  // Modal de Detalhes
  const modalLead = document.getElementById('modal-lead-details');
  const btnCloseLeadModal = document.getElementById('btn-close-lead-modal');
  const btnSaveLeadDetails = document.getElementById('btn-save-lead-details');
  const modalNome = document.getElementById('modal-lead-nome');
  const modalWhatsapp = document.getElementById('modal-lead-whatsapp');
  const modalWaLink = document.getElementById('modal-lead-wa-link');
  const modalPref = document.getElementById('modal-lead-pref');
  const modalDescricao = document.getElementById('modal-lead-descricao');
  const modalCreated = document.getElementById('modal-lead-created');
  const modalUpdated = document.getElementById('modal-lead-updated');
  const modalStatusChoices = document.getElementById('modal-status-choices');
  const modalFeedback = document.getElementById('modal-status-feedback');

  // Modal de Configuração Supabase
  const modalConfig = document.getElementById('modal-config-supabase');
  const btnOpenConfigAuth = document.getElementById('btn-open-config-modal');
  const btnOpenConfigHeader = document.getElementById('btn-crm-config');
  const btnCloseConfig = document.getElementById('btn-close-config-modal');
  const btnCancelConfig = document.getElementById('btn-cancel-config');
  const btnSaveConfig = document.getElementById('btn-save-config');
  const cfgUrlInput = document.getElementById('cfg-supabase-url');
  const cfgAnonInput = document.getElementById('cfg-supabase-anon');
  const cfgStatusMsg = document.getElementById('cfg-status-msg');

  // Toast
  const toastEl = document.getElementById('crm-toast');
  const toastText = document.getElementById('crm-toast-text');
  let toastTimer = null;

  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toastText.textContent = message;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 4000);
  }

  // ==========================================================================
  // INICIALIZAÇÃO E AUTENTICAÇÃO
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initFiltersAndSearch();
    initModals();
    initEvents();
  });

  function updateConnectionBadge() {
    if (!authConnectionStatus) return;
    const isConfig = window.SupabaseApp && window.SupabaseApp.isConfigured();
    if (isConfig) {
      const cfg = window.SupabaseApp.getStoredConfig();
      const domain = cfg.url.replace(/^https?:\/\//, '').split('/')[0];
      authConnectionStatus.className = 'auth-connection-badge is-connected';
      authConnectionStatus.innerHTML = `<span>🟢</span><span><strong>Supabase Conectado:</strong> ${domain}</span>`;
      authConnectionStatus.style.display = 'flex';
    } else {
      authConnectionStatus.className = 'auth-connection-badge is-warning';
      authConnectionStatus.innerHTML = `<span>⚠️</span><span><strong>Conexão Supabase Pendente:</strong> <a id="btn-configure-link" style="text-decoration:underline; cursor:pointer; font-weight:600;">Clique aqui para informar URL e Chave</a></span>`;
      authConnectionStatus.style.display = 'flex';
      const link = document.getElementById('btn-configure-link');
      if (link) link.addEventListener('click', openConfigModal);
    }
  }

  async function initAuth() {
    updateConnectionBadge();
    const supabase = window.SupabaseApp ? window.SupabaseApp.getClient() : null;

    if (!supabase) {
      showAuthScreen();
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session && session.user) {
        onUserAuthenticated(session.user);
      } else {
        showAuthScreen();
      }

      // Escuta mudanças de sessão
      supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          onUserAuthenticated(session.user);
        } else {
          showAuthScreen();
        }
      });
    } catch (err) {
      console.warn('Erro ao verificar sessão Supabase:', err);
      showAuthScreen();
    }
  }

  function showAuthScreen() {
    authScreen.style.display = 'flex';
    crmDashboard.style.display = 'none';
    updateConnectionBadge();
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      realtimeChannel = null;
    }
  }

  function onUserAuthenticated(user) {
    currentUser = user;
    authScreen.style.display = 'none';
    crmDashboard.style.display = 'block';
    userDisplayEmail.textContent = user.email || 'Administrador';

    fetchLeads();
    subscribeRealtime();
  }

  // Submissão do Formulário de Login
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      authErrorBox.style.display = 'none';
      authErrorBox.textContent = '';

      const email = authEmailInput.value.trim();
      const password = authPasswordInput.value;

      if (!email || !password) {
        showAuthError('Informe o e-mail e a senha cadastrados.');
        return;
      }

      const supabase = window.SupabaseApp ? window.SupabaseApp.getClient() : null;
      if (!supabase) {
        showAuthError('Conexão com o Supabase ainda não configurada. A janela de configuração foi aberta para você inserir a URL e a Anon Key.');
        openConfigModal();
        return;
      }

      btnLoginSubmit.setAttribute('disabled', 'disabled');
      if (loginSpinner) loginSpinner.style.display = 'inline-block';

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          throw error;
        }

        if (data && data.user) {
          showToast(`Bem-vindo, ${data.user.email}!`);
          onUserAuthenticated(data.user);
        }
      } catch (err) {
        console.error('Erro de autenticação:', err);
        let msg = 'E-mail ou senha incorretos.';
        if (err.message && err.message.includes('Invalid login credentials')) {
          msg = 'Credenciais inválidas. Verifique seu e-mail e senha no Supabase Auth.';
        } else if (err.message && err.message.includes('Email not confirmed')) {
          msg = 'E-mail não confirmado. Marque o usuário como confirmado no painel Supabase.';
        } else if (err.message) {
          msg = err.message;
        }
        showAuthError(msg);
      } finally {
        btnLoginSubmit.removeAttribute('disabled');
        if (loginSpinner) loginSpinner.style.display = 'none';
      }
    });
  }

  function showAuthError(message) {
    authErrorBox.textContent = message;
    authErrorBox.style.display = 'block';
  }

  // Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      const supabase = window.SupabaseApp ? window.SupabaseApp.getClient() : null;
      if (supabase) {
        await supabase.auth.signOut();
      }
      currentUser = null;
      showAuthScreen();
      showToast('Sessão encerrada com sucesso.');
    });
  }

  // ==========================================================================
  // BUSCA E ATUALIZAÇÃO DE LEADS
  // ==========================================================================
  async function fetchLeads(silent = false) {
    if (!silent) {
      loadingIndicator.style.display = 'flex';
      emptyIndicator.style.display = 'none';
      tableBody.innerHTML = '';
      if (btnRefresh) btnRefresh.classList.add('is-spinning');
    }

    const supabase = window.SupabaseApp ? window.SupabaseApp.getClient() : null;

    if (!supabase) {
      // Carrega leads locais de demonstração se Supabase não configurado
      const local = JSON.parse(localStorage.getItem(window.SupabaseApp.STORAGE_KEYS.LOCAL_LEADS) || '[]');
      allLeads = local;
      renderTable();
      updateMetrics();
      loadingIndicator.style.display = 'none';
      if (btnRefresh) btnRefresh.classList.remove('is-spinning');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      allLeads = data || [];
      renderTable();
      updateMetrics();
    } catch (err) {
      console.error('Erro ao carregar solicitações do Supabase:', err);
      showToast('Erro ao carregar dados do Supabase. Verifique permissões RLS.');
    } finally {
      loadingIndicator.style.display = 'none';
      if (btnRefresh) btnRefresh.classList.remove('is-spinning');
    }
  }

  // Assinatura Realtime (WebSocket do Supabase)
  function subscribeRealtime() {
    const supabase = window.SupabaseApp ? window.SupabaseApp.getClient() : null;
    if (!supabase) return;

    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
    }

    try {
      realtimeChannel = supabase
        .channel('solicitacoes-crm-live')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'solicitacoes' },
          (payload) => {
            handleRealtimeEvent(payload);
          }
        )
        .subscribe((status) => {
          console.log('Status da conexão Realtime Supabase:', status);
        });
    } catch (e) {
      console.warn('Não foi possível assinar canal Realtime:', e);
    }
  }

  function handleRealtimeEvent(payload) {
    if (payload.eventType === 'INSERT') {
      const newRow = payload.new;
      allLeads.unshift(newRow);
      renderTable(newRow.id);
      updateMetrics();
      showToast(`Nova solicitação recebida: ${newRow.nome}!`);
    } else if (payload.eventType === 'UPDATE') {
      const updatedRow = payload.new;
      const index = allLeads.findIndex((item) => item.id === updatedRow.id);
      if (index !== -1) {
        allLeads[index] = updatedRow;
      }
      renderTable();
      updateMetrics();

      if (activeModalLead && activeModalLead.id === updatedRow.id) {
        populateLeadModal(updatedRow);
      }
    } else if (payload.eventType === 'DELETE') {
      allLeads = allLeads.filter((item) => item.id !== payload.old.id);
      renderTable();
      updateMetrics();
    }
  }

  // ==========================================================================
  // RENDERIZAÇÃO DA TABELA E MÉTRICAS
  // ==========================================================================
  function updateMetrics() {
    let total = allLeads.length;
    let novos = 0;
    let atend = 0;
    let aguard = 0;
    let concl = 0;

    allLeads.forEach((lead) => {
      const st = lead.status;
      if (st === 'Novo') novos++;
      else if (st === 'Em atendimento') atend++;
      else if (st === 'Aguardando retorno') aguard++;
      else if (st === 'Concluído') concl++;
    });

    if (countTotalEl) countTotalEl.textContent = total;
    if (countNovoEl) countNovoEl.textContent = novos;
    if (countAtendEl) countAtendEl.textContent = atend;
    if (countAguardEl) countAguardEl.textContent = aguard;
    if (countConclEl) countConclEl.textContent = concl;
  }

  function getFilteredLeads() {
    return allLeads.filter((lead) => {
      // Filtro por status
      if (currentFilter !== 'Todos' && lead.status !== currentFilter) {
        return false;
      }

      // Filtro por busca (nome ou whatsapp)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nomeMatch = (lead.nome || '').toLowerCase().includes(query);
        const waMatch = (lead.whatsapp || '').replace(/\D/g, '').includes(query.replace(/\D/g, ''));
        if (!nomeMatch && !waMatch) return false;
      }

      return true;
    });
  }

  function formatDateTime(isoString) {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      const horas = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return {
        full: `${dia}/${mes}/${ano} às ${horas}:${min}`,
        date: `${dia}/${mes}/${ano}`,
        time: `${horas}:${min}`,
        relative: getRelativeTimeString(date),
      };
    } catch (e) {
      return { full: isoString, date: isoString, time: '', relative: '' };
    }
  }

  function getRelativeTimeString(date) {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return '';
  }

  function getCleanDigitsPhone(phone) {
    return (phone || '').replace(/\D/g, '');
  }

  function getWhatsAppUrl(nome, phone) {
    const digits = getCleanDigitsPhone(phone);
    const ddi = digits.length <= 11 ? '55' : '';
    const saudacao = encodeURIComponent(`Olá ${nome}, sou o Dr. Ricardo Cassiano. Recebi sua solicitação de contato pelo site e estou à disposição.`);
    return `https://wa.me/${ddi}${digits}?text=${saudacao}`;
  }

  function getStatusClass(status) {
    switch (status) {
      case 'Novo':
        return 'status-novo';
      case 'Em atendimento':
        return 'status-em-atendimento';
      case 'Aguardando retorno':
        return 'status-aguardando-retorno';
      case 'Concluído':
        return 'status-concluido';
      default:
        return 'status-novo';
    }
  }

  function renderTable(highlightId = null) {
    const leads = getFilteredLeads();

    if (!leads.length) {
      tableBody.innerHTML = '';
      emptyIndicator.style.display = 'block';
      return;
    }

    emptyIndicator.style.display = 'none';

    let html = '';
    leads.forEach((lead) => {
      const dt = formatDateTime(lead.created_at);
      const waUrl = getWhatsAppUrl(lead.nome, lead.whatsapp);
      const statusClass = getStatusClass(lead.status);
      const isNew = highlightId === lead.id ? 'table-row-new' : '';

      const prefBadge = lead.apenas_contato
        ? `<span class="lead-pref-badge pref-only-contact">📞 Apenas contato</span>`
        : `<span class="lead-pref-badge pref-with-desc">📄 Com descrição</span>`;

      html += `
        <tr class="${isNew}" data-id="${lead.id}">
          <td class="cell-date">
            <div class="date-time">${dt.date} ${dt.time}</div>
            ${dt.relative ? `<div class="date-rel">${dt.relative}</div>` : ''}
          </td>
          <td>
            <div class="lead-name">${escapeHtml(lead.nome)}</div>
            ${prefBadge}
          </td>
          <td>
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="wa-link-btn" title="Iniciar conversa no WhatsApp">
              <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
              <span>${escapeHtml(lead.whatsapp)}</span>
            </a>
          </td>
          <td>
            <select class="status-selector" data-lead-id="${lead.id}" aria-label="Alterar status de ${escapeHtml(lead.nome)}">
              <option value="Novo" ${lead.status === 'Novo' ? 'selected' : ''}>Novo</option>
              <option value="Em atendimento" ${lead.status === 'Em atendimento' ? 'selected' : ''}>Em atendimento</option>
              <option value="Aguardando retorno" ${lead.status === 'Aguardando retorno' ? 'selected' : ''}>Aguardando retorno</option>
              <option value="Concluído" ${lead.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
            </select>
          </td>
          <td style="text-align: right;">
            <button type="button" class="btn-action-view" data-action="details" data-lead-id="${lead.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              <span>Detalhes</span>
            </button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;

    // Attach event listeners aos seletores de status da tabela
    tableBody.querySelectorAll('.status-selector').forEach((select) => {
      select.addEventListener('change', async (e) => {
        const leadId = e.target.getAttribute('data-lead-id');
        const newStatus = e.target.value;
        await updateLeadStatus(leadId, newStatus);
      });
    });

    // Attach event listeners aos botões de detalhes
    tableBody.querySelectorAll('[data-action="details"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const leadId = btn.getAttribute('data-lead-id');
        const lead = allLeads.find((item) => item.id === leadId);
        if (lead) openLeadDetails(lead);
      });
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // ATUALIZAÇÃO MANUAL DE STATUS
  // ==========================================================================
  async function updateLeadStatus(leadId, newStatus) {
    const supabase = window.SupabaseApp ? window.SupabaseApp.getClient() : null;

    // Atualização otimista local
    const lead = allLeads.find((item) => item.id === leadId);
    if (lead) {
      lead.status = newStatus;
      lead.updated_at = new Date().toISOString();
      updateMetrics();
    }

    if (!supabase) {
      // Salva no mock local
      localStorage.setItem(window.SupabaseApp.STORAGE_KEYS.LOCAL_LEADS, JSON.stringify(allLeads));
      showToast(`Status atualizado para "${newStatus}"!`);
      renderTable();
      return;
    }

    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      showToast(`Status de ${lead ? lead.nome : 'solicitação'} atualizado para "${newStatus}"!`);
      renderTable();
    } catch (err) {
      console.error('Erro ao atualizar status no Supabase:', err);
      showToast('Falha ao atualizar status no banco de dados.');
      // Reverte
      fetchLeads(true);
    }
  }

  // ==========================================================================
  // MODAL DE DETALHES
  // ==========================================================================
  function openLeadDetails(lead) {
    activeModalLead = lead;
    populateLeadModal(lead);
    modalLead.classList.add('is-open');
    modalLead.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function populateLeadModal(lead) {
    modalNome.textContent = lead.nome || '—';
    modalWhatsapp.textContent = lead.whatsapp || '—';
    modalWaLink.href = getWhatsAppUrl(lead.nome, lead.whatsapp);

    modalPref.textContent = lead.apenas_contato
      ? 'Quero apenas que o advogado entre em contato comigo (Sem prévia escrita)'
      : 'Visitante optou por antecipar detalhes do caso';

    modalDescricao.textContent = lead.descricao_caso ? lead.descricao_caso : 'Nenhum detalhe adicional informado.';

    const createdDt = formatDateTime(lead.created_at);
    const updatedDt = formatDateTime(lead.updated_at);
    modalCreated.textContent = createdDt.full;
    modalUpdated.textContent = updatedDt.full;

    // Botões de escolha de status
    modalStatusChoices.querySelectorAll('.btn-status-choice').forEach((btn) => {
      const st = btn.getAttribute('data-status');
      if (st === lead.status) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });

    modalFeedback.textContent = '';
  }

  function closeLeadDetails() {
    modalLead.classList.remove('is-open');
    modalLead.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeModalLead = null;
  }

  // ==========================================================================
  // CONFIGURAÇÃO SUPABASE MODAL
  // ==========================================================================
  function openConfigModal() {
    const config = window.SupabaseApp ? window.SupabaseApp.getStoredConfig() : { url: '', anonKey: '' };
    cfgUrlInput.value = config.url || '';
    cfgAnonInput.value = config.anonKey || '';
    cfgStatusMsg.style.display = 'none';

    modalConfig.classList.add('is-open');
    modalConfig.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeConfigModal() {
    modalConfig.classList.remove('is-open');
    modalConfig.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ==========================================================================
  // EVENTOS E FILTROS
  // ==========================================================================
  function initFiltersAndSearch() {
    // Busca em tempo real
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim();
      searchClearBtn.style.display = searchQuery ? 'block' : 'none';
      renderTable();
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClearBtn.style.display = 'none';
      renderTable();
      searchInput.focus();
    });

    // Pílulas de filtro de status
    filterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        filterPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.getAttribute('data-filter') || 'Todos';
        renderTable();
      });
    });

    // Botão de recarregar
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        fetchLeads();
      });
    }
  }

  function initModals() {
    if (btnCloseLeadModal) btnCloseLeadModal.addEventListener('click', closeLeadDetails);
    if (btnSaveLeadDetails) btnSaveLeadDetails.addEventListener('click', closeLeadDetails);

    modalLead.addEventListener('click', (e) => {
      if (e.target === modalLead) closeLeadDetails();
    });

    // Ação ao clicar nos botões de status do modal
    modalStatusChoices.querySelectorAll('.btn-status-choice').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!activeModalLead) return;
        const newStatus = btn.getAttribute('data-status');
        await updateLeadStatus(activeModalLead.id, newStatus);
        modalStatusChoices.querySelectorAll('.btn-status-choice').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        modalFeedback.textContent = `Status alterado para "${newStatus}" com sucesso!`;
      });
    });

    // Modal de Configurações
    if (btnOpenConfigAuth) btnOpenConfigAuth.addEventListener('click', openConfigModal);
    if (btnOpenConfigHeader) btnOpenConfigHeader.addEventListener('click', openConfigModal);
    if (btnCloseConfig) btnCloseConfig.addEventListener('click', closeConfigModal);
    if (btnCancelConfig) btnCancelConfig.addEventListener('click', closeConfigModal);

    modalConfig.addEventListener('click', (e) => {
      if (e.target === modalConfig) closeConfigModal();
    });

    if (btnSaveConfig) {
      btnSaveConfig.addEventListener('click', () => {
        const url = cfgUrlInput.value.trim();
        const anon = cfgAnonInput.value.trim();

        if (url && !url.startsWith('https://')) {
          cfgStatusMsg.style.display = 'block';
          cfgStatusMsg.style.background = 'rgba(230, 90, 90, 0.2)';
          cfgStatusMsg.style.color = '#FFA5A5';
          cfgStatusMsg.textContent = 'A URL do Supabase deve começar com https://';
          return;
        }

        if (window.SupabaseApp) {
          window.SupabaseApp.setCredentials(url, anon);
          cfgStatusMsg.style.display = 'block';
          cfgStatusMsg.style.background = 'rgba(75, 181, 67, 0.2)';
          cfgStatusMsg.style.color = '#8CE39B';
          cfgStatusMsg.textContent = 'Credenciais salvas com sucesso! Reiniciando conexão...';

          setTimeout(() => {
            closeConfigModal();
            initAuth();
          }, 1000);
        }
      });
    }

    // Tecla ESC para fechar qualquer modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modalLead.classList.contains('is-open')) closeLeadDetails();
        if (modalConfig.classList.contains('is-open')) closeConfigModal();
      }
    });
  }

  function initEvents() {
    // Escuta evento customizado de novos leads locais (durante testes)
    window.addEventListener('rc-local-lead-created', (e) => {
      const newLead = e.detail;
      allLeads.unshift(newLead);
      renderTable(newLead.id);
      updateMetrics();
      showToast(`Nova solicitação recebida: ${newLead.nome}!`);
    });
  }

})();
