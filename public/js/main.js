/**
 * Ricardo Cassiano Advogado - Main JavaScript
 * High performance vanilla script, zero dependencies.
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initSpotlightCards();
  initCounter();
  initSmoothScroll();
  initReviewsSlider();
  initContactForm();
  initPrivacyModal();
});

/* ==========================================================================
   Header Scroll State
   ========================================================================== */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ==========================================================================
   Mobile Navigation Drawer
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!toggleBtn || !drawer || !overlay) return;

  function toggleMenu(isOpen) {
    drawer.classList.toggle('open', isOpen);
    overlay.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    toggleMenu(!isOpen);
  });

  overlay.addEventListener('click', () => toggleMenu(false));

  navLinks.forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      toggleMenu(false);
    }
  });
}

/* ==========================================================================
   Interactive Card Mouse Spotlight
   ========================================================================== */
function initSpotlightCards() {
  const cardsContainer = document.querySelector('.areas-grid');
  const cards = document.querySelectorAll('.area-card');

  if (!cardsContainer || !cards.length) return;

  cardsContainer.addEventListener('mousemove', (e) => {
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  cardsContainer.addEventListener('mouseleave', () => {
    cards.forEach((card) => {
      card.style.setProperty('--mouse-x', '-999px');
      card.style.setProperty('--mouse-y', '-999px');
    });
  });
}

/* ==========================================================================
   Animated Number Counter
   ========================================================================== */
function initCounter() {
  const counterEl = document.querySelector('[data-counter-target]');
  if (!counterEl) return;

  const target = parseInt(counterEl.getAttribute('data-counter-target'), 10) || 100;
  let started = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !started) {
        started = true;
        animateNumber(counterEl, target, 2000);
      }
    });
  }, { threshold: 0.5 });

  observer.observe(counterEl);
}

function animateNumber(el, target, duration) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(easeProgress * (target - start) + start);

    el.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

/* ==========================================================================
   Smooth Scroll & Active Link Highlight
   ========================================================================== */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  const sections = document.querySelectorAll('section[id], header[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  links.forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height'), 10) || 80;
        const targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerHeight + 10;
        
        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
      }
    });
  });

  // Active section spy
  window.addEventListener('scroll', () => {
    let current = '';
    const headerHeight = 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - headerHeight;
      const sectionHeight = section.offsetHeight;
      if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/* ==========================================================================
   Google Reviews Slider (Carrossel Interativo)
   ========================================================================== */
function initReviewsSlider() {
  const track = document.getElementById('reviewsTrack');
  const trackWrap = document.getElementById('reviewsTrackWrap');
  const prevBtn = document.getElementById('reviewsPrevBtn');
  const nextBtn = document.getElementById('reviewsNextBtn');

  if (!track || !trackWrap) return;

  const cards = track.querySelectorAll('.review-card');
  if (!cards.length) return;

  let currentIndex = 0;
  let autoplayTimer = null;
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;

  function getVisibleCards() {
    return window.innerWidth <= 860 ? 1 : 2;
  }

  function getMaxIndex() {
    const visible = getVisibleCards();
    return Math.max(0, cards.length - visible);
  }

  function getStepWidth() {
    const card = cards[0];
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.gap) || 20;
    return card.offsetWidth + gap;
  }

  function updateSlider(animate = true) {
    const step = getStepWidth();
    const maxIdx = getMaxIndex();
    if (currentIndex > maxIdx) currentIndex = maxIdx;
    if (currentIndex < 0) currentIndex = 0;

    const translate = -(currentIndex * step);
    track.style.transition = animate ? 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
    track.style.transform = `translateX(${translate}px)`;
    currentTranslate = translate;
    prevTranslate = translate;
  }

  function slideNext() {
    const maxIdx = getMaxIndex();
    if (currentIndex >= maxIdx) {
      currentIndex = 0;
    } else {
      currentIndex++;
    }
    updateSlider(true);
  }

  function slidePrev() {
    const maxIdx = getMaxIndex();
    if (currentIndex <= 0) {
      currentIndex = maxIdx;
    } else {
      currentIndex--;
    }
    updateSlider(true);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      slideNext();
      restartAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      slidePrev();
      restartAutoplay();
    });
  }

  // Autoplay functionality
  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      slideNext();
    }, 5000);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  trackWrap.addEventListener('mouseenter', stopAutoplay);
  trackWrap.addEventListener('mouseleave', startAutoplay);

  // Touch and pointer drag functionality
  function touchStart(e) {
    isDragging = true;
    startX = getPositionX(e);
    trackWrap.classList.add('grabbing');
    stopAutoplay();
    track.style.transition = 'none';
  }

  function touchMove(e) {
    if (!isDragging) return;
    const currentX = getPositionX(e);
    const diff = currentX - startX;
    track.style.transform = `translateX(${prevTranslate + diff}px)`;
  }

  function touchEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    trackWrap.classList.remove('grabbing');
    const currentX = getPositionX(e);
    const diff = currentX - startX;

    if (diff < -50) {
      slideNext();
    } else if (diff > 50) {
      slidePrev();
    } else {
      updateSlider(true);
    }
    startAutoplay();
  }

  function getPositionX(e) {
    return e.type.includes('mouse') ? e.pageX : (e.touches && e.touches[0] ? e.touches[0].clientX : (e.changedTouches ? e.changedTouches[0].clientX : 0));
  }

  // Mouse drag
  trackWrap.addEventListener('mousedown', touchStart);
  window.addEventListener('mousemove', touchMove);
  window.addEventListener('mouseup', touchEnd);

  // Touch events
  trackWrap.addEventListener('touchstart', touchStart, { passive: true });
  trackWrap.addEventListener('touchmove', touchMove, { passive: true });
  trackWrap.addEventListener('touchend', touchEnd);

  // Resize handler
  window.addEventListener('resize', () => {
    updateSlider(false);
  });

  // Init
  updateSlider(false);
  startAutoplay();
}

