/**
 * DOCISIS - LAYOUT COMPARTILHADO (layout.js)
 * Monta a barra lateral (recolhível) e o topo em TODAS as páginas internas.
 * O menu existe só aqui: para adicionar/remover item ou mudar permissão, edite MENU.
 * Depende de: config.js, utils.js, auth.js, api.js  |  CSS: shell.css
 *
 * No HTML da página, basta:
 *   <aside id="sidebar-docisis"></aside>
 *   <header id="topbar-docisis"></header>
 * e, no script da página:  Docisis.layout.montar('estoque');
 * O título do topo vem de TITULOS (abaixo) ou do 2º argumento: montar('estoque', 'Outro título').
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
      id: "estoque",
      href: "estoque.html",
      icone: "bi-box-seam",
      rotulo: "Estoque",
      titulo: "Gestão de estoque",
      permissao: "ESTOQUE_CONSULTAR",
    },
    {
      id: "historico",
      href: "historico.html",
      icone: "bi-clock-history",
      rotulo: "Histórico",
      titulo: "Histórico de movimentações",
      permissao: "ESTOQUE_CONSULTAR",
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
      id: "admin",
      href: "usuarios.html",
      icone: "bi-shield-lock-fill",
      rotulo: "Administração",
      titulo: "Gestão de usuários e permissões",
      permissao: "FUNCIONARIO_GERENCIAR",
    },
  ];

  // Título mostrado no topo (páginas que não estão no menu também entram aqui)
  const TITULOS = {
    inicio: "Início",
    estoque: "Estoque",
    historico: "Histórico",
    produtos: "Cadastro de produtos",
    admin: "Administração",
    notificacoes: "Notificações",
    ajustes: "Meu perfil",
  };

  const CHAVE_RECOLHIDA = "sidebar.recolhida";
  const PERMISSOES_MOVIMENTAR = [
    "ENTRADA_REGISTRAR",
    "SAIDA_REGISTRAR",
    "AJUSTE_REGISTRAR",
  ];
  const esc = util.esc;

  /* ---------------- estado recolhido (guardado no navegador) ---------------- */
  function lerRecolhida() {
    try {
      return (
        localStorage.getItem(
          Docisis.config.STORAGE_PREFIX + CHAVE_RECOLHIDA,
        ) === "1"
      );
    } catch {
      return false;
    }
  }
  function gravarRecolhida(v) {
    try {
      localStorage.setItem(
        Docisis.config.STORAGE_PREFIX + CHAVE_RECOLHIDA,
        v ? "1" : "0",
      );
    } catch {
      /* sem storage: ignora */
    }
  }

  function abrirGaveta(abrir) {
    document.body.classList.toggle("dc-open", abrir);
    const botao = document.getElementById("dc-top-menu");
    if (botao) botao.setAttribute("aria-expanded", String(abrir));
  }

  /* --------------------------------- Barra lateral --------------------------------- */
  function montarSidebar(ativo) {
    const aside = document.getElementById("sidebar-docisis");
    if (!aside) return;
    aside.className = "dc-sidebar";

    const links = MENU.filter(
      (i) => !i.permissao || auth.temPermissao(i.permissao),
    )
      .map((i) => {
        const atual = i.id === ativo;
        return (
          `<a href="${i.href}" class="dc-side-link${atual ? " active" : ""}" title="${esc(i.titulo)}"${atual ? ' aria-current="page"' : ""}>` +
          `<i class="bi ${i.icone}" aria-hidden="true"></i><span class="dc-side-label">${esc(i.rotulo)}</span></a>`
        );
      })
      .join("");

    const podeMovimentar = PERMISSOES_MOVIMENTAR.some((p) =>
      auth.temPermissao(p),
    );
    const cta =
      podeMovimentar && auth.temPermissao("ESTOQUE_CONSULTAR")
        ? '<a href="estoque.html?nova=1" class="dc-side-cta" title="Registrar entrada, saída ou ajuste">' +
          '<i class="bi bi-plus-lg" aria-hidden="true"></i><span class="dc-side-label">Nova movimentação</span></a>'
        : "";

    aside.setAttribute("aria-label", "Barra de navegação lateral");
    aside.innerHTML =
      '<div class="dc-side-brand">' +
      '<div class="dc-side-brand-text"><div class="dc-side-name">Docisis</div><div class="dc-side-sub">Sistema Logístico</div></div>' +
      '<button type="button" id="dc-side-toggle" class="dc-side-toggle" aria-label="Recolher ou expandir a barra lateral" title="Recolher / expandir">' +
      '<i class="bi bi-chevron-double-left" aria-hidden="true"></i></button></div>' +
      `<nav class="dc-side-nav" aria-label="Navegação principal">${links}</nav>` +
      '<div class="dc-side-foot">' +
      cta +
      '<hr class="dc-side-sep">' +
      '<button type="button" id="dc-side-sair" class="dc-side-link" title="Encerrar sessão">' +
      '<i class="bi bi-box-arrow-right" aria-hidden="true"></i><span class="dc-side-label">Sair da conta</span></button></div>';

    document.getElementById("dc-side-toggle").addEventListener("click", () => {
      const recolher = !document.body.classList.contains("dc-collapsed");
      document.body.classList.toggle("dc-collapsed", recolher);
      gravarRecolhida(recolher);
    });

    document.getElementById("dc-side-sair").addEventListener("click", () => {
      if (confirm("Deseja realmente encerrar sua sessão no Docisis?"))
        Docisis.sair();
    });

    // fecha a gaveta ao navegar (mobile)
    aside
      .querySelectorAll("a")
      .forEach((a) => a.addEventListener("click", () => abrirGaveta(false)));

    if (!document.getElementById("dc-overlay")) {
      const ov = document.createElement("div");
      ov.id = "dc-overlay";
      ov.className = "dc-overlay";
      ov.addEventListener("click", () => abrirGaveta(false));
      document.body.appendChild(ov);
    }
  }

  /* ------------------------------------ Topo ------------------------------------ */
  let tituloAtual = "";

  function montarTopbar() {
    const header = document.getElementById("topbar-docisis");
    if (!header) return;
    header.className = "dc-topbar";

    const usuario = auth.getUsuario() || {};
    const nome = usuario.nome || "Usuário";
    const podeBuscar = auth.temPermissao("ESTOQUE_CONSULTAR");
    const buscaAtual = new URLSearchParams(location.search).get("busca") || "";

    header.innerHTML =
      '<button type="button" id="dc-top-menu" class="dc-top-menu" aria-label="Abrir menu" aria-controls="sidebar-docisis" aria-expanded="false">' +
      '<i class="bi bi-list" aria-hidden="true"></i></button>' +
      '<a class="dc-top-brand" href="inicio.html" title="Ir para a tela inicial">' +
      '<img src="src/assets/logo-docisis.svg" alt="Docisis" class="dc-top-logo"></a>' +
      `<h1 class="dc-top-title" id="dc-top-title">${esc(tituloAtual)}</h1>` +
      '<div class="dc-top-actions">' +
      (podeBuscar
        ? '<form class="dc-top-search" id="dc-top-search" role="search" action="estoque.html" method="get">' +
          '<i class="bi bi-search" aria-hidden="true"></i>' +
          `<input type="search" name="busca" maxlength="100" placeholder="Pesquisar produto…" aria-label="Pesquisar produto no estoque" value="${esc(buscaAtual)}"></form>`
        : "") +
      (auth.temPermissao("NOTIFICACAO_CONSULTAR")
        ? '<a href="notificacoes.html" class="dc-top-icon" id="topbar-sino" title="Central de notificações" aria-label="Central de notificações">' +
          '<i class="bi bi-bell" aria-hidden="true"></i><span id="topbar-sino-badge" class="dc-top-badge d-none">0</span></a>'
        : "") +
      '<a href="funcionario.html" class="dc-top-icon" title="Meu perfil e configurações" aria-label="Meu perfil e configurações">' +
      '<i class="bi bi-gear" aria-hidden="true"></i></a>' +
      `<a href="funcionario.html" id="topbar-avatar" class="dc-top-avatar" title="${esc(nome)}${usuario.cargo ? " (" + esc(usuario.cargo) + ")" : ""}" aria-label="Meu perfil">` +
      `${esc(util.iniciais(nome))}</a></div>`;

    document
      .getElementById("dc-top-menu")
      .addEventListener("click", () =>
        abrirGaveta(!document.body.classList.contains("dc-open")),
      );

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
    caixa.appendChild(img);
  }

  /**
   * @param {string} ativo   id da página atual (item do MENU ou chave de TITULOS)
   * @param {string} [titulo] título do topo; se omitido usa TITULOS[ativo]
   */
  function montar(ativo, titulo) {
    tituloAtual = titulo || TITULOS[ativo] || "";
    document.body.classList.add("dc-shell");
    document.body.classList.toggle("dc-collapsed", lerRecolhida());
    montarSidebar(ativo);
    montarTopbar();
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") abrirGaveta(false);
    });
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
