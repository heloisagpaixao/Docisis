/**
 * DOCISIS - CONFIGURAÇÃO GLOBAL (config.js)
 * Único lugar onde ficam a URL da API e os nomes de páginas/chaves.
 * Deve ser o PRIMEIRO script carregado em cada página.
 */
(function (global) {
  "use strict";

  const Docisis = (global.Docisis = global.Docisis || {});

  Docisis.config = Object.freeze({
    // URL base do back-end Express (a porta vem do server.js / .env do back)
    API_URL: "http://localhost:3000",

    // Páginas usadas nos redirecionamentos
    PAGINA_LOGIN: "login.html",
    PAGINA_INICIAL: "inicio.html",

    // Prefixo das chaves no localStorage (evita colisão com outras apps em localhost)
    STORAGE_PREFIX: "docisis.",
  });
})(window);
