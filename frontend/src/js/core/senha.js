/**
 * DOCISIS - OLHO "SEGURE PARA MOSTRAR A SENHA" (senha.js)
 * Coloca um botão de olho em TODO <input type="password"> da página, sem mexer no HTML dos campos.
 *  - Mouse/toque: a senha fica visível enquanto o botão estiver pressionado e volta a ocultar ao soltar.
 *  - Teclado: Tab até o olho e segure Espaço ou Enter.
 *  - Oculta sozinha ao sair do campo/janela, ao enviar o formulário e com Esc.
 * Carregue ao final do <body>, depois do Bootstrap Icons (usa as classes bi-eye / bi-eye-slash).
 * Não depende de nenhum outro arquivo do Docisis.
 */
(function () {
  "use strict";

  const ROTULO = "Mostrar senha (mantenha pressionado)";

  function injetarEstilo() {
    if (document.getElementById("estilo-senha-olho")) return;
    const st = document.createElement("style");
    st.id = "estilo-senha-olho";
    st.textContent = `
.dc-pwd-wrap{position:relative;display:block;width:100%;flex:1 1 auto;min-width:0}
.dc-pwd-wrap>input{padding-right:3rem!important}
.dc-pwd-olho{position:absolute;top:0;right:0;bottom:0;width:46px;display:flex;align-items:center;justify-content:center;
  border:0;background:transparent;padding:0;cursor:pointer;color:var(--docisis-text-muted,#64748b);border-radius:0 6px 6px 0;
  touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;z-index:6}
.dc-pwd-olho:hover{color:var(--docisis-text-dark,#0f172a)}
.dc-pwd-olho.ativo{color:var(--docisis-terracotta,#c44918)}
.dc-pwd-olho:focus-visible{outline:2px solid var(--docisis-terracotta,#c44918);outline-offset:-2px}
.dc-pwd-olho i{font-size:1.15rem;pointer-events:none}
.dc-pwd-wrap:has(.is-invalid)~.invalid-feedback{display:block}`;
    document.head.appendChild(st);
  }

  function aprimorar(input) {
    if (input.dataset.olhoSenha) return;
    input.dataset.olhoSenha = "1";

    const wrap = document.createElement("span");
    wrap.className = "dc-pwd-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "dc-pwd-olho";
    botao.setAttribute("aria-label", ROTULO);
    botao.title = "Segure para ver a senha";
    botao.innerHTML = '<i class="bi bi-eye" aria-hidden="true"></i>';
    wrap.appendChild(botao);
    const icone = botao.querySelector("i");

    function mostrar() {
      if (input.type === "text") return;
      const ini = input.selectionStart,
        fim = input.selectionEnd;
      input.type = "text";
      botao.classList.add("ativo");
      icone.className = "bi bi-eye-slash";
      try {
        input.setSelectionRange(ini, fim);
      } catch {
        /* ignora */
      }
    }

    function ocultar() {
      if (input.type === "password") return;
      const ini = input.selectionStart,
        fim = input.selectionEnd;
      input.type = "password";
      botao.classList.remove("ativo");
      icone.className = "bi bi-eye";
      try {
        input.setSelectionRange(ini, fim);
      } catch {
        /* ignora */
      }
    }

    // mouse e toque (pointer events cobrem os dois)
    botao.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault(); // não rouba o foco do campo
      try {
        botao.setPointerCapture(e.pointerId);
      } catch {
        /* ignora */
      }
      mostrar();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) =>
      botao.addEventListener(ev, ocultar),
    );
    botao.addEventListener("contextmenu", (e) => e.preventDefault()); // toque longo no celular

    // teclado: segure Espaço ou Enter
    botao.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        mostrar();
      }
      if (e.key === "Escape") ocultar();
    });
    botao.addEventListener("keyup", (e) => {
      if (e.key === " " || e.key === "Enter") ocultar();
    });
    botao.addEventListener("blur", ocultar);

    // segurança: nunca deixa a senha exposta por engano
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") ocultar();
    });
    window.addEventListener("blur", ocultar);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) ocultar();
    });
    if (input.form) input.form.addEventListener("submit", ocultar);
  }

  function iniciar(raiz) {
    injetarEstilo();
    (raiz || document)
      .querySelectorAll('input[type="password"]')
      .forEach(aprimorar);
  }

  const Docisis = (window.Docisis = window.Docisis || {});
  Docisis.senha = { iniciar };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => iniciar());
  else iniciar();
})();
