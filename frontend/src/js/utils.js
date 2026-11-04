/**
 * DOCISIS - UTILITÁRIOS COMPARTILHADOS (utils.js)
 * Formatadores, escape de HTML, debounce e toast.
 * Não depende de nenhum outro arquivo do core.
 */
(function (global) {
  "use strict";

  const Docisis = (global.Docisis = global.Docisis || {});

  /** Escapa texto antes de colocar em innerHTML (evita XSS com nomes vindos do banco). */
  function esc(valor) {
    return String(valor ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  /** "2026-11-20" -> "20/11/2026" (sem passar por Date, para não deslocar o fuso). */
  function formatarData(iso) {
    if (!iso) return "--";
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(iso);
    return isNaN(d) ? String(iso) : d.toLocaleDateString("pt-BR");
  }

  function formatarNumero(n, casas = 0) {
    return Number(n || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });
  }

  function formatarCPF(v) {
    v = String(v || "")
      .replace(/\D/g, "")
      .slice(0, 11);
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatarTelefone(v) {
    v = String(v || "")
      .replace(/\D/g, "")
      .slice(0, 11);
    if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (v.length > 5)
      return v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    if (v.length > 2) return v.replace(/^(\d{2})(\d+)/, "($1) $2");
    return v;
  }

  /** "Carlos Eduardo" -> "CE" */
  function iniciais(nome) {
    const partes = String(nome || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!partes.length) return "DC";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function debounce(fn, ms = 350) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  /* ---------------------------- Toast ---------------------------- */
  const ICONES_TOAST = {
    sucesso: "bi-check-circle-fill text-success",
    erro: "bi-exclamation-triangle-fill text-danger",
    aviso: "bi-exclamation-circle-fill text-warning",
    info: "bi-info-circle-fill text-primary",
  };
  let toastTimer = null;

  /** Notificação flutuante. tipo: 'sucesso' | 'erro' | 'aviso' | 'info'. */
  function toast(mensagem, tipo = "sucesso") {
    let el = document.getElementById("docisis-toast");
    if (!el) {
      let caixa = document.querySelector(".docisis-toast-container");
      if (!caixa) {
        caixa = document.createElement("div");
        caixa.className = "docisis-toast-container";
        caixa.setAttribute("aria-live", "polite");
        caixa.setAttribute("aria-atomic", "true");
        document.body.appendChild(caixa);
      }
      el = document.createElement("div");
      el.id = "docisis-toast";
      el.className = "docisis-toast";
      el.setAttribute("role", "status");
      el.innerHTML =
        '<i class="bi toast-icon fs-5" aria-hidden="true"></i>' +
        '<div><strong class="d-block text-dark fw-bold">Docisis</strong>' +
        '<span id="toast-mensagem" class="text-muted"></span></div>';
      caixa.appendChild(el);
    }
    el.querySelector("#toast-mensagem").textContent = mensagem;
    const icone = el.querySelector(".toast-icon");
    if (icone)
      icone.className =
        "bi toast-icon fs-5 " + (ICONES_TOAST[tipo] || ICONES_TOAST.sucesso);

    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 4000);
  }

  Docisis.util = {
    esc,
    formatarData,
    formatarNumero,
    formatarCPF,
    formatarTelefone,
    iniciais,
    debounce,
  };
  Docisis.toast = toast;
})(window);
