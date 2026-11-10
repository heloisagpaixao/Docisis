/**
 * DOCISIS - RECEBER MERCADORIA (recebimento.js)
 *
 * Fluxo (3 chamadas, na ordem):
 *   1) POST /notasfiscais            { fornecedor, quantidade, dt_compra }      -> NOTA_FISCAL_REGISTRAR
 *   2) PUT  /notasfiscais/:id/arquivo  multipart "arquivo" (opcional)            -> NOTA_FISCAL_REGISTRAR
 *   3) POST /lotes (um por linha)    { id_produto, id_nota, dt_validade, quantidade } -> LOTE_GERENCIAR
 *
 * Depois de criar cada lote, confere o saldo (GET /lotes/:id). Se o back-end não lançou a quantidade
 * inicial sozinho, registra a diferença como ENTRADA (POST /entradas), para o saldo nunca ficar zerado.
 * Se algo falhar no meio, a nota já criada é reaproveitada ao "tentar novamente" (não duplica).
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { auth, util, layout } = Docisis;
  const { esc } = util;

  if (!auth.exigirPermissao("LOTE_GERENCIAR")) return;
  layout.montar("recebimento");

  const $ = (id) => document.getElementById(id);
  const MAX_INT = 2147483647;
  const TIPOS_ARQUIVO = ["application/pdf", "image/jpeg", "image/png"];
  const MAX_ARQUIVO = 10 * 1024 * 1024;

  const form = $("form-recebimento");
  const aviso = $("aviso-recebimento");
  const lista = $("lista-itens");
  const btnSalvar = $("btn-salvar");
  const tpl = $("tpl-item");

  const estado = {
    notaId: null,
    arquivoEnviado: false,
    produtos: [],
    salvando: false,
  };

  /* ------------------------------ Utilidades ------------------------------ */
  function hojeISO() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function mostrarAviso(msg, tipo = "danger") {
    aviso.className = `alert alert-${tipo}`;
    aviso.textContent = msg;
  }
  function limparAviso() {
    aviso.className = "alert d-none";
    aviso.textContent = "";
  }

  function marcarErro(input, erroEl, msg) {
    if (input) input.classList.toggle("is-invalid", Boolean(msg));
    if (erroEl) erroEl.textContent = msg || "";
    return Boolean(msg);
  }

  if (!auth.temPermissao("NOTA_FISCAL_REGISTRAR")) {
    mostrarAviso(
      "Seu cargo pode cadastrar lotes, mas não registrar notas fiscais. Peça a um administrador a permissão de nota fiscal.",
      "warning",
    );
    btnSalvar.disabled = true;
  }

  /* ------------------------------- Produtos ------------------------------- */
  async function carregarProdutos() {
    const todos = [];
    for (let pagina = 1; pagina <= 30; pagina++) {
      const r = await Docisis.api("/produtos", {
        query: { page: pagina, pagina, limit: 100, limite: 100 },
      });
      if (!r.ok) {
        mostrarAviso(
          r.status === 403
            ? "Seu cargo não pode listar os produtos para escolher."
            : r.error || "Não foi possível carregar os produtos.",
        );
        break;
      }
      const d = r.data;
      const itens = Array.isArray(d) ? d : (d && d.dados) || [];
      todos.push(...itens);
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
    document
      .querySelectorAll('[data-campo="produto"]')
      .forEach(preencherSelect);
  }

  function preencherSelect(select) {
    const atual = select.value;
    const opcoes = estado.produtos.length
      ? '<option value="">Selecione o produto…</option>' +
        estado.produtos
          .map(
            (p) =>
              `<option value="${esc(p.id)}">${esc(p.nome)}${p.codigo ? ` (cód. ${esc(p.codigo)})` : ""}</option>`,
          )
          .join("")
      : '<option value="">Nenhum produto cadastrado</option>';
    select.innerHTML = opcoes;
    if (atual) select.value = atual;
  }

  /* -------------------------------- Itens -------------------------------- */
  function itens() {
    return Array.from(lista.querySelectorAll("[data-item]"));
  }
  function campo(item, nome) {
    return item.querySelector(`[data-campo="${nome}"]`);
  }

  function adicionarItem() {
    const no = tpl.content.firstElementChild.cloneNode(true);
    preencherSelect(campo(no, "produto"));
    campo(no, "validade").min = hojeISO();
    lista.appendChild(no);
    atualizarTotais();
    return no;
  }

  function atualizarTotais() {
    let unidades = 0;
    const linhas = itens();
    linhas.forEach((i) => {
      const q = Number(campo(i, "quantidade").value);
      if (Number.isInteger(q) && q > 0) unidades += q;
    });
    $("total-unidades").textContent = util.formatarNumero(unidades);
    $("total-lotes").textContent = linhas.length;
    // não deixa remover a última linha
    const soUma = linhas.length === 1;
    linhas.forEach((i) => {
      i.querySelector("[data-remover]").disabled =
        soUma || i.classList.contains("ok");
    });
    return unidades;
  }

  lista.addEventListener("input", atualizarTotais);
  lista.addEventListener("click", (e) => {
    const b = e.target.closest("[data-remover]");
    if (!b || estado.salvando) return;
    const item = b.closest("[data-item]");
    if (itens().length > 1 && !item.classList.contains("ok")) {
      item.remove();
      atualizarTotais();
    }
  });
  $("btn-add-item").addEventListener("click", () => {
    const novo = adicionarItem();
    campo(novo, "produto").focus();
  });

  /* ------------------------------ Validação ------------------------------ */
  function validar() {
    let ok = true;
    const forn = $("nf-fornecedor");
    const nome = forn.value.trim();
    ok =
      !marcarErro(
        forn,
        $("erro-fornecedor"),
        nome.length < 2 || nome.length > 50
          ? "Informe o fornecedor (2 a 50 caracteres)."
          : "",
      ) && ok;

    const data = $("nf-data");
    let msgData = "";
    if (!data.value) msgData = "Informe a data da compra.";
    else if (data.value > hojeISO())
      msgData = "A data da compra não pode estar no futuro.";
    ok = !marcarErro(data, $("erro-data"), msgData) && ok;

    const arq = $("nf-arquivo").files[0];
    let msgArq = "";
    if (arq && !TIPOS_ARQUIVO.includes(arq.type))
      msgArq = "Use um arquivo PDF, JPG ou PNG.";
    else if (arq && arq.size > MAX_ARQUIVO)
      msgArq = "O arquivo passa de 10 MB.";
    ok = !marcarErro($("nf-arquivo"), $("erro-arquivo"), msgArq) && ok;

    const linhas = itens();
    marcarErro(
      null,
      $("erro-itens"),
      linhas.length ? "" : "Adicione pelo menos um produto.",
    );
    if (!linhas.length) ok = false;

    linhas.forEach((i) => {
      if (i.classList.contains("ok")) return; // já salvo
      const sel = campo(i, "produto"),
        val = campo(i, "validade"),
        qtd = campo(i, "quantidade");
      const erros = [];
      if (!sel.value) erros.push("escolha o produto");
      if (!val.value) erros.push("informe a validade");
      else if (val.value < hojeISO())
        erros.push("a validade não pode estar no passado");
      const q = Number(qtd.value);
      if (!Number.isInteger(q) || q <= 0 || q > MAX_INT)
        erros.push("quantidade deve ser um inteiro maior que zero");
      sel.classList.toggle("is-invalid", !sel.value);
      val.classList.toggle("is-invalid", !val.value || val.value < hojeISO());
      qtd.classList.toggle(
        "is-invalid",
        !Number.isInteger(q) || q <= 0 || q > MAX_INT,
      );
      const el = i.querySelector("[data-erro]");
      el.textContent = erros.length ? "Revise: " + erros.join("; ") + "." : "";
      if (erros.length) ok = false;
    });
    return ok;
  }

  /* ------------------------------- Chamadas ------------------------------- */
  const idDe = (d, ...chaves) => {
    for (const k of chaves)
      if (d && d[k] !== undefined && d[k] !== null) return d[k];
    return null;
  };

  async function criarNota(total) {
    const r = await Docisis.api("/notasfiscais", {
      method: "POST",
      body: {
        fornecedor: $("nf-fornecedor").value.trim(),
        quantidade: total,
        dt_compra: $("nf-data").value,
      },
    });
    if (!r.ok)
      return { erro: r.error || "Não foi possível registrar a nota fiscal." };
    const id =
      idDe(r.data, "id_nota", "id") ??
      idDe(r.data && r.data.nota, "id_nota", "id");
    return id === null
      ? {
          erro: "A nota foi criada, mas o servidor não devolveu o número dela.",
        }
      : { id };
  }

  async function enviarArquivo(id) {
    const arq = $("nf-arquivo").files[0];
    if (!arq) return null;
    const fd = new FormData();
    fd.append("arquivo", arq);
    const r = await Docisis.api(
      `/notasfiscais/${encodeURIComponent(id)}/arquivo`,
      { method: "PUT", body: fd },
    );
    return r.ok ? null : r.error || "falha no envio";
  }

  /** Cria o lote e garante que o saldo inicial ficou registrado. Devolve { ok } ou { erro }. */
  async function criarLote(item, notaId) {
    const quantidade = Number(campo(item, "quantidade").value);
    const r = await Docisis.api("/lotes", {
      method: "POST",
      body: {
        id_produto: Number(campo(item, "produto").value),
        id_nota: Number(notaId),
        dt_validade: campo(item, "validade").value,
        quantidade,
      },
    });
    if (!r.ok) return { erro: r.error || "Não foi possível criar o lote." };

    const idLote = idDe(r.data, "id", "id_lote");
    if (idLote === null)
      return { ok: true, aviso: "Lote criado (confira o saldo no estoque)." };

    // confere o saldo: se o back-end não lançou a quantidade, registra como entrada
    let saldo =
      typeof (r.data && r.data.quantidade) === "number"
        ? r.data.quantidade
        : null;
    if (saldo === null) {
      const g = await Docisis.api(`/lotes/${encodeURIComponent(idLote)}`);
      saldo =
        g.ok && g.data && typeof g.data.quantidade === "number"
          ? g.data.quantidade
          : null;
    }
    if (saldo !== null && saldo < quantidade) {
      const e = await Docisis.api("/entradas", {
        method: "POST",
        body: {
          id_lote: Number(idLote),
          quantidade: quantidade - saldo,
          motivo: `Recebimento da nota fiscal ${notaId}`,
        },
      });
      if (!e.ok)
        return {
          ok: true,
          aviso: `Lote ${idLote} criado, mas a entrada do saldo falhou: ${e.error}`,
        };
    }
    return { ok: true, idLote };
  }

  /* -------------------------------- Envio -------------------------------- */
  function travarNota(travar) {
    ["nf-fornecedor", "nf-data", "nf-arquivo"].forEach((id) => {
      $(id).disabled = travar;
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (estado.salvando) return;
    limparAviso();
    if (!validar()) {
      mostrarAviso("Revise os campos destacados.");
      const primeiro = form.querySelector(".is-invalid");
      if (primeiro) primeiro.focus();
      return;
    }

    estado.salvando = true;
    btnSalvar.disabled = true;
    btnSalvar.querySelector("span").textContent = "Salvando…";
    const resultados = [];

    // 1) nota fiscal (só na primeira tentativa)
    if (!estado.notaId) {
      const nota = await criarNota(atualizarTotais());
      if (nota.erro) {
        mostrarAviso(nota.erro);
        return fim();
      }
      estado.notaId = nota.id;
      travarNota(true);
    }

    // 2) arquivo (opcional, só uma vez; falha não impede os lotes)
    let avisoArquivo = "";
    if (!estado.arquivoEnviado && $("nf-arquivo").files[0]) {
      const falha = await enviarArquivo(estado.notaId);
      if (falha)
        avisoArquivo = `O arquivo da nota não foi enviado (${falha}). Os lotes seguem normalmente.`;
      else estado.arquivoEnviado = true;
    }

    // 3) lotes, um a um (não repete os que já deram certo)
    for (const item of itens()) {
      if (item.classList.contains("ok")) continue;
      const status = item.querySelector("[data-status]");
      status.textContent = "Salvando…";
      const r = await criarLote(item, estado.notaId);
      item.classList.toggle("ok", Boolean(r.ok));
      item.classList.toggle("falhou", !r.ok);
      if (r.ok) {
        status.textContent = r.aviso || "Lote registrado.";
        item.querySelectorAll("input,select").forEach((c) => {
          c.disabled = true;
        });
      } else {
        status.textContent = r.erro;
      }
      const sel = campo(item, "produto");
      resultados.push({
        ok: Boolean(r.ok),
        texto: `${sel.options[sel.selectedIndex]?.text || "Produto"} — ${campo(item, "quantidade").value} un., validade ${util.formatarData(campo(item, "validade").value)}`,
        detalhe: r.erro || r.aviso || "",
      });
    }

    const falhas = itens().filter((i) => i.classList.contains("falhou"));
    if (falhas.length) {
      mostrarAviso(
        `${falhas.length} lote(s) não foram salvos. A nota fiscal ${estado.notaId} já foi registrada: corrija e clique em "Tentar novamente".` +
          (avisoArquivo ? " " + avisoArquivo : ""),
        "warning",
      );
      btnSalvar.querySelector("span").textContent =
        "Tentar novamente os lotes com erro";
      falhas.forEach((i) =>
        i.querySelectorAll("input,select").forEach((c) => {
          c.disabled = false;
        }),
      );
      return fim(true);
    }

    mostrarResultado(resultados, avisoArquivo);
    fim(true);

    function fim(manterTexto) {
      estado.salvando = false;
      btnSalvar.disabled = false;
      if (!manterTexto)
        btnSalvar.querySelector("span").textContent = "Registrar recebimento";
    }
  });

  function mostrarResultado(resultados, avisoArquivo) {
    form.classList.add("d-none");
    limparAviso();
    $("resultado-titulo").innerHTML =
      `<i class="bi bi-check-circle-fill" style="color:var(--docisis-success)" aria-hidden="true"></i> Recebimento registrado (nota ${esc(estado.notaId)})`;
    $("resultado-lista").innerHTML =
      resultados
        .map(
          (r) =>
            `<li><i class="bi bi-check2 ok" aria-hidden="true"></i><span>${esc(r.texto)}${r.detalhe ? ` <em>— ${esc(r.detalhe)}</em>` : ""}</span></li>`,
        )
        .join("") +
      (avisoArquivo
        ? `<li><i class="bi bi-exclamation-triangle erro" aria-hidden="true"></i><span>${esc(avisoArquivo)}</span></li>`
        : "");
    $("resultado").classList.remove("d-none");
    $("resultado").focus();
    Docisis.toast("Recebimento registrado com sucesso.", "sucesso");
  }

  $("btn-novo").addEventListener("click", () => {
    estado.notaId = null;
    estado.arquivoEnviado = false;
    form.reset();
    lista.innerHTML = "";
    travarNota(false);
    $("nf-data").value = hojeISO();
    adicionarItem();
    btnSalvar.querySelector("span").textContent = "Registrar recebimento";
    $("resultado").classList.add("d-none");
    form.classList.remove("d-none");
    $("nf-fornecedor").focus();
  });

  /* --------------------------------- Início --------------------------------- */
  $("nf-data").value = hojeISO();
  $("nf-data").max = hojeISO();
  adicionarItem();
  carregarProdutos();
});
