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
      id: "inicio",
      href: "inicio.html",
      icone: "bi-house-door",
      rotulo: "Início",
      titulo: "Tela inicial",
      permissao: null,
    },
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
      '<a class="topbar-brand" href="inicio.html" title="Ir para a tela inicial">' +
      '<img src="src/assets/logo-docisis.svg" alt="Docisis — Gestão Profissional de Confeitaria" class="topbar-logo"></a>' +
      '<div class="topbar-user">' +
      (auth.temPermissao("NOTIFICACAO_CONSULTAR")
        ? '<a href="notificacoes.html" id="topbar-sino" class="topbar-sino position-relative text-decoration-none" ' +
          'title="Central de notificações" aria-label="Central de notificações">' +
          '<i class="bi bi-bell fs-5 text-secondary" aria-hidden="true"></i>' +
          '<span id="topbar-sino-badge" class="topbar-sino-badge d-none">0</span></a>'
        : "") +
      '<a class="user-profile-badge text-decoration-none" href="funcionario.html" title="Meu perfil">' +
      `<span class="fw-semibold user-name-text" title="${util.esc(nome)}${usuario.cargo ? " (" + util.esc(usuario.cargo) + ")" : ""}">${util.esc(nome)}</span>` +
      '<div id="topbar-avatar" class="avatar-sm d-flex align-items-center justify-content-center bg-light fw-bold border rounded-circle overflow-hidden" ' +
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

    carregarAvatarTopbar(usuario);
    atualizarSino();
  }

  /** Atualiza o contador de não lidas do sininho (silencioso se falhar). */
  async function atualizarSino(total) {
    const badge = document.getElementById("topbar-sino-badge");
    if (!badge) return;
    if (typeof total !== "number") {
      const r = await Docisis.api("/notificacoes/resumo");
      if (!r.ok || !r.data || !r.data.nao_lidas) return;
      total = Number(r.data.nao_lidas.total) || 0;
    }
    badge.textContent = total > 99 ? "99+" : String(total);
    badge.classList.toggle("d-none", total <= 0);
  }

  // Estilo do sino embutido aqui para funcionar em qualquer página, sem depender de CSS extra
  (function injetarEstiloSino() {
    if (document.getElementById("estilo-sino")) return;
    const st = document.createElement("style");
    st.id = "estilo-sino";
    st.textContent =
      ".topbar-sino{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;margin-right:.5rem}" +
      ".topbar-sino:hover{background:rgba(0,0,0,.05)}" +
      ".topbar-sino-badge{position:absolute;top:2px;right:0;min-width:18px;height:18px;padding:0 5px;border-radius:9px;" +
      "background:#dc3545;color:#fff;font-size:.68rem;font-weight:700;line-height:18px;text-align:center}";
    document.head.appendChild(st);
  })();

  /**
   * Baixa a foto do funcionário (a rota exige o token, então não dá para usar <img src>).
   * Devolve uma URL local (blob:) ou null se não houver foto / der erro.
   */
  async function fotoUrl(idFuncionario) {
    if (!idFuncionario) return null;
    const r = await Docisis.api(
      `/funcionarios/${encodeURIComponent(idFuncionario)}/foto`,
      { resposta: "blob" },
    );
    return r.ok && r.data ? URL.createObjectURL(r.data) : null;
  }

  let urlAvatar = null;
  async function carregarAvatarTopbar(usuario) {
    if (!usuario || !usuario.temFoto) return;
    const url = await fotoUrl(usuario.id);
    const caixa = document.getElementById("topbar-avatar");
    if (!url || !caixa) return;
    if (urlAvatar) URL.revokeObjectURL(urlAvatar);
    urlAvatar = url;
    caixa.innerHTML = "";
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    caixa.appendChild(img);
    caixa.setAttribute("aria-label", "Foto do usuário");
  }

  /** @param {string} ativo id do item do MENU que representa a página atual */
  function montar(ativo) {
    montarSidebar(ativo);
    montarTopbar();
  }

  // atualizarTopbar: refaz só a barra superior (use depois de mudar nome ou foto)
  Docisis.layout = {
    montar,
    atualizarTopbar: montarTopbar,
    atualizarSino,
    fotoUrl,
    MENU,
  };
})(window);
