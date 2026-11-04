/**
 * DOCISIS - CADASTRO DE PRODUTOS (produtos.js)
 *
 * Endpoints usados:
 *   POST /produtos               { nome, codigo, peso?, estoque_minimo?, estoque_maximo? }
 *   PUT  /produtos/:id/imagem    multipart/form-data, campo "imagem" (JPEG, PNG ou WEBP)
 *
 * A foto é enviada DEPOIS que o produto é criado, porque o back-end não aceita
 * imagem no POST /produtos.
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { auth, layout } = Docisis;

  /* ------------------------------------------------------------------
       Proteção da página
       ------------------------------------------------------------------ */
  if (!auth.exigirPermissao("PRODUTO_GERENCIAR")) return;
  layout.montar("produtos");

  /* ------------------------------------------------------------------
       Elementos
       ------------------------------------------------------------------ */
  const $ = (id) => document.getElementById(id);

  const form = $("form-cadastro-produto");
  const aviso = $("aviso-produto");
  const btnSalvar = $("btn-salvar-produto");

  const campos = {
    nome: { input: $("produto-nome"), erro: $("erro-nome"), aba: "basico" },
    codigo: {
      input: $("produto-codigo"),
      erro: $("erro-codigo"),
      aba: "basico",
    },
    peso: { input: $("produto-peso"), erro: $("erro-peso"), aba: "estoque" },
    minimo: {
      input: $("estoque-minimo"),
      erro: $("erro-minimo"),
      aba: "estoque",
    },
    maximo: {
      input: $("estoque-maximo"),
      erro: $("erro-maximo"),
      aba: "estoque",
    },
  };
  const ABAS = { basico: $("tab-basico-btn"), estoque: $("tab-estoque-btn") };

  const dropzone = $("image-dropzone");
  const fileInput = $("foto-produto-input");
  const placeholder = $("dropzone-placeholder-content");
  const previewImg = $("image-preview-img");
  const previewOverlay = $("image-preview-overlay");
  const statusBadge = $("image-status-badge");
  const erroFoto = $("erro-foto");

  const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
  const MAX_INT = 2147483647;

  let arquivoImagem = null;
  let urlPreview = null;

  /* ------------------------------------------------------------------
       Abas
       ------------------------------------------------------------------ */
  const ativarAba = (nome) =>
    bootstrap.Tab.getOrCreateInstance(ABAS[nome]).show();

  $("btn-avancar-aba1").addEventListener("click", () => ativarAba("estoque"));
  $("btn-voltar-aba2").addEventListener("click", () => ativarAba("basico"));

  /* ------------------------------------------------------------------
       Erros por campo
       ------------------------------------------------------------------ */
  function marcarErro(chave, mensagem) {
    const { input, erro } = campos[chave];
    input.classList.toggle("is-invalid", Boolean(mensagem));
    input.setAttribute("aria-invalid", String(Boolean(mensagem)));
    erro.textContent = mensagem || "";
  }

  function limparErros() {
    Object.keys(campos).forEach((c) => marcarErro(c, ""));
    erroFoto.textContent = "";
    dropzone.classList.remove("is-invalid");
  }

  // Digitou de novo: some o erro daquele campo
  Object.entries(campos).forEach(([chave, { input }]) => {
    input.addEventListener("input", () => marcarErro(chave, ""));
  });

  function mostrarAviso(html, tipo) {
    aviso.className = `alert alert-${tipo}`;
    aviso.innerHTML = html;
  }
  function esconderAviso() {
    aviso.className = "alert d-none";
    aviso.innerHTML = "";
  }

  /* ------------------------------------------------------------------
       Código: só dígitos + gerador
       ------------------------------------------------------------------ */
  campos.codigo.input.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  $("btn-gerar-codigo").addEventListener("click", () => {
    // 6 dígitos aleatórios. Se por acaso já existir, o servidor avisa (409) e basta gerar outro.
    campos.codigo.input.value = String(
      Math.floor(100000 + Math.random() * 900000),
    );
    marcarErro("codigo", "");
    campos.codigo.input.focus();
  });

  /* ------------------------------------------------------------------
       Validação (espelha as regras do produtos.controller.js)
       ------------------------------------------------------------------ */
  function inteiroOpcional(texto) {
    if (texto === "") return { vazio: true };
    const n = Number(texto);
    if (!Number.isInteger(n) || n < 0 || n > MAX_INT)
      return { erro: "Informe um número inteiro maior ou igual a zero." };
    return { valor: n };
  }

  function validar() {
    const erros = {};
    const corpo = {};

    const nome = campos.nome.input.value.trim();
    if (nome.length < 2 || nome.length > 100)
      erros.nome = "O nome deve ter entre 2 e 100 caracteres.";
    else corpo.nome = nome;

    const codigoTxt = campos.codigo.input.value.trim();
    const codigo = Number(codigoTxt);
    if (!codigoTxt) erros.codigo = "Informe o código do produto.";
    else if (!Number.isInteger(codigo) || codigo <= 0 || codigo > MAX_INT)
      erros.codigo = "O código deve ser um número inteiro positivo.";
    else corpo.codigo = codigo;

    const pesoTxt = campos.peso.input.value.trim();
    if (pesoTxt !== "") {
      const peso = Math.round(Number(pesoTxt) * 100) / 100; // o banco guarda 2 casas
      if (!(peso > 0 && peso < 1000000))
        erros.peso = "O peso deve ser maior que 0,01 kg.";
      else corpo.peso = peso;
    }

    const min = inteiroOpcional(campos.minimo.input.value.trim());
    const max = inteiroOpcional(campos.maximo.input.value.trim());
    if (min.erro) erros.minimo = min.erro;
    else if (!min.vazio) corpo.estoque_minimo = min.valor;
    if (max.erro) erros.maximo = max.erro;
    else if (!max.vazio) corpo.estoque_maximo = max.valor;
    if (
      !erros.minimo &&
      !erros.maximo &&
      !min.vazio &&
      !max.vazio &&
      min.valor > max.valor
    ) {
      erros.maximo = "O estoque máximo não pode ser menor que o mínimo.";
    }

    return { erros, corpo };
  }

  function aplicarErros(erros) {
    const chaves = Object.keys(erros);
    chaves.forEach((c) => marcarErro(c, erros[c]));
    if (chaves.length === 0) return;

    const primeira = campos[chaves[0]];
    ativarAba(primeira.aba);
    // espera a aba aparecer para o foco funcionar
    setTimeout(() => primeira.input.focus(), 160);
  }

  /* ------------------------------------------------------------------
       Foto
       ------------------------------------------------------------------ */
  function removerFoto() {
    arquivoImagem = null;
    fileInput.value = "";
    if (urlPreview) URL.revokeObjectURL(urlPreview);
    urlPreview = null;
    previewImg.removeAttribute("src");
    previewImg.classList.add("d-none");
    placeholder.classList.remove("d-none");
    previewOverlay.classList.add("d-none");
    statusBadge.className = "image-status-badge";
    statusBadge.innerHTML =
      '<i class="bi bi-image text-muted" aria-hidden="true"></i> Nenhuma foto';
  }

  function escolherFoto(arquivo) {
    erroFoto.textContent = "";
    dropzone.classList.remove("is-invalid");
    if (!arquivo) return;

    if (!TIPOS_IMAGEM.includes(arquivo.type)) {
      erroFoto.textContent = "Use uma imagem PNG, JPG ou WEBP.";
      dropzone.classList.add("is-invalid");
      return;
    }

    arquivoImagem = arquivo;
    if (urlPreview) URL.revokeObjectURL(urlPreview);
    urlPreview = URL.createObjectURL(arquivo);
    previewImg.src = urlPreview;
    previewImg.classList.remove("d-none");
    placeholder.classList.add("d-none");
    previewOverlay.classList.remove("d-none");
    statusBadge.className = "image-status-badge badge-success";
    statusBadge.innerHTML =
      '<i class="bi bi-check-circle text-success" aria-hidden="true"></i> Imagem carregada';
  }

  dropzone.addEventListener("click", (e) => {
    if (
      e.target.closest("#btn-trocar-foto") ||
      e.target.closest("#btn-remover-foto")
    )
      return;
    fileInput.click();
  });
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  });
  dropzone.addEventListener("dragleave", () =>
    dropzone.classList.remove("drag-over"),
  );
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    escolherFoto(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", () => escolherFoto(fileInput.files[0]));
  $("btn-trocar-foto").addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  $("btn-remover-foto").addEventListener("click", (e) => {
    e.stopPropagation();
    removerFoto();
  });

  /* ------------------------------------------------------------------
       Salvar
       ------------------------------------------------------------------ */
  function botaoCarregando(carregando) {
    if (carregando) {
      btnSalvar.dataset.original = btnSalvar.innerHTML;
      btnSalvar.disabled = true;
      btnSalvar.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Salvando...';
    } else {
      btnSalvar.disabled = false;
      if (btnSalvar.dataset.original)
        btnSalvar.innerHTML = btnSalvar.dataset.original;
    }
  }

  function limparFormulario() {
    form.reset();
    removerFoto();
    limparErros();
    ativarAba("basico");
    campos.nome.input.focus();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAviso();
    limparErros();

    const { erros, corpo } = validar();
    if (Object.keys(erros).length > 0) {
      aplicarErros(erros);
      Docisis.toast("Corrija os campos destacados.", "erro");
      return;
    }

    botaoCarregando(true);
    const r = await Docisis.api("/produtos", { method: "POST", body: corpo });

    if (!r.ok) {
      botaoCarregando(false);
      if (r.status === 409) {
        // o único campo único do produto é o código
        aplicarErros({ codigo: "Já existe um produto com este código." });
      } else if (r.status === 403) {
        mostrarAviso(
          "Você não tem permissão para cadastrar produtos.",
          "danger",
        );
      } else {
        mostrarAviso(Docisis.util.esc(r.error), "danger");
      }
      return;
    }

    // Foto (opcional): só depois de o produto existir
    let avisoFoto = "";
    if (arquivoImagem) {
      const id = r.data && (r.data.id_produto ?? r.data.id);
      if (id === undefined || id === null) {
        avisoFoto =
          "A foto não foi enviada porque o servidor não devolveu o id do produto.";
      } else {
        const fd = new FormData();
        fd.append("imagem", arquivoImagem);
        const rf = await Docisis.api(
          `/produtos/${encodeURIComponent(id)}/imagem`,
          { method: "PUT", body: fd },
        );
        if (!rf.ok) avisoFoto = `A foto não foi enviada: ${rf.error}`;
      }
    }
    botaoCarregando(false);

    const nome = Docisis.util.esc(corpo.nome);
    let html =
      `<strong>Produto "${nome}" cadastrado</strong> (código ${corpo.codigo}). ` +
      "Para dar saldo a ele, registre um lote com a nota fiscal. " +
      '<a href="estoque.html" class="alert-link">Ir para o estoque</a>';
    if (avisoFoto)
      html += `<br><span class="small">${Docisis.util.esc(avisoFoto)} O produto foi criado sem foto.</span>`;
    mostrarAviso(html, avisoFoto ? "warning" : "success");
    Docisis.toast(
      `Produto "${corpo.nome}" cadastrado!`,
      avisoFoto ? "aviso" : "sucesso",
    );

    limparFormulario();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
