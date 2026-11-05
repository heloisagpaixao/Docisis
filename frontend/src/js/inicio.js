/**
 * DOCISIS - TELA INICIAL (inicio.js)
 *
 * Endpoints usados (cada bloco só aparece/consulta se o cargo permitir e some em silêncio se der 403):
 *   GET /estoque/resumo          -> KPIs                         (ESTOQUE_CONSULTAR)
 *   GET /notificacoes            -> alertas não lidos            (NOTIFICACAO_CONSULTAR)
 *   GET /movimentacoes           -> últimas movimentações
 *
 * Esta página exige apenas login (sem permissão específica) para nunca causar loop de redirecionamento.
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { auth, util, layout } = Docisis;
  const { esc } = util;

  if (!auth.exigirLogin()) return;
  layout.montar("inicio");
  auth.aplicarPermissoes();

  const el = (id) => document.getElementById(id);
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
  const ICONE_MOV = {
    ENTRADA: "bi-box-arrow-in-down",
    SAIDA: "bi-box-arrow-up",
    AJUSTE: "bi-sliders",
  };
  const ROTULO_MOV = { ENTRADA: "Entrada", SAIDA: "Saída", AJUSTE: "Ajuste" };

  /* ------------------------------ Cabeçalho ------------------------------ */
  function saudar() {
    const h = new Date().getHours();
    const periodo = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    const usuario = auth.getUsuario() || {};
    const primeiro = String(usuario.nome || "")
      .trim()
      .split(/\s+/)[0];
    el("saudacao").textContent = primeiro
      ? `${periodo}, ${primeiro}!`
      : `${periodo}!`;
    const hoje = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    el("data-hoje").textContent = hoje.charAt(0).toUpperCase() + hoje.slice(1);
  }

  /* -------------------------------- KPIs --------------------------------- */
  async function carregarKpis() {
    if (!auth.temPermissao("ESTOQUE_CONSULTAR")) return;
    const r = await Docisis.api("/estoque/resumo");
    if (!r.ok || !r.data) {
      el("bloco-kpis").classList.add("d-none");
      return;
    }
    const d = r.data;
    el("kpi-unidades").textContent = util.formatarNumero(
      d.unidades_utilizaveis,
    );
    el("kpi-a-vencer").textContent = util.formatarNumero(d.lotes_a_vencer);
    if (d.dias_alerta)
      el("kpi-a-vencer-rotulo").textContent =
        `Lotes a vencer em ${d.dias_alerta} dias`;
    el("kpi-vencidos").textContent = util.formatarNumero(d.lotes_vencidos);
    el("kpi-criticos").textContent = util.formatarNumero(d.produtos_criticos);
  }

  /* ------------------------------- Alertas -------------------------------- */
  async function carregarAlertas() {
    if (!auth.temPermissao("NOTIFICACAO_CONSULTAR")) return;
    const lista = el("lista-alertas");
    const r = await Docisis.api("/notificacoes", {
      query: { lida: "false", page: 1, pagina: 1, limit: 5, limite: 5 },
    });
    if (!r.ok) {
      lista.innerHTML = `<li class="pn-vazio"><i class="bi bi-wifi-off" aria-hidden="true"></i>${esc(r.error || "Não foi possível carregar os alertas.")}</li>`;
      return;
    }
    const itens = (r.data && r.data.dados) || [];
    if (!itens.length) {
      lista.innerHTML =
        '<li class="pn-vazio"><i class="bi bi-check2-circle" aria-hidden="true"></i>Tudo em dia, sem alertas novos.</li>';
      return;
    }
    lista.innerHTML = itens
      .map((n) => {
        const sev = ROTULO_SEV[n.severidade] ? n.severidade : "INFO";
        return (
          `<li class="pn-item pn-sev-${sev} nao-lida">` +
          `<div class="pn-item-icon"><i class="bi ${ICONE_SEV[sev]}" aria-hidden="true"></i></div>` +
          `<div class="pn-item-corpo"><p class="pn-item-msg">${esc(n.mensagem)}</p>` +
          `<div class="pn-item-meta"><span class="pn-chip pn-chip-${sev}">${ROTULO_SEV[sev]}</span>` +
          `<span>${esc(util.tempoRelativo(n.criada_em))}</span></div></div></li>`
        );
      })
      .join("");
  }

  /* ---------------------------- Movimentações ----------------------------- */
  async function carregarMovimentacoes() {
    if (!auth.temPermissao("ESTOQUE_CONSULTAR")) {
      el("card-movs").classList.add("d-none");
      return;
    }
    const lista = el("lista-movs");
    const r = await Docisis.api("/movimentacoes", {
      query: { page: 1, pagina: 1, limit: 6, limite: 6 },
    });
    if (r.status === 403) {
      el("card-movs").classList.add("d-none");
      return;
    }
    if (!r.ok) {
      lista.innerHTML = `<li class="pn-vazio"><i class="bi bi-wifi-off" aria-hidden="true"></i>${esc(r.error || "Não foi possível carregar as movimentações.")}</li>`;
      return;
    }
    const itens = (r.data && r.data.dados) || [];
    if (!itens.length) {
      lista.innerHTML =
        '<li class="pn-vazio"><i class="bi bi-inbox" aria-hidden="true"></i>Nenhuma movimentação registrada ainda.</li>';
      return;
    }
    lista.innerHTML = itens
      .map((m) => {
        const tipo = ROTULO_MOV[m.tipo] ? m.tipo : "AJUSTE";
        const v = Number(m.variacao);
        const variacao = Number.isFinite(v)
          ? `<span class="${v < 0 ? "pn-var-neg" : "pn-var-pos"}">${v > 0 ? "+" : ""}${util.formatarNumero(v)}</span>`
          : "";
        const produto = m.produto_nome || m.produto || "Produto";
        return (
          `<li class="pn-item pn-mov-${tipo}">` +
          `<div class="pn-mov-tipo"><i class="bi ${ICONE_MOV[tipo]}" aria-hidden="true"></i></div>` +
          `<div class="pn-item-corpo"><p class="pn-item-msg">${esc(produto)} ${variacao}</p>` +
          `<div class="pn-item-meta"><span>${ROTULO_MOV[tipo]}</span>` +
          `<span>${esc(util.formatarDataHora(m.data_hora))}</span>` +
          `${m.funcionario_nome || m.funcionario ? `<span>${esc(m.funcionario_nome || m.funcionario)}</span>` : ""}` +
          `</div></div></li>`
        );
      })
      .join("");
  }

  /* -------------------------------- Atalhos ------------------------------- */
  function montarAtalhos() {
    const extras = [
      {
        href: "notificacoes.html",
        icone: "bi-bell",
        rotulo: "Notificações",
        titulo: "Alertas de validade e estoque",
        permissao: "NOTIFICACAO_CONSULTAR",
      },
    ];
    const itens = layout.MENU.filter((i) => i.id !== "inicio")
      .concat(extras)
      .filter((i) => !i.permissao || auth.temPermissao(i.permissao));
    el("atalhos").innerHTML = itens
      .map(
        (i) =>
          `<a class="pn-atalho" href="${esc(i.href)}">` +
          `<div class="pn-kpi-icon pn-tone-neutral"><i class="bi ${esc(i.icone)}" aria-hidden="true"></i></div>` +
          `<div><strong>${esc(i.rotulo)}</strong><small>${esc(i.titulo)}</small></div></a>`,
      )
      .join("");
  }

  saudar();
  montarAtalhos();
  carregarKpis();
  carregarAlertas();
  carregarMovimentacoes();
});