/* ==========================================================================
   Contact Case Form (Supabase Integration)
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('form-solicitar-contato');
  if (!form) return;

  const inputNome = document.getElementById('lead-nome');
  const inputWhatsapp = document.getElementById('lead-whatsapp');
  const checkApenasContato = document.getElementById('lead-apenas-contato');
  const descGroup = document.getElementById('group-descricao-caso');
  const inputDescricao = document.getElementById('lead-descricao');
  const charCounter = document.getElementById('char-counter');
  const submitBtn = document.getElementById('btn-solicitar-contato');
  const feedbackBox = document.getElementById('form-submission-feedback');

  const errorNome = document.getElementById('error-lead-nome');
  const errorWhatsapp = document.getElementById('error-lead-whatsapp');
  const errorDescricao = document.getElementById('error-lead-descricao');

  // Máscara dinâmica de telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  function formatBRPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  if (inputWhatsapp) {
    inputWhatsapp.addEventListener('input', (e) => {
      const cursorAtEnd = e.target.selectionStart === e.target.value.length;
      e.target.value = formatBRPhone(e.target.value);
      if (cursorAtEnd) {
        e.target.selectionStart = e.target.selectionEnd = e.target.value.length;
      }
      clearFieldError(inputWhatsapp, errorWhatsapp);
    });
  }

  // Alternância do campo de descrição do caso
  if (checkApenasContato && descGroup && inputDescricao) {
    checkApenasContato.addEventListener('change', () => {
      const isOnlyContact = checkApenasContato.checked;
      if (isOnlyContact) {
        descGroup.classList.add('is-hidden');
        inputDescricao.setAttribute('disabled', 'disabled');
      } else {
        descGroup.classList.remove('is-hidden');
        inputDescricao.removeAttribute('disabled');
      }
    });
  }

  // Contador de caracteres em tempo real
  if (inputDescricao && charCounter) {
    inputDescricao.addEventListener('input', () => {
      const len = inputDescricao.value.length;
      charCounter.textContent = `${len} / 3000`;
    });
  }

  // Limpeza de erros ao digitar
  if (inputNome) {
    inputNome.addEventListener('input', () => clearFieldError(inputNome, errorNome));
  }

  function setFieldError(input, errorElement, message) {
    if (input) input.classList.add('is-invalid');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');
    }
  }

  function clearFieldError(input, errorElement) {
    if (input) input.classList.remove('is-invalid');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    }
  }

  function clearAllErrors() {
    clearFieldError(inputNome, errorNome);
    clearFieldError(inputWhatsapp, errorWhatsapp);
    clearFieldError(inputDescricao, errorDescricao);
    if (feedbackBox) {
      feedbackBox.className = 'form-submission-feedback';
      feedbackBox.textContent = '';
      feedbackBox.style.display = 'none';
    }
  }

  // Prevenção contra múltiplos envios simultâneos
  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    clearAllErrors();

    const hpField = form.querySelector('input[name="_hp"]');
    const hpValue = hpField ? hpField.value : '';

    const nome = inputNome ? inputNome.value.trim() : '';
    const whatsapp = inputWhatsapp ? inputWhatsapp.value.trim() : '';
    const apenasContato = checkApenasContato ? checkApenasContato.checked : false;
    const descricao = inputDescricao ? inputDescricao.value.trim() : '';

    let hasError = false;

    // Validação do Nome
    if (!nome) {
      setFieldError(inputNome, errorNome, 'Por favor, informe seu nome completo.');
      hasError = true;
    } else if (nome.length < 3) {
      setFieldError(inputNome, errorNome, 'O nome deve conter pelo menos 3 caracteres.');
      hasError = true;
    }

    // Validação do WhatsApp
    const digitsOnly = whatsapp.replace(/\D/g, '');
    if (!whatsapp) {
      setFieldError(inputWhatsapp, errorWhatsapp, 'Por favor, informe seu número de WhatsApp.');
      hasError = true;
    } else if (digitsOnly.length < 10) {
      setFieldError(inputWhatsapp, errorWhatsapp, 'Informe um número com DDD válido (mínimo 10 dígitos).');
      hasError = true;
    }

    // Validação de Descrição (se preenchida)
    if (!apenasContato && descricao.length > 3000) {
      setFieldError(inputDescricao, errorDescricao, 'A descrição deve ter no máximo 3000 caracteres.');
      hasError = true;
    }

    if (hasError) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Estado de carregamento
    isSubmitting = true;
    submitBtn.classList.add('is-loading');
    submitBtn.setAttribute('disabled', 'disabled');

    try {
      if (!window.SupabaseApp) {
        throw new Error('Serviço de comunicação não disponível no momento. Tente novamente mais tarde.');
      }

      const response = await window.SupabaseApp.submitSolicitacao({
        nome,
        whatsapp,
        apenas_contato: apenasContato,
        descricao_caso: apenasContato ? '' : descricao,
        _hp: hpValue
      });

      // Sucesso na gravação
      feedbackBox.className = 'form-submission-feedback is-success';
      feedbackBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div>
          <strong>${response.message || 'Solicitação enviada com sucesso! Entraremos em contato assim que possível.'}</strong>
        </div>
      `;
      feedbackBox.style.display = 'flex';

      // Limpa os campos após persistência bem-sucedida
      form.reset();
      if (charCounter) charCounter.textContent = '0 / 3000';
      if (descGroup && inputDescricao) {
        descGroup.classList.remove('is-hidden');
        inputDescricao.removeAttribute('disabled');
      }

      // Rola suavemente para a confirmação
      feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      console.error('Erro no envio do formulário:', err);
      // Preserva dados digitados e avisa o visitante
      feedbackBox.className = 'form-submission-feedback is-error';
      feedbackBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div>
          <strong>Não foi possível enviar sua solicitação no momento.</strong>
          <p style="font-size:12.5px;margin-top:2px;">Por favor, verifique os dados ou fale diretamente pelo botão do WhatsApp.</p>
        </div>
      `;
      feedbackBox.style.display = 'flex';
    } finally {
      isSubmitting = false;
      submitBtn.classList.remove('is-loading');
      submitBtn.removeAttribute('disabled');
    }
  });
}

/* ==========================================================================
   Privacy Policy Modal
   ========================================================================== */
function initPrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  const openBtn = document.getElementById('btn-open-privacy-modal');
  const closeBtn = document.getElementById('btn-close-privacy-modal');
  const confirmBtn = document.getElementById('btn-confirm-privacy-modal');

  if (!modal) return;

  function openModal(e) {
    if (e) e.preventDefault();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (confirmBtn) confirmBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}
