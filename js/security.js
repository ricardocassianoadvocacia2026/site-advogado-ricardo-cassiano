/**
 * Ricardo Cassiano Advogado - Proteção contra Inspeção e DevTools
 * Bloqueia F12, atalhos de desenvolvedor, clique direito e depuração não autorizada.
 */
(function() {
  'use strict';

  function preventAction(e) {
    if (!e) return;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    e.returnValue = false;
  }

  // 1. Bloqueio de atalhos de teclado (F12, Ctrl+Shift+I, etc.)
  function blockKeyCombinations(e) {
    if (!e) return;
    const key = e.key || '';
    const keyCode = e.keyCode || e.which || 0;
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // F12
    if (key === 'F12' || keyCode === 123) {
      preventAction(e);
      return false;
    }

    if (isCtrlOrMeta) {
      // Ctrl + Shift + I (Inspecionar)
      // Ctrl + Shift + J (Console)
      // Ctrl + Shift + C (Selecionar elemento)
      // Ctrl + Shift + K (Console no Firefox)
      if (e.shiftKey) {
        const upper = key.toUpperCase();
        if (
          upper === 'I' || keyCode === 73 ||
          upper === 'J' || keyCode === 74 ||
          upper === 'C' || keyCode === 67 ||
          upper === 'K' || keyCode === 75
        ) {
          preventAction(e);
          return false;
        }
      }

      // Ctrl + U (Ver código fonte)
      if (key.toUpperCase() === 'U' || keyCode === 85) {
        preventAction(e);
        return false;
      }

      // Ctrl + S (Salvar página)
      if (key.toUpperCase() === 'S' || keyCode === 83) {
        preventAction(e);
        return false;
      }
    }
  }

  window.addEventListener('keydown', blockKeyCombinations, true);
  document.addEventListener('keydown', blockKeyCombinations, true);

  // 2. Bloqueio do menu de contexto (botão direito do mouse)
  window.addEventListener('contextmenu', function(e) {
    preventAction(e);
    return false;
  }, true);
  document.addEventListener('contextmenu', function(e) {
    preventAction(e);
    return false;
  }, true);

  // 3. Prevenção contra arrastar conteúdo para inspecionar
  document.addEventListener('dragstart', function(e) {
    preventAction(e);
    return false;
  }, false);

  // 4. Anti-DevTools Debugger Loop
  // Quando o DevTools é aberto, este debugger pausa a execução imediatamente,
  // inviabilizando o uso do DevTools/inspeção de código.
  function launchAntiDebug() {
    try {
      (function() {
        return false;
      }['constructor']('debugger')());
    } catch (err) {}
  }

  setInterval(launchAntiDebug, 250);

  // 5. Limpeza de logs do console para impedir inspeção de objetos em memória
  try {
    const noop = function() {};
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace'];
    for (let i = 0; i < methods.length; i++) {
      if (window.console && window.console[methods[i]]) {
        window.console[methods[i]] = noop;
      }
    }
  } catch (e) {}

})();
