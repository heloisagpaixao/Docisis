/**
 * DOCISIS - HISTÓRICO DE MOVIMENTAÇÕES (historico.js)
 * Entradas, saídas e ajustes juntos, filtrados e paginados NO SERVIDOR.
 *
 * Endpoint: GET /movimentacoes  (permissão ESTOQUE_CONSULTAR)
 *   query: tipo (ENTRADA|SAIDA|AJUSTE), busca, data_inicio, data_fim, page/limit
 *   resposta: { dados, total, pagina, limite, totalPaginas }
 *   item: tipo, id, data_hora, id_lote, produto_nome, codigo, quantidade,
 *         qtd_anterior, qtd_nova, variacao, motivo, funcionario_nome
 *
 * ATENÇÃO: o filtro de período envia data_inicio/data_fim (AAAA-MM-DD), o mesmo padrão dos
 * relatórios. Se o seu movimentacoes.controller usar outro nome (ex.: "period"), ajuste só
 * a função intervaloPeriodo() e montarQuery().
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { auth, util, layout } = Docisis;
  const { esc } = util;

  if (!auth.exigirLogin()) return;
  layout.montar("historico");
  auth.aplicarPermissoes();

  if (!auth.temPermissao("ESTOQUE_CONSULTAR")) {
    document.getElementById("conteudo-principal").innerHTML =
      '<div class="container py-5"><div class="alert alert-warning" role="alert">' +
      "Seu cargo não tem permissão para consultar o histórico.</div></div>";
    return;
  }

  const POR_PAGINA = 8;
  const LIMITE_MAXIMO_API = 100;
  const TIPOS = {
    ENTRADA: {
      rotulo: "Entrada",
      icone: "bi-box-arrow-in-down",
      badge: "badge-docisis-success",
    },
    SAIDA: {
      rotulo: "Saída",
      icone: "bi-box-arrow-up",
      badge: "badge-docisis-info",
    },
    AJUSTE: {
      rotulo: "Ajuste",
      icone: "bi-sliders",
      badge: "badge-docisis-warning",
    },
  };

  const el = (id) => document.getElementById(id);
  const tbody = el("tabela-historico-corpo");
  const paginacaoInfo = el("paginacao-info");
  const paginacaoControles = el("paginacao-controles");
  const pills = document.querySelectorAll(".pill-filter-btn");
  const modalEl = el("modalAuditoria");

  const estado = {
    pagina: 1,
    tipo: "",
    busca: "",
    periodo: "todos",
    itens: [],
  };
  let requisicaoAtual = 0;

  /* ------------------------------ Consulta ------------------------------ */
  function dataLocal(d) {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function intervaloPeriodo() {
    const fim = new Date();
    const dias = { hoje: 0, "7dias": 6, "30dias": 29 }[estado.periodo];
    if (dias === undefined) return {};
    const ini = new Date();
    ini.setDate(ini.getDate() - dias);
    return { data_inicio: dataLocal(ini), data_fim: dataLocal(fim) };
  }

  function montarQuery({ pagina, limite, tipo = estado.tipo }) {
    return {
      page: pagina,
      pagina,
      limit: limite,
      limite,
      tipo,
      busca: estado.busca,
      ...intervaloPeriodo(),
    };
  }

  async function totalDoTipo(tipo) {
    const r = await Docisis.api("/movimentacoes", {
      query: montarQuery({ pagina: 1, limite: 1, tipo }),
    });
    return r.ok && r.data ? Number(r.data.total) || 0 : null;
  }

  async function carregarContadores() {
    const [t, e, s, a] = await Promise.all(
      ["", "ENTRADA", "SAIDA", "AJUSTE"].map(totalDoTipo),
    );
    const fmt = (n) => (n === null ? "–" : util.formatarNumero(n));
    el("kpi-total").textContent = fmt(t);
    el("kpi-entradas").textContent = fmt(e);
    el("kpi-saidas").textContent = fmt(s);
    el("kpi-ajustes").textContent = fmt(a);
    el("kpi-periodo-texto").textContent = {
      todos: "Todo o período",
      hoje: "Hoje",
      "7dias": "Últimos 7 dias",
      "30dias": "Últimos 30 dias",
    }[estado.periodo];
  }

  async function carregarLista() {
    const minha = ++requisicaoAtual;
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center py-5 text-muted">Carregando…</td></tr>';
    const r = await Docisis.api("/movimentacoes", {
      query: montarQuery({ pagina: estado.pagina, limite: POR_PAGINA }),
    });
    if (minha !== requisicaoAtual) return;

    if (!r.ok) {
      estado.itens = [];
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-danger">${esc(r.error || "Não foi possível carregar o histórico.")}</td></tr>`;
      paginacaoInfo.textContent = "";
      paginacaoControles.innerHTML = "";
      return;
    }
    const d = r.data || {};
    estado.itens = d.dados || [];
    estado.pagina = Number(d.pagina) || estado.pagina;
    renderTabela();
    renderPaginacao(
      Number(d.total) || 0,
      Math.max(1, Number(d.totalPaginas) || 1),
    );
  }

  function atualizar() {
    carregarContadores();
    return carregarLista();
  }

  /* ------------------------------ Renderização ------------------------------ */
  function chaveItem(m) {
    return `${m.tipo}-${m.id}`;
  }

  function variacaoHtml(m) {
    const v = Number(m.variacao);
    if (!Number.isFinite(v)) return "–";
    return `<span class="${v < 0 ? "text-danger" : "text-success"} fw-bold">${v > 0 ? "+" : ""}${util.formatarNumero(v)}</span>`;
  }

  function renderTabela() {
    if (!estado.itens.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center py-5 text-muted">' +
        '<i class="bi bi-clock-history fs-1 d-block mb-2 text-secondary opacity-50" aria-hidden="true"></i>' +
        "<strong>Nenhuma movimentação encontrada.</strong>" +
        '<p class="small text-muted mb-0">Tente alterar a busca ou remover os filtros.</p></td></tr>';
      return;
    }
    tbody.innerHTML = estado.itens
      .map((m) => {
        const t = TIPOS[m.tipo] || TIPOS.AJUSTE;
        const produto = m.produto_nome || m.produto || "–";
        const nome = m.funcionario_nome || m.funcionario || "–";
        return `<tr>
                <td><span class="history-datetime-main">${esc(util.formatarDataHora(m.data_hora))}</span>
                    <span class="history-datetime-sub">${esc(m.tipo)} #${esc(m.id)}</span></td>
                <td><span class="history-op-badge ${t.badge}"><i class="bi ${t.icone}" aria-hidden="true"></i> ${t.rotulo}</span></td>
                <td><span class="history-event-title">${esc(produto)}</span>
                    <span class="history-event-desc">${esc(m.motivo || "Sem motivo informado")}</span></td>
                <td><span class="history-doc-tag">Lote ${esc(m.id_lote)}</span>
                    <span class="history-doc-sub">${m.codigo ? "Cód. " + esc(m.codigo) : ""}</span></td>
                <td><div class="history-operator-cell">
                    <div class="avatar-operator-initials" aria-hidden="true">${esc(util.iniciais(nome))}</div>
                    <span class="operator-name-text">${esc(nome)}</span></div></td>
                <td>${variacaoHtml(m)}</td>
                <td class="text-end"><button type="button" class="btn-receipt-action" data-chave="${esc(chaveItem(m))}"
                    title="Ver detalhes" aria-label="Ver detalhes da movimentação ${esc(m.id)}">
                    <i class="bi bi-file-earmark-text-fill" aria-hidden="true"></i></button></td>
            </tr>`;
      })
      .join("");
  }

  function renderPaginacao(total, totalPaginas) {
    if (!total) {
      paginacaoInfo.textContent = "Nenhum registro para exibir";
      paginacaoControles.innerHTML = "";
      return;
    }
    const ini = (estado.pagina - 1) * POR_PAGINA + 1;
    const fim = Math.min(estado.pagina * POR_PAGINA, total);
    paginacaoInfo.innerHTML = `Exibindo <strong>${ini}–${fim}</strong> de <strong>${util.formatarNumero(total)}</strong> movimentações`;

    // janela de até 5 páginas ao redor da atual (evita centenas de botões)
    let de = Math.max(1, estado.pagina - 2);
    const ate = Math.min(totalPaginas, de + 4);
    de = Math.max(1, ate - 4);

    let html = `<button type="button" class="page-btn" data-page="${estado.pagina - 1}" ${estado.pagina === 1 ? "disabled" : ""} aria-label="Página anterior"><i class="bi bi-chevron-left"></i></button>`;
    for (let p = de; p <= ate; p++) {
      html += `<button type="button" class="page-btn ${p === estado.pagina ? "active" : ""}" data-page="${p}" ${p === estado.pagina ? 'aria-current="page"' : ""}>${p}</button>`;
    }
    html += `<button type="button" class="page-btn" data-page="${estado.pagina + 1}" ${estado.pagina >= totalPaginas ? "disabled" : ""} aria-label="Próxima página"><i class="bi bi-chevron-right"></i></button>`;
    paginacaoControles.innerHTML = html;
  }

  /* -------------------------------- Detalhes -------------------------------- */
  function abrirDetalhes(chave) {
    const m = estado.itens.find((x) => chaveItem(x) === chave);
    if (!m) return;
    const t = TIPOS[m.tipo] || TIPOS.AJUSTE;
    const set = (id, v) => {
      el(id).textContent = v;
    };
    set("receipt-id", `${m.tipo} #${m.id}`);
    set("receipt-data-hora", util.formatarDataHora(m.data_hora));
    set("receipt-tipo", t.rotulo);
    set("receipt-operador", m.funcionario_nome || m.funcionario || "–");
    set(
      "receipt-produto",
      (m.produto_nome || m.produto || "–") +
        (m.codigo ? ` (cód. ${m.codigo})` : ""),
    );
    set("receipt-lote", `Lote ${m.id_lote}`);
    const v = Number(m.variacao);
    set(
      "receipt-quantidade",
      m.tipo === "AJUSTE"
        ? `${util.formatarNumero(m.qtd_anterior)} → ${util.formatarNumero(m.qtd_nova)}`
        : util.formatarNumero(m.quantidade),
    );
    set(
      "receipt-saldo",
      Number.isFinite(v)
        ? `${v > 0 ? "+" : ""}${util.formatarNumero(v)} un.`
        : "–",
    );
    set("receipt-motivo", m.motivo || "Sem motivo informado.");
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  /* ------------------------------- Exportação ------------------------------- */
  function celulaCsv(v) {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = "'" + s; // evita fórmula ao abrir no Excel
    return `"${s.replace(/"/g, '""')}"`;
  }

  async function exportarCsv() {
    const btn = el("btn-exportar-csv");
    btn.disabled = true;
    const linhas = [];
    for (let pagina = 1; pagina <= 100; pagina++) {
      const r = await Docisis.api("/movimentacoes", {
        query: montarQuery({ pagina, limite: LIMITE_MAXIMO_API }),
      });
      if (!r.ok) {
        Docisis.toast(r.error || "Falha ao exportar.", "erro");
        btn.disabled = false;
        return;
      }
      linhas.push(...((r.data && r.data.dados) || []));
      if (pagina >= (Number(r.data && r.data.totalPaginas) || 1)) break;
    }
    btn.disabled = false;
    if (!linhas.length) {
      Docisis.toast(
        "Nenhum dado para exportar com os filtros atuais.",
        "aviso",
      );
      return;
    }
    const cab = [
      "Data/Hora",
      "Tipo",
      "Produto",
      "Código",
      "Lote",
      "Quantidade",
      "Qtd. anterior",
      "Qtd. nova",
      "Variação",
      "Motivo",
      "Responsável",
    ];
    const corpo = linhas.map((m) =>
      [
        m.data_hora,
        m.tipo,
        m.produto_nome || m.produto,
        m.codigo,
        m.id_lote,
        m.quantidade,
        m.qtd_anterior,
        m.qtd_nova,
        m.variacao,
        m.motivo,
        m.funcionario_nome || m.funcionario,
      ]
        .map(celulaCsv)
        .join(";"),
    );
    const csv = "﻿" + [cab.map(celulaCsv).join(";"), ...corpo].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `docisis-movimentacoes-${dataLocal(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    Docisis.toast(
      `${linhas.length} movimentação(ões) exportada(s).`,
      "sucesso",
    );
  }

  /* --------------------------------- Eventos --------------------------------- */
  el("busca-historico").addEventListener(
    "input",
    util.debounce((e) => {
      estado.busca = e.target.value.trim();
      estado.pagina = 1;
      atualizar();
    }),
  );

  el("filtro-periodo").addEventListener("change", (e) => {
    estado.periodo = e.target.value;
    estado.pagina = 1;
    atualizar();
  });

  pills.forEach((btn) =>
    btn.addEventListener("click", () => {
      pills.forEach((b) => b.classList.toggle("active", b === btn));
      estado.tipo = btn.dataset.filter || "";
      estado.pagina = 1;
      carregarLista();
    }),
  );

  paginacaoControles.addEventListener("click", (e) => {
    const b = e.target.closest("[data-page]");
    if (!b || b.disabled) return;
    estado.pagina = Number(b.dataset.page);
    carregarLista();
  });

  tbody.addEventListener("click", (e) => {
    const b = e.target.closest("[data-chave]");
    if (b) abrirDetalhes(b.dataset.chave);
  });

  el("btn-exportar-csv").addEventListener("click", exportarCsv);

  atualizar();
});
