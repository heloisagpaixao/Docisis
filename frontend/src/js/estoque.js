/**
 * DOCISIS - ESTOQUE (estoque.js)
 * Lista de lotes com saldo (paginada e filtrada NO SERVIDOR), indicadores,
 * movimentações (entrada, saída, ajuste) e exportação CSV.
 *
 * Endpoints usados:
 *   GET  /estoque/resumo           -> indicadores do topo
 *   GET  /estoque                  -> lotes com saldo { dados, total, pagina, limite, totalPaginas }
 *   POST /entradas | /saidas | /ajustes
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { auth, config, util, layout } = Docisis;
  const { esc } = util;

  /* ------------------------------------------------------------------
       Proteção da página
       ------------------------------------------------------------------ */
  if (!auth.exigirLogin()) return;
  layout.montar("estoque");
  auth.aplicarPermissoes();

  if (!auth.temPermissao("ESTOQUE_CONSULTAR")) {
    document.getElementById("conteudo-principal").innerHTML =
      '<div class="container py-5"><div class="alert alert-warning" role="alert">' +
      "Seu cargo não tem permissão para consultar o estoque.</div></div>";
    return;
  }

  /* ------------------------------------------------------------------
       Constantes
       ------------------------------------------------------------------ */
  const ITENS_POR_PAGINA = 8;
  const LIMITE_MAXIMO_API = 100; // usado no modal e na exportação

  // Motivos oferecidos no modal (o texto é gravado em `motivo`, máx. 100 caracteres)
  const MOTIVOS = {
    entrada: [
      "Recebimento de compra",
      "Produção interna",
      "Devolução de cliente / troca",
    ],
    saida: [
      "Consumo em fornada / receita",
      "Venda balcão / encomenda",
      "Descarte por validade vencida",
      "Perda operacional / avaria",
    ],
    ajuste: [
      "Ajuste de balanço / inventário físico",
      "Correção de lote / rastreabilidade",
    ],
  };
  const ENDPOINT = {
    entrada: "/entradas",
    saida: "/saidas",
    ajuste: "/ajustes",
  };
  const PERMISSAO = {
    entrada: "ENTRADA_REGISTRAR",
    saida: "SAIDA_REGISTRAR",
    ajuste: "AJUSTE_REGISTRAR",
  };

  const SITUACAO_BADGE = {
    ok: '<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-check-circle me-1" aria-hidden="true"></i> Em dia</span>',
    a_vencer:
      '<span class="badge badge-docisis-warning px-2 py-1"><i class="bi bi-hourglass-split me-1" aria-hidden="true"></i> A vencer</span>',
    vencido:
      '<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i class="bi bi-shield-slash me-1" aria-hidden="true"></i> Vencido</span>',
  };

  /* ------------------------------------------------------------------
       Elementos
       ------------------------------------------------------------------ */
  const el = (id) => document.getElementById(id);
  const buscaInput = el("busca-estoque");
  const ordenarSelect = el("ordenar-estoque");
  const tabelaCorpo = el("tabela-estoque-corpo");
  const paginacaoInfo = el("paginacao-info");
  const paginacaoControles = el("paginacao-controles");
  const pills = document.querySelectorAll(".pill-filter-btn");

  const modalEl = el("modalMovimentacao");
  const formMov = el("form-movimentacao");
  const tipoBotoes = document.querySelectorAll(".mov-type-btn");
  const selectLote = el("mov-lote");
  const selectMotivo = el("mov-motivo");
  const inputQtd = el("mov-quantidade");
  const labelQtd = el("mov-quantidade-label");
  const avisoMov = el("mov-aviso");
  const btnConfirmar = el("btn-confirmar-movimentacao");
  const saldoAtualEl = el("mov-saldo-atual-preview");
  const saldoProjetadoEl = el("mov-saldo-projetado-preview");
  const grupoModo = el("grupo-modo-entrada");
  const grupoLote = el("grupo-lote");
  const painelNovoLote = el("painel-novo-lote");
  const saldoCard = el("saldo-preview-card");
  const selectProduto = el("nl-produto");

  /* ------------------------------------------------------------------
       Estado
       ------------------------------------------------------------------ */
  const estado = {
    pagina: 1,
    busca: "",
    situacao: "", // '' | 'ok' | 'a_vencer' | 'vencido'
    ordem: "validade", // 'validade' | 'produto' | 'saldo'
    lotesDaPagina: [],
    lotesDoModal: new Map(), // id_lote -> lote
    tipoMov: null,
    modoEntrada: "existente", // 'existente' | 'novo'
    produtos: null, // lista de produtos (carregada na 1ª vez que abre o modo novo)
    novoLote: { notaId: null, arquivoEnviado: false }, // reaproveita a nota se o lote falhar e o usuário tentar de novo
  };
  let requisicaoAtual = 0; // descarta respostas antigas quando o usuário digita rápido

  // Vindo do topo: estoque.html?busca=texto (pesquisa) e ?nova=1 (abre o modal de movimentação)
  const params = new URLSearchParams(location.search);
  const buscaInicial = (params.get("busca") || "").trim();
  if (buscaInicial) {
    estado.busca = buscaInicial;
    buscaInput.value = buscaInicial;
  }

  /* ------------------------------------------------------------------
       Consulta à API
       ------------------------------------------------------------------ */
  function montarQuery({ pagina, limite }) {
    return {
      // O nome dos parâmetros de paginação depende do utils/paginacao.js do back-end.
      // Enviamos as duas grafias; o back ignora a que não conhece.
      page: pagina,
      pagina,
      limit: limite,
      limite,
      busca: estado.busca,
      situacao: estado.situacao,
      ordem: estado.ordem,
    };
  }

  async function carregarResumo() {
    const r = await Docisis.api("/estoque/resumo");
    if (!r.ok) {
      Docisis.toast(
        r.error || "Não foi possível carregar os indicadores.",
        "erro",
      );
      return;
    }
    const d = r.data;
    const emDia = Math.max(
      0,
      d.lotes_com_saldo - d.lotes_vencidos - d.lotes_a_vencer,
    );

    el("kpi-total-itens").textContent = util.formatarNumero(
      d.unidades_utilizaveis,
    );
    el("kpi-total-lotes").textContent =
      `${util.formatarNumero(d.lotes_com_saldo)} lotes com saldo`;
    el("kpi-produtos-total").textContent = util.formatarNumero(
      d.produtos_total,
    );

    el("kpi-vencimentos").textContent = util.formatarNumero(d.lotes_a_vencer);
    el("kpi-vencimentos-sub").textContent =
      d.lotes_a_vencer > 0
        ? `${d.lotes_a_vencer} lote(s) vencem em até ${d.dias_alerta} dias`
        : "Validades sob controle";
    el("kpi-dias-alerta").textContent = `${d.dias_alerta} dias`;

    el("kpi-criticos").textContent = util.formatarNumero(d.produtos_criticos);
    el("kpi-criticos-sub").textContent =
      d.produtos_criticos > 0
        ? `${d.produtos_criticos} de ${d.produtos_total} produtos no mínimo ou abaixo`
        : "Sem produtos em ruptura";

    el("kpi-vencidos").textContent = util.formatarNumero(d.lotes_vencidos);
    el("kpi-vencidos-sub").textContent =
      d.lotes_vencidos > 0
        ? "Descartar ou ajustar o saldo"
        : "Nenhum lote vencido";
    el("kpi-unidades-vencidas").textContent = util.formatarNumero(
      d.unidades_vencidas,
    );

    el("counter-todos").textContent = d.lotes_com_saldo;
    el("counter-ok").textContent = emDia;
    el("counter-a-vencer").textContent = d.lotes_a_vencer;
    el("counter-vencido").textContent = d.lotes_vencidos;
  }

  async function carregarLista() {
    const minhaRequisicao = ++requisicaoAtual;
    paginacaoInfo.textContent = "Carregando registros...";

    const r = await Docisis.api("/estoque", {
      query: montarQuery({ pagina: estado.pagina, limite: ITENS_POR_PAGINA }),
    });
    if (minhaRequisicao !== requisicaoAtual) return; // chegou uma resposta mais nova

    if (!r.ok) {
      estado.lotesDaPagina = [];
      tabelaCorpo.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-danger">
                    <i class="bi bi-exclamation-triangle fs-2 d-block mb-2" aria-hidden="true"></i>${esc(r.error)}</td></tr>`;
      paginacaoInfo.textContent = "Erro ao carregar.";
      paginacaoControles.innerHTML = "";
      if (r.status !== 401) Docisis.toast(r.error, "erro");
      return;
    }

    const { dados = [], total = 0, pagina = 1, totalPaginas = 1 } = r.data;
    estado.lotesDaPagina = dados;
    estado.pagina = pagina;
    renderizarTabela(dados);
    renderizarRodape(total, pagina, totalPaginas, dados.length);
  }

  function recarregarTudo() {
    return Promise.all([carregarResumo(), carregarLista()]);
  }

  /* ------------------------------------------------------------------
       Renderização
       ------------------------------------------------------------------ */
  function textoDias(dias) {
    if (dias === null || dias === undefined) return "";
    if (dias < 0) return `vencido há ${-dias} dia${-dias === 1 ? "" : "s"}`;
    if (dias === 0) return "vence hoje";
    return `vence em ${dias} dia${dias === 1 ? "" : "s"}`;
  }

  function badgeSituacao(lote) {
    return SITUACAO_BADGE[lote.situacao] || SITUACAO_BADGE.ok;
  }

  function linhaLote(l) {
    const podeMovimentar = auth.temAlguma(Object.values(PERMISSAO));
    const peso =
      l.peso !== null && l.peso !== undefined
        ? `<small class="text-muted">Peso un.: ${util.formatarNumero(l.peso, 2)}</small>`
        : "";
    const botao = podeMovimentar
      ? `<button type="button" class="btn btn-sm btn-docisis-outline py-1 px-2 btn-movimentar-item" data-lote="${l.id_lote}" title="Registrar entrada, saída ou ajuste">
                   <i class="bi bi-arrow-left-right me-1" aria-hidden="true"></i> Movimentar</button>`
      : "";

    return `
            <tr>
                <td>
                    <div class="product-cell">
                        <div class="kpi-icon-box bg-light border text-navy-docisis icone-produto" aria-hidden="true">
                            <i class="bi bi-box-seam"></i>
                        </div>
                        <div>
                            <strong class="d-block text-navy-docisis nome-produto">${esc(l.produto_nome)}</strong>
                            <small class="text-muted"><span class="badge bg-light text-secondary border me-1">Cód. ${esc(l.codigo)}</span></small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="fw-semibold text-dark small"><i class="bi bi-upc-scan me-1 text-muted" aria-hidden="true"></i> Lote ${esc(l.id_lote)}</span>
                        <small class="text-muted">${esc(l.fornecedor)}</small>
                    </div>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="fw-semibold text-dark small"><i class="bi bi-calendar3 me-1 text-muted" aria-hidden="true"></i> ${util.formatarData(l.dt_validade)}</span>
                        <small class="text-muted">${textoDias(l.dias_para_vencer)}</small>
                    </div>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="fw-bold ${l.situacao === "vencido" ? "text-danger" : "text-dark"}">${util.formatarNumero(l.quantidade)} un</span>
                        ${peso}
                    </div>
                </td>
                <td>${badgeSituacao(l)}</td>
                <td class="text-end">${botao}</td>
            </tr>`;
  }

  function renderizarTabela(lotes) {
    if (lotes.length === 0) {
      tabelaCorpo.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary" aria-hidden="true"></i>
                    Nenhum lote encontrado para os filtros selecionados.</td></tr>`;
      return;
    }
    tabelaCorpo.innerHTML = lotes.map(linhaLote).join("");
  }

  function renderizarRodape(total, pagina, totalPaginas, qtdNaPagina) {
    if (total === 0) {
      paginacaoInfo.textContent = "Nenhum registro encontrado.";
      paginacaoControles.innerHTML = "";
      return;
    }
    const inicio = (pagina - 1) * ITENS_POR_PAGINA + 1;
    const fim = inicio + qtdNaPagina - 1;
    paginacaoInfo.textContent = `Mostrando ${inicio} a ${fim} de ${total} lotes`;

    if (totalPaginas <= 1) {
      paginacaoControles.innerHTML = "";
      return;
    }

    // Janela de até 5 páginas ao redor da atual
    const primeira = Math.max(1, Math.min(pagina - 2, totalPaginas - 4));
    const ultima = Math.min(totalPaginas, primeira + 4);
    let html = `<button type="button" class="page-btn" data-pagina="${pagina - 1}" aria-label="Página anterior" ${pagina === 1 ? "disabled" : ""}><i class="bi bi-chevron-left" aria-hidden="true"></i></button>`;
    for (let p = primeira; p <= ultima; p++) {
      html += `<button type="button" class="page-btn ${p === pagina ? "active" : ""}" data-pagina="${p}" ${p === pagina ? 'aria-current="page"' : ""}>${p}</button>`;
    }
    html += `<button type="button" class="page-btn" data-pagina="${pagina + 1}" aria-label="Próxima página" ${pagina === totalPaginas ? "disabled" : ""}><i class="bi bi-chevron-right" aria-hidden="true"></i></button>`;
    paginacaoControles.innerHTML = html;
  }

  /* ------------------------------------------------------------------
       Eventos: busca, ordenação, filtros, paginação
       ------------------------------------------------------------------ */
  const buscarComAtraso = util.debounce(() => {
    estado.busca = buscaInput.value.trim();
    estado.pagina = 1;
    carregarLista();
  }, 350);
  buscaInput.addEventListener("input", buscarComAtraso);

  ordenarSelect.addEventListener("change", () => {
    estado.ordem = ordenarSelect.value;
    estado.pagina = 1;
    carregarLista();
  });

  pills.forEach((btn) => {
    btn.addEventListener("click", () => {
      pills.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      estado.situacao = btn.dataset.filter || "";
      estado.pagina = 1;
      carregarLista();
    });
  });

  paginacaoControles.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pagina]");
    if (!btn || btn.disabled) return;
    estado.pagina = Number(btn.dataset.pagina);
    carregarLista();
  });

  tabelaCorpo.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-movimentar-item");
    if (btn) abrirModal(Number(btn.dataset.lote));
  });

  el("btn-imprimir").addEventListener("click", (e) => {
    e.preventDefault();
    window.print();
  });

  /* ------------------------------------------------------------------
       Modal de movimentação
       ------------------------------------------------------------------ */
  function tiposPermitidos() {
    return Object.keys(PERMISSAO).filter((t) =>
      auth.temPermissao(PERMISSAO[t]),
    );
  }

  function mostrarAvisoMov(msg) {
    avisoMov.textContent = msg;
    avisoMov.classList.toggle("d-none", !msg);
  }

  function definirTipo(tipo) {
    estado.tipoMov = tipo;
    tipoBotoes.forEach((b) =>
      b.classList.toggle("active", b.dataset.type === tipo),
    );

    selectMotivo.innerHTML = MOTIVOS[tipo]
      .map((m) => `<option value="${esc(m)}">${esc(m)}</option>`)
      .join("");

    if (tipo === "ajuste") {
      labelQtd.innerHTML =
        'Nova quantidade (saldo final) <span class="text-danger">*</span>';
      inputQtd.min = "0";
    } else {
      labelQtd.innerHTML = 'Quantidade <span class="text-danger">*</span>';
      inputQtd.min = "1";
    }
    // só a ENTRADA tem o modo "novo lote", e só para quem pode cadastrar lote e nota
    const permiteNovo = tipo === "entrada" && podeNovoLote();
    grupoModo.classList.toggle("d-none", !permiteNovo);
    if (!permiteNovo) definirModo("existente");
    else definirModo(estado.modoEntrada);
    recalcularPrevisao();
  }

  /* ----- Entrada de lote NOVO (nota fiscal + lote + saldo) ----- */
  function podeNovoLote() {
    return [
      "ENTRADA_REGISTRAR",
      "LOTE_GERENCIAR",
      "NOTA_FISCAL_REGISTRAR",
    ].every((p) => auth.temPermissao(p));
  }

  function hojeISO() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function definirModo(modo) {
    const novo =
      modo === "novo" && estado.tipoMov === "entrada" && podeNovoLote();
    estado.modoEntrada = novo ? "novo" : "existente";
    grupoModo.querySelectorAll('input[name="mov-modo"]').forEach((r) => {
      r.checked = r.value === estado.modoEntrada;
    });
    grupoLote.classList.toggle("d-none", novo);
    saldoCard.classList.toggle("d-none", novo);
    painelNovoLote.classList.toggle("d-none", !novo);
    if (estado.tipoMov === "entrada") {
      labelQtd.innerHTML =
        (novo ? "Quantidade recebida" : "Quantidade") +
        ' <span class="text-danger">*</span>';
    }
    if (novo) {
      el("nl-validade").min = hojeISO();
      el("nl-data").max = hojeISO();
      if (!el("nl-data").value) el("nl-data").value = hojeISO();
      carregarProdutosDoModal();
    }
  }

  async function carregarProdutosDoModal() {
    if (estado.produtos) return preencherProdutos();
    selectProduto.innerHTML =
      '<option value="">Carregando produtos...</option>';
    const todos = [];
    for (let pagina = 1; pagina <= 30; pagina++) {
      const r = await Docisis.api("/produtos", {
        query: { page: pagina, pagina, limit: 100, limite: 100 },
      });
      if (!r.ok) {
        selectProduto.innerHTML =
          '<option value="">Não foi possível carregar os produtos</option>';
        mostrarAvisoMov(
          r.status === 403
            ? "Seu cargo não pode listar os produtos."
            : r.error || "Não foi possível carregar os produtos.",
        );
        return;
      }
      const d = r.data;
      todos.push(...(Array.isArray(d) ? d : (d && d.dados) || []));
      if (Array.isArray(d) || pagina >= (Number(d && d.totalPaginas) || 1))
        break;
    }
    estado.produtos = todos
      .map((p) => ({
        id: p.id_produto ?? p.id,
        nome: p.nome,
        codigo: p.codigo,
      }))
      .filter((p) => p.id !== undefined && p.id !== null)
      .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
    preencherProdutos();
  }

  function preencherProdutos() {
    selectProduto.innerHTML = estado.produtos.length
      ? '<option value="">Selecione o produto...</option>' +
        estado.produtos
          .map(
            (p) =>
              `<option value="${esc(p.id)}">${esc(p.nome)}${p.codigo ? ` (cód. ${esc(p.codigo)})` : ""}</option>`,
          )
          .join("")
      : '<option value="">Nenhum produto cadastrado</option>';
  }

  const idDe = (d, ...chaves) => {
    for (const k of chaves)
      if (d && d[k] !== undefined && d[k] !== null) return d[k];
    return null;
  };

  /**
   * 1) POST /notasfiscais  2) PUT /notasfiscais/:id/arquivo (opcional)  3) POST /lotes
   * 4) confere o saldo do lote; se o back-end não lançou a quantidade, registra como ENTRADA.
   * Se falhar depois da nota criada, a nota é reaproveitada na próxima tentativa.
   */
  async function registrarNovoLote(qtd) {
    const fornecedor = el("nl-fornecedor").value.trim();
    const dataCompra = el("nl-data").value;
    const validade = el("nl-validade").value;
    const idProduto = selectProduto.value;
    const arquivo = el("nl-arquivo").files[0];

    for (const id of [
      "nl-produto",
      "nl-validade",
      "nl-fornecedor",
      "nl-data",
      "nl-arquivo",
    ])
      el(id).classList.remove("is-invalid");
    const falha = (id, msg) => {
      el(id).classList.add("is-invalid");
      el(id).focus();
      mostrarAvisoMov(msg);
    };

    if (!idProduto) return falha("nl-produto", "Selecione o produto.");
    if (!validade) return falha("nl-validade", "Informe a validade do lote.");
    if (validade < hojeISO())
      return falha("nl-validade", "A validade não pode estar no passado.");
    if (fornecedor.length < 2 || fornecedor.length > 50)
      return falha(
        "nl-fornecedor",
        "Informe o fornecedor (2 a 50 caracteres).",
      );
    if (!dataCompra) return falha("nl-data", "Informe a data da compra.");
    if (dataCompra > hojeISO())
      return falha("nl-data", "A data da compra não pode estar no futuro.");
    if (
      arquivo &&
      !["application/pdf", "image/jpeg", "image/png"].includes(arquivo.type)
    )
      return falha("nl-arquivo", "O arquivo da nota deve ser PDF, JPG ou PNG.");
    if (arquivo && arquivo.size > 10 * 1024 * 1024)
      return falha("nl-arquivo", "O arquivo da nota passa de 10 MB.");

    btnConfirmar.disabled = true;
    try {
      if (!estado.novoLote.notaId) {
        const n = await Docisis.api("/notasfiscais", {
          method: "POST",
          body: { fornecedor, quantidade: qtd, dt_compra: dataCompra },
        });
        if (!n.ok)
          return mostrarAvisoMov(
            n.error || "Não foi possível registrar a nota fiscal.",
          );
        const idNota =
          idDe(n.data, "id_nota", "id") ??
          idDe(n.data && n.data.nota, "id_nota", "id");
        if (idNota === null)
          return mostrarAvisoMov(
            "A nota foi criada, mas o servidor não devolveu o número dela.",
          );
        estado.novoLote.notaId = idNota;
      }
      const notaId = estado.novoLote.notaId;

      let avisoArquivo = "";
      if (arquivo && !estado.novoLote.arquivoEnviado) {
        const fd = new FormData();
        fd.append("arquivo", arquivo);
        const a = await Docisis.api(
          `/notasfiscais/${encodeURIComponent(notaId)}/arquivo`,
          { method: "PUT", body: fd },
        );
        if (a.ok) estado.novoLote.arquivoEnviado = true;
        else
          avisoArquivo = ` O arquivo da nota não foi enviado (${a.error || "falha"}).`;
      }

      const l = await Docisis.api("/lotes", {
        method: "POST",
        body: {
          id_produto: Number(idProduto),
          id_nota: Number(notaId),
          dt_validade: validade,
          quantidade: qtd,
        },
      });
      if (!l.ok)
        return mostrarAvisoMov(
          `${l.error || "Não foi possível criar o lote."} A nota fiscal ${notaId} já foi registrada: corrija e confirme de novo.`,
        );

      const idLote = idDe(l.data, "id", "id_lote");
      let aviso = avisoArquivo;
      if (idLote !== null) {
        let saldo =
          typeof (l.data && l.data.quantidade) === "number"
            ? l.data.quantidade
            : null;
        if (saldo === null) {
          const g = await Docisis.api(`/lotes/${encodeURIComponent(idLote)}`);
          saldo =
            g.ok && g.data && typeof g.data.quantidade === "number"
              ? g.data.quantidade
              : null;
        }
        if (saldo !== null && saldo < qtd) {
          const e = await Docisis.api("/entradas", {
            method: "POST",
            body: {
              id_lote: Number(idLote),
              quantidade: qtd - saldo,
              motivo: selectMotivo.value,
            },
          });
          if (!e.ok)
            aviso += ` O lote ${idLote} foi criado, mas a entrada do saldo falhou: ${e.error}`;
        }
      }

      estado.novoLote = { notaId: null, arquivoEnviado: false };
      bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      Docisis.toast(
        `Lote${idLote !== null ? " " + idLote : ""} cadastrado e entrada registrada (nota ${notaId}).${aviso}`,
        aviso ? "aviso" : "sucesso",
      );
      recarregarTudo();
    } finally {
      btnConfirmar.disabled = false;
    }
  }

  function loteSelecionado() {
    return estado.lotesDoModal.get(Number(selectLote.value)) || null;
  }

  function recalcularPrevisao() {
    const lote = loteSelecionado();
    if (!lote) {
      saldoAtualEl.textContent = "--";
      saldoProjetadoEl.textContent = "--";
      saldoProjetadoEl.className = "saldo-item-val";
      return;
    }
    const atual = lote.quantidade;
    const q = Number(inputQtd.value);
    const valido = inputQtd.value !== "" && Number.isFinite(q);

    let projetado = atual;
    if (valido) {
      if (estado.tipoMov === "entrada") projetado = atual + q;
      else if (estado.tipoMov === "saida") projetado = atual - q;
      else projetado = q;
    }

    saldoAtualEl.textContent = `${util.formatarNumero(atual)} un`;
    saldoProjetadoEl.textContent = `${util.formatarNumero(projetado)} un`;
    saldoProjetadoEl.className =
      "saldo-item-val " + (projetado < 0 ? "text-danger" : "text-success");
  }

  function preencherSelectLotes(selecionado) {
    const opcoes = [...estado.lotesDoModal.values()]
      .map(
        (l) =>
          `<option value="${l.id_lote}">${esc(l.produto_nome)} — Lote ${esc(l.id_lote)} · Val. ${util.formatarData(l.dt_validade)} · Saldo ${util.formatarNumero(l.quantidade)}</option>`,
      )
      .join("");
    selectLote.innerHTML =
      '<option value="">Selecione o lote...</option>' + opcoes;
    if (selecionado) selectLote.value = String(selecionado);
  }

  async function carregarLotesDoModal() {
    const r = await Docisis.api("/estoque", {
      query: {
        ...montarQuery({ pagina: 1, limite: LIMITE_MAXIMO_API }),
        busca: "",
        situacao: "",
        ordem: "produto",
      },
    });
    if (!r.ok) {
      mostrarAvisoMov(r.error || "Não foi possível carregar os lotes.");
      return;
    }
    estado.lotesDoModal = new Map(r.data.dados.map((l) => [l.id_lote, l]));
    // garante que o lote clicado na tabela esteja na lista mesmo se passou do limite
    estado.lotesDaPagina.forEach((l) => estado.lotesDoModal.set(l.id_lote, l));
  }

  async function abrirModal(idLote = null) {
    const permitidos = tiposPermitidos();
    if (permitidos.length === 0) return;

    formMov.reset();
    mostrarAvisoMov("");
    el("modal-operador-nome").textContent =
      (auth.getUsuario() || {}).nome || "--";
    estado.novoLote = { notaId: null, arquivoEnviado: false };
    // lote clicado na tabela = entrada nesse lote; botão geral = novo lote (se o cargo puder)
    estado.modoEntrada = idLote ? "existente" : "novo";
    el("nl-data").value = "";
    definirTipo(permitidos.includes("entrada") ? "entrada" : permitidos[0]);

    bootstrap.Modal.getOrCreateInstance(modalEl).show();

    selectLote.innerHTML = '<option value="">Carregando lotes...</option>';
    await carregarLotesDoModal();
    preencherSelectLotes(idLote);
    recalcularPrevisao();
  }

  el("btn-nova-movimentacao").addEventListener("click", () => abrirModal(null));

  tipoBotoes.forEach((btn) => {
    btn.addEventListener("click", () => definirTipo(btn.dataset.type));
  });
  selectLote.addEventListener("change", recalcularPrevisao);
  grupoModo.addEventListener("change", (e) => {
    if (e.target.name === "mov-modo") {
      mostrarAvisoMov("");
      definirModo(e.target.value);
      recalcularPrevisao();
    }
  });
  inputQtd.addEventListener("input", recalcularPrevisao);

  formMov.addEventListener("submit", async (e) => {
    e.preventDefault();
    mostrarAvisoMov("");

    const lote = loteSelecionado();
    const tipo = estado.tipoMov;
    const qtd = Number(inputQtd.value);

    if (tipo === "entrada" && estado.modoEntrada === "novo") {
      if (inputQtd.value === "" || !Number.isInteger(qtd) || qtd < 1)
        return mostrarAvisoMov(
          "Informe a quantidade recebida (inteiro maior que zero).",
        );
      return registrarNovoLote(qtd);
    }

    if (!lote) return mostrarAvisoMov("Selecione o lote.");
    if (inputQtd.value === "" || !Number.isInteger(qtd))
      return mostrarAvisoMov("Informe a quantidade como número inteiro.");
    if (tipo === "ajuste" ? qtd < 0 : qtd < 1) {
      return mostrarAvisoMov(
        tipo === "ajuste"
          ? "A nova quantidade não pode ser negativa."
          : "A quantidade deve ser maior que zero.",
      );
    }
    if (tipo === "saida" && qtd > lote.quantidade) {
      return mostrarAvisoMov(
        `Saída maior que o saldo do lote (${lote.quantidade} un).`,
      );
    }
    if (!auth.temPermissao(PERMISSAO[tipo]))
      return mostrarAvisoMov("Você não tem permissão para esta operação.");

    const corpo = {
      id_lote: lote.id_lote,
      id_funcionario: (auth.getUsuario() || {}).id,
      motivo: selectMotivo.value,
    };
    if (tipo === "ajuste") corpo.quantidade_nova = qtd;
    else corpo.quantidade = qtd;

    btnConfirmar.disabled = true;
    const r = await Docisis.api(ENDPOINT[tipo], {
      method: "POST",
      body: corpo,
    });
    btnConfirmar.disabled = false;

    if (!r.ok) {
      mostrarAvisoMov(r.error || "Não foi possível registrar a movimentação.");
      return;
    }

    bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    Docisis.toast(
      `Movimentação do lote ${lote.id_lote} registrada com sucesso!`,
    );
    recarregarTudo();
  });

  /* ------------------------------------------------------------------
       Exportação CSV (todos os lotes que batem com os filtros atuais)
       ------------------------------------------------------------------ */
  // Evita que uma célula começando com = + - @ seja executada como fórmula no Excel
  function celulaCsv(v) {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  }

  el("btn-exportar-csv").addEventListener("click", async (e) => {
    e.preventDefault();
    Docisis.toast("Gerando planilha...", "info");

    const todos = [];
    let pagina = 1;
    let totalPaginas = 1;
    do {
      const r = await Docisis.api("/estoque", {
        query: montarQuery({ pagina, limite: LIMITE_MAXIMO_API }),
      });
      if (!r.ok) return Docisis.toast(r.error || "Falha ao exportar.", "erro");
      todos.push(...r.data.dados);
      totalPaginas = r.data.totalPaginas || 1;
      pagina++;
    } while (pagina <= totalPaginas);

    if (todos.length === 0)
      return Docisis.toast("Nenhum dado para exportar.", "aviso");

    const rotulo = { ok: "Em dia", a_vencer: "A vencer", vencido: "Vencido" };
    const cabecalho = [
      "Lote",
      "Produto",
      "Codigo",
      "Fornecedor",
      "Validade",
      "Dias_para_vencer",
      "Quantidade",
      "Situacao",
    ];
    const linhas = todos.map((l) =>
      [
        l.id_lote,
        l.produto_nome,
        l.codigo,
        l.fornecedor,
        util.formatarData(l.dt_validade),
        l.dias_para_vencer,
        l.quantidade,
        rotulo[l.situacao] || l.situacao,
      ]
        .map(celulaCsv)
        .join(";"),
    );

    const csv = "﻿" + [cabecalho.join(";"), ...linhas].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `docisis-estoque-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    Docisis.toast("Planilha de estoque exportada!");
  });

  /* ------------------------------------------------------------------
       Início
       ------------------------------------------------------------------ */
  recarregarTudo();

  if (params.get("nova") === "1") {
    abrirModal(null);
    history.replaceState(null, "", location.pathname);
  }
});
