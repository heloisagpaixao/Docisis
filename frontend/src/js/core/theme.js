/**
 * DOCISIS - TEMA CLARO/ESCURO (theme.js)
 * Carregue no <head>, ANTES dos CSS, para a página já nascer no tema certo (sem piscar branco):
 *   <script src="src/js/core/theme.js"></script>
 *
 * Ordem de decisão: escolha salva pelo usuário > preferência do sistema (prefers-color-scheme) > claro.
 * Marca <html data-theme="dark|light"> e <html data-bs-theme="dark|light"> (o Bootstrap 5.3+ usa este).
 * Não depende de nenhum outro arquivo.
 */
(function (global) {
  "use strict";

  const CHAVE = "docisis.tema"; // 'claro' | 'escuro' (ausente = seguir o sistema)
  const raiz = document.documentElement;
  const consulta = global.matchMedia
    ? global.matchMedia("(prefers-color-scheme: dark)")
    : null;

  function lerEscolha() {
    try {
      const v = localStorage.getItem(CHAVE);
      return v === "claro" || v === "escuro" ? v : null;
    } catch {
      return null;
    }
  }

  function gravarEscolha(v) {
    try {
      localStorage.setItem(CHAVE, v);
    } catch {
      /* sem storage: vale só nesta página */
    }
  }

  function efetivo() {
    const escolha = lerEscolha();
    if (escolha) return escolha;
    return consulta && consulta.matches ? "escuro" : "claro";
  }

  function aplicar() {
    const escuro = efetivo() === "escuro";
    raiz.setAttribute("data-theme", escuro ? "dark" : "light");
    raiz.setAttribute("data-bs-theme", escuro ? "dark" : "light");
    raiz.style.colorScheme = escuro ? "dark" : "light";
    document.dispatchEvent(
      new CustomEvent("docisis:tema", {
        detail: { tema: escuro ? "escuro" : "claro" },
      }),
    );
  }

  function definir(tema) {
    gravarEscolha(tema === "escuro" ? "escuro" : "claro");
    aplicar();
  }

  function alternar() {
    definir(efetivo() === "escuro" ? "claro" : "escuro");
  }

  // se o usuário nunca escolheu, acompanha mudanças do sistema em tempo real
  if (consulta && consulta.addEventListener) {
    consulta.addEventListener("change", () => {
      if (!lerEscolha()) aplicar();
    });
  }

  aplicar();

  const Docisis = (global.Docisis = global.Docisis || {});
  Docisis.tema = {
    obter: efetivo,
    definir,
    alternar,
    escuro: () => efetivo() === "escuro",
  };
})(window);
