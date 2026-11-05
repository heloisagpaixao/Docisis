/**
 * DOCISIS - CENTRAL DE NOTIFICAÇÕES (notificacoes.js)
 *
 * Endpoints usados:
 *   GET /notificacoes/resumo   -> { ativas, nao_lidas: { CRITICA, ATENCAO, INFO, total } }
 *   GET /notificacoes          -> { dados, total, pagina, limite, totalPaginas }
 *                                 (query: lida, historico, severidade, page/limit)
 *
 * ATENÇÃO: as rotas de AÇÃO abaixo (marcar lida / marcar todas / verificar) não estavam
 * nos arquivos enviados. Se no seu notificacoes.routes.js forem diferentes, ajuste só
 * o objeto ROTAS (caminho e verbos tentados, na ordem).
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { auth, util, layout } = Docisis;
  const { esc } = util;

  if (!auth.exigirLogin()) return;
  layout.montar("notificacoes");
  auth.aplicarPermissoes();

  if (!auth.temPermissao("NOTIFICACAO_CONSULTAR")) {
    document.getElementById("conteudo-principal").innerHTML =
      '<div class="container py-5"><div class="alert alert-warning" role="alert">' +
      "Seu cargo não tem permissão para ver as notificações.</div></div>";
    return;
  }

  /* ----------------------------- Rotas de ação ----------------------------- */
  const ROTAS = {
    lida: (id) => ({
      caminho: `/notificacoes/${encodeURIComponent(id)}/lida`,
      verbos: ["PUT", "POST", "PATCH"],
    }),
    todasLidas: {
      caminho: "/notificacoes/lidas",
      verbos: ["PUT", "POST", "PATCH"],
    },
    verificar: { caminho: "/notificacoes/verificar", verbos: ["POST", "PUT"] },
  };

  const POR_PAGINA = 10;
  const ICONE_SEV = {
    CRITICA: "bi-exclamation-octagon",
    ATENCAO: "bi-exclamation-triangle",
    INFO: "bi-info-circle",
  };
  const ROTULO_SEV = {
    CRITICA: "Crítica",
    ATENCAO: "Atenção",
    INFO: "Informativa",
  };

  const el = (id) => document.getElementById(id);
  const lista = el("lista-notificacoes");
  const estado = {
    aba: "nao_lidas",
    severidade: "",
    pagina: 1,
    totalPaginas: 1,
    total: 0,
  };
  let requisicaoAtual = 0;

  /** Tenta cada verbo até a rota existir (404/405 = verbo/rota errada). */
  async function acao({ caminho, verbos }) {
    let ultimo = null;
    for (const metodo of verbos) {
      ultimo = await Docisis.api(caminho, { method: metodo });
      if (ultimo.ok || (ultimo.status !== 404 && ultimo.status !== 405))
        return ultimo;
    }
    return ultimo;
  }

  async function carregarResumo() {
    const r = await Docisis.api("/notificacoes/resumo");
    if (!r.ok || !r.data) return;
    const n = r.data.nao_lidas || {};
    el("kpi-criticas").textContent = util.formatarNumero(n.CRITICA);
    el("kpi-atencao").textContent = util.formatarNumero(n.ATENCAO);
    el("kpi-info").textContent = util.formatarNumero(n.INFO);
    el("kpi-ativas").textContent = util.formatarNumero(r.data.ativas);
    layout.atualizarSino(Number(n.total) || 0);
  }

  function montarQuery() {
    const q = {
      page: estado.pagina,
      pagina: estado.pagina,
      limit: POR_PAGINA,
      limite: POR_PAGINA,
      severidade: estado.severidade,
    };
    if (estado.aba === "nao_lidas") q.lida = "false";
    if (estado.aba === "historico") q.historico = "true";
    return q;
  }

  function tipoLegivel(tipo) {
    const t = String(tipo || "")
      .replace(/_/g, " ")
      .toLowerCase();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  }

  function itemHtml(n) {
    const sev = ROTULO_SEV[n.severidade] ? n.severidade : "INFO";
    const resolvida = Boolean(n.resolvida_em);
    const classes = ["pn-item", `pn-sev-${sev}`];
    if (!n.lida && !resolvida) classes.push("nao-lida");
    if (resolvida) classes.push("resolvida");

    const meta = [
      `<span class="pn-chip pn-chip-${sev}">${ROTULO_SEV[sev]}</span>`,
      resolvida
        ? '<span class="pn-chip pn-chip-resolvida">Resolvida</span>'
        : "",
      n.tipo ? `<span>${esc(tipoLegivel(n.tipo))}</span>` : "",
      `<span title="${esc(util.formatarDataHora(n.criada_em))}"><i class="bi bi-clock me-1" aria-hidden="true"></i>${esc(util.tempoRelativo(n.criada_em))}</span>`,
      resolvida
        ? `<span>Resolvida em ${esc(util.formatarDataHora(n.resolvida_em))}</span>`
        : "",
    ].join("");

    const acoes = [];
    if (
      !resolvida &&
      auth.temPermissao("ESTOQUE_CONSULTAR") &&
      (n.id_lote || n.id_produto)
    ) {
      acoes.push(
        '<a class="btn btn-sm btn-outline-secondary" href="estoque.html" title="Abrir o estoque"><i class="bi bi-box-seam" aria-hidden="true"></i></a>',
      );
    }
    if (!n.lida && !resolvida) {
      acoes.push(
        `<button type="button" class="btn btn-sm btn-outline-secondary" data-ler="${esc(n.id_notificacao)}" title="Marcar como lida" aria-label="Marcar como lida"><i class="bi bi-check2" aria-hidden="true"></i></button>`,
      );
    }

    return (
      `<li class="${classes.join(" ")}">` +
      `<div class="pn-item-icon"><i class="bi ${ICONE_SEV[sev]}" aria-hidden="true"></i></div>` +
      `<div class="pn-item-corpo"><p class="pn-item-msg">${esc(n.mensagem)}</p><div class="pn-item-meta">${meta}</div></div>` +
      `<div class="pn-item-acoes">${acoes.join("")}</div></li>`
    );
  }

  async function carregarLista() {
    const minha = ++requisicaoAtual;
    lista.innerHTML = '<li class="pn-skeleton">Carregando…</li>';
    const r = await Docisis.api("/notificacoes", { query: montarQuery() });
    if (minha !== requisicaoAtual) return;

    if (!r.ok) {
      lista.innerHTML = `<li class="pn-vazio"><i class="bi bi-wifi-off" aria-hidden="true"></i>${esc(r.error || "Não foi possível carregar as notificações.")}</li>`;
      el("pager-info").textContent = "";
      return;
    }

    const d = r.data || {};
    const itens = d.dados || [];
    estado.total = Number(d.total) || 0;
    estado.totalPaginas = Math.max(1, Number(d.totalPaginas) || 1);
    estado.pagina = Number(d.pagina) || estado.pagina;

    lista.innerHTML = itens.length
      ? itens.map(itemHtml).join("")
      : '<li class="pn-vazio"><i class="bi bi-bell-slash" aria-hidden="true"></i>Nenhuma notificação por aqui.</li>';

    el("pager-info").textContent = estado.total
      ? `Página ${estado.pagina} de ${estado.totalPaginas} · ${util.formatarNumero(estado.total)} notificação(ões)`
      : "";
    el("pager-ant").disabled = estado.pagina <= 1;
    el("pager-prox").disabled = estado.pagina >= estado.totalPaginas;
    el("pager").classList.toggle(
      "d-none",
      estado.totalPaginas <= 1 && !estado.total,
    );
  }

  function recarregar() {
    return Promise.all([carregarResumo(), carregarLista()]);
  }

  /* ------------------------------- Eventos ------------------------------- */
  document.querySelectorAll(".pn-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pn-tab").forEach((b) => {
        const ativo = b === btn;
        b.classList.toggle("active", ativo);
        b.setAttribute("aria-selected", String(ativo));
      });
      estado.aba = btn.dataset.aba;
      estado.pagina = 1;
      carregarLista();
    });
  });

  el("filtro-severidade").addEventListener("change", (e) => {
    estado.severidade = e.target.value;
    estado.pagina = 1;
    carregarLista();
  });

  el("pager-ant").addEventListener("click", () => {
    if (estado.pagina > 1) {
      estado.pagina--;
      carregarLista();
    }
  });
  el("pager-prox").addEventListener("click", () => {
    if (estado.pagina < estado.totalPaginas) {
      estado.pagina++;
      carregarLista();
    }
  });

  lista.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-ler]");
    if (!btn) return;
    btn.disabled = true;
    const r = await acao(ROTAS.lida(btn.dataset.ler));
    if (!r.ok) {
      btn.disabled = false;
      Docisis.toast(r.error || "Não foi possível marcar como lida.", "erro");
      return;
    }
    recarregar();
  });

  el("btn-marcar-todas").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    const r = await acao(ROTAS.todasLidas);
    btn.disabled = false;
    if (!r.ok) {
      Docisis.toast(
        r.error || "Não foi possível marcar todas como lidas.",
        "erro",
      );
      return;
    }
    Docisis.toast(
      "Todas as notificações foram marcadas como lidas.",
      "sucesso",
    );
    estado.pagina = 1;
    recarregar();
  });

  el("btn-verificar").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    const r = await acao(ROTAS.verificar);
    btn.disabled = false;
    if (!r.ok) {
      Docisis.toast(r.error || "Não foi possível verificar agora.", "erro");
      return;
    }
    Docisis.toast("Verificação concluída.", "sucesso");
    estado.pagina = 1;
    recarregar();
  });

  recarregar();
});
