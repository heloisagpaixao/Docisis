/**
 * DOCISIS - LAYOUT COMPARTILHADO (layout.js)
 * Monta a barra lateral e a barra superior em TODAS as páginas internas.
 * O menu existe só aqui: para adicionar/remover item ou mudar permissão, edite MENU.
 * Depende de: config.js, auth.js, api.js, utils.js
 *
 * No HTML da página, basta:
 *   <aside class="sidebar-docisis" id="sidebar-docisis"></aside>
 *   <header class="topbar-docisis" id="topbar-docisis"></header>
 * e, no script da página:  Docisis.layout.montar('estoque');
 */
(function (global) {
  "use strict";

  const Docisis = (global.Docisis = global.Docisis || {});
  const { auth, util } = Docisis;

  // permissao: nome da permissão exigida (null = todos os logados veem)
  const MENU = [
    {
      id: "admin",
      href: "usuarios.html",
      icone: "bi-shield-lock-fill",
      rotulo: "Admin",
      titulo: "Gestão de usuários e permissões",
      permissao: "FUNCIONARIO_GERENCIAR",
    },
    {
      id: "produtos",
      href: "produtos.html",
      icone: "bi-plus-square",
      rotulo: "Produtos",
      titulo: "Cadastro de produtos",
      permissao: "PRODUTO_GERENCIAR",
    },
    {
      id: "historico",
      href: "historico.html",
      icone: "bi-clock-history",
      rotulo: "Histórico",
      titulo: "Histórico de movimentações",
      permissao: null,
    },
    {
      id: "estoque",
      href: "estoque.html",
      icone: "bi-box-seam",
      rotulo: "Estoque",
      titulo: "Gestão de estoque",
      permissao: "ESTOQUE_CONSULTAR",
    },
    {
      id: "ajustes",
      href: "funcionario.html",
      icone: "bi-gear",
      rotulo: "Ajustes",
      titulo: "Meu perfil e configurações",
      permissao: null,
    },
  ];

  function montarSidebar(ativo) {
    const aside = document.getElementById("sidebar-docisis");
    if (!aside) return;

    const itens = MENU.filter(
      (item) => !item.permissao || auth.temPermissao(item.permissao),
    )
      .map((item) => {
        const atual = item.id === ativo;
        return (
          `<a href="${item.href}" class="sidebar-item${atual ? " active" : ""}"` +
          ` title="${util.esc(item.titulo)}"${atual ? ' aria-current="page"' : ""}>` +
          `<i class="bi ${item.icone} fs-4" aria-hidden="true"></i>` +
          `<span>${util.esc(item.rotulo)}</span></a>`
        );
      })
      .join("");

    aside.setAttribute("aria-label", "Barra de navegação lateral");
    aside.innerHTML = `<nav class="sidebar-nav" aria-label="Navegação principal">${itens}</nav>`;
  }

  function montarTopbar() {
    const header = document.getElementById("topbar-docisis");
    if (!header) return;

    const usuario = auth.getUsuario() || {};
    const nome = usuario.nome || "Usuário";

    header.innerHTML =
      '<a class="topbar-brand" href="estoque.html" title="Ir para a gestão de estoque">' +
      '<img src="src/assets/logo-docisis.svg" alt="Docisis — Gestão Profissional de Confeitaria" class="topbar-logo"></a>' +
      '<div class="topbar-user">' +
      '<a class="user-profile-badge text-decoration-none" href="funcionario.html" title="Meu perfil">' +
      `<span class="fw-semibold user-name-text" title="${util.esc(nome)}${usuario.cargo ? " (" + util.esc(usuario.cargo) + ")" : ""}">${util.esc(nome)}</span>` +
      '<div class="avatar-sm d-flex align-items-center justify-content-center bg-light fw-bold border rounded-circle" ' +
      'aria-label="Iniciais do usuário" style="width:38px;height:38px;font-size:.85rem;color:var(--docisis-navy);">' +
      `${util.esc(util.iniciais(nome))}</div></a>` +
      '<button type="button" id="btn-topbar-logout" class="btn btn-sm btn-outline-secondary ms-2 border-0" ' +
      'title="Encerrar sessão" aria-label="Encerrar sessão e sair">' +
      '<i class="bi bi-box-arrow-right fs-5 text-secondary" aria-hidden="true"></i></button>' +
      "</div>";

    document
      .getElementById("btn-topbar-logout")
      .addEventListener("click", () => {
        if (confirm("Deseja realmente encerrar sua sessão no Docisis?"))
          Docisis.sair();
      });
  }

  /** @param {string} ativo id do item do MENU que representa a página atual */
  function montar(ativo) {
    montarSidebar(ativo);
    montarTopbar();
  }

  Docisis.layout = { montar, MENU };
})(window);
