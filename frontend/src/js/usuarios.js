/**
 * DOCISIS - GESTÃO DE USUÁRIOS (usuarios.js)
 * Restrito a quem tem FUNCIONARIO_GERENCIAR.
 *
 * Endpoints usados:
 *   GET    /cargos                 lista de cargos
 *   GET    /cargos/:id             (opcional) permissões do cargo, para a "matriz"
 *   GET    /funcionarios           lista paginada
 *   POST   /funcionarios           { nome, cpf, email, senha, telefone, id_cargo }
 *   PUT    /funcionarios/:id       { nome?, email?, senha?, telefone? }   (CPF não muda)
 *   PUT    /funcionarios/:id/cargo { id_cargo }                            (exige CARGO_GERENCIAR)
 *   DELETE /funcionarios/:id
 *
 * O back não tem busca nem filtro na listagem: carregamos todos os funcionários
 * (equipe pequena) e filtramos aqui no navegador.
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { auth, util, layout } = Docisis;
  const { esc } = util;

  /* ------------------------------------------------------------------
       Proteção da página
       ------------------------------------------------------------------ */
  if (!auth.exigirPermissao("FUNCIONARIO_GERENCIAR")) return;
  layout.montar("admin");

  const euMesmo = (auth.getUsuario() || {}).id;
  const podeAlterarCargo = auth.temPermissao("CARGO_GERENCIAR");

  /* ------------------------------------------------------------------
       Constantes
       ------------------------------------------------------------------ */
  const POR_PAGINA = 8;
  const LIMITE_API = 100;

  // Estilo visual por cargo (nomes do script inicial do banco). Outros cargos usam o estilo "operador".
  const ESTILO_CARGO = {
    lider: {
      classe: "admin",
      icone: "bi-shield-fill-check",
      iconeCard: "bi-shield-lock-fill",
      nivel: "Acesso Total",
      nivelClasse: "level-full",
      desc: "Controle total: equipe, cargos, produtos, lotes, notas fiscais e relatórios.",
    },
    "responsavel do setor": {
      classe: "lider",
      icone: "bi-award-fill",
      iconeCard: "bi-award-fill",
      nivel: "Gestão do Setor",
      nivelClasse: "level-mid",
      desc: "Produtos, lotes, notas fiscais, ajustes e relatórios. Sem gestão de equipe.",
    },
    estoquista: {
      classe: "operador",
      icone: "bi-person-badge-fill",
      iconeCard: "bi-person-badge-fill",
      nivel: "Operacional",
      nivelClasse: "level-basic",
      desc: "Dia a dia: consulta de estoque, entradas, saídas e alertas.",
    },
  };
  const ESTILO_PADRAO = {
    classe: "operador",
    icone: "bi-person-badge-fill",
    iconeCard: "bi-person-badge-fill",
    nivel: "Personalizado",
    nivelClasse: "level-basic",
    desc: "Cargo personalizado.",
  };

  /* ------------------------------------------------------------------
       Elementos e estado
       ------------------------------------------------------------------ */
  const $ = (id) => document.getElementById(id);

  const estado = {
    funcionarios: [],
    cargos: [],
    busca: "",
    filtroCargo: "",
    pagina: 1,
    alvo: null, // funcionário do modal aberto
    permissoesPorCargo: new Map(),
  };

  const norm = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  const estiloDe = (nomeCargo) =>
    ESTILO_CARGO[norm(nomeCargo)] || ESTILO_PADRAO;
  const somenteDigitos = (s) => String(s || "").replace(/\D/g, "");

  // Respostas de lista podem vir como array ou { dados: [...] }
  const comoLista = (data) =>
    Array.isArray(data) ? data : (data && (data.dados || data.items)) || [];

  /* ------------------------------------------------------------------
       Helpers de interface
       ------------------------------------------------------------------ */
  function mostrarAviso(html, tipo) {
    const a = $("aviso-usuarios");
    a.className = `alert alert-${tipo}`;
    a.innerHTML = html;
  }
  function esconderAviso() {
    const a = $("aviso-usuarios");
    a.className = "alert d-none";
    a.innerHTML = "";
  }

  /** Marca o campo (input dentro de .input-group-docisis) e escreve a mensagem no .invalid-feedback. */
  function marcarCampo(input, mensagem) {
    const grupo = input.closest(".input-group-docisis");
    const feedback =
      grupo && grupo.parentElement.querySelector(".invalid-feedback");
    input.classList.toggle("is-invalid", Boolean(mensagem));
    grupo.classList.toggle("is-invalid", Boolean(mensagem));
    input.setAttribute("aria-invalid", String(Boolean(mensagem)));
    if (feedback) feedback.textContent = mensagem || "";
  }

  function limparMarcacoes(form) {
    form
      .querySelectorAll(".form-control, .form-select")
      .forEach((i) => marcarCampo(i, ""));
  }

  function botaoCarregando(botao, carregando, texto) {
    if (carregando) {
      botao.dataset.original = botao.innerHTML;
      botao.disabled = true;
      botao.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${texto}`;
    } else {
      botao.disabled = false;
      if (botao.dataset.original) botao.innerHTML = botao.dataset.original;
    }
  }

  function modal(id) {
    return bootstrap.Modal.getOrCreateInstance($(id));
  }

  function mostrarAvisoModal(id, mensagem) {
    const a = $(id);
    a.textContent = mensagem || "";
    a.classList.toggle("d-none", !mensagem);
  }

  /* ------------------------------------------------------------------
       Validações (espelham o funcionarios.controller.js)
       ------------------------------------------------------------------ */
  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function cpfValido(valor) {
    const c = somenteDigitos(valor);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    const digito = (base) => {
      let soma = 0;
      for (let i = 0; i < base; i++) soma += Number(c[i]) * (base + 1 - i);
      const r = (soma * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return digito(9) === Number(c[9]) && digito(10) === Number(c[10]);
  }

  const telefoneValido = (v) => [10, 11].includes(somenteDigitos(v).length);
  const senhaValida = (s) =>
    s.length >= 8 && new TextEncoder().encode(s).length <= 72;

  /** Senha aleatória de 12 caracteres com maiúscula, minúscula, número e símbolo. */
  function gerarSenha() {
    const grupos = [
      "ABCDEFGHJKLMNPQRSTUVWXYZ",
      "abcdefghijkmnopqrstuvwxyz",
      "23456789",
      "!@#$%&*?",
    ];
    const todos = grupos.join("");
    const sorteio = (max) => {
      const buf = new Uint32Array(1);
      let v;
      do {
        crypto.getRandomValues(buf);
        v = buf[0];
      } while (v >= Math.floor(2 ** 32 / max) * max); // sem viés
      return v % max;
    };
    const chars = grupos.map((g) => g[sorteio(g.length)]);
    while (chars.length < 12) chars.push(todos[sorteio(todos.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = sorteio(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
  }

  /* ------------------------------------------------------------------
       Carregamento de dados
       ------------------------------------------------------------------ */
  const idDoCargo = (c) => c.id_cargo ?? c.id;
  const idDoFuncionario = (f) => f.id ?? f.id_funcionario;

  async function carregarCargos() {
    const r = await Docisis.api("/cargos");
    if (!r.ok) {
      $("lista-cargos").innerHTML =
        `<p class="text-danger small mb-0">${esc(r.error)}</p>`;
      return false;
    }
    estado.cargos = comoLista(r.data).map((c) => ({
      id: idDoCargo(c),
      nome: c.nome,
    }));
    return true;
  }

  async function carregarFuncionarios() {
    const todos = [];
    let pagina = 1;
    let totalPaginas = 1;
    do {
      // O nome dos parâmetros de paginação depende do utils/paginacao.js: enviamos as duas grafias
      const r = await Docisis.api("/funcionarios", {
        query: { page: pagina, pagina, limit: LIMITE_API, limite: LIMITE_API },
      });
      if (!r.ok) return { erro: r.error };
      todos.push(...comoLista(r.data));
      totalPaginas = (r.data && r.data.totalPaginas) || 1;
      pagina++;
    } while (pagina <= totalPaginas);
    estado.funcionarios = todos;
    return {};
  }

  async function carregarTudo() {
    const [okCargos, resFunc] = await Promise.all([
      carregarCargos(),
      carregarFuncionarios(),
    ]);
    if (resFunc.erro) {
      $("tabela-usuarios-corpo").innerHTML =
        `<tr><td colspan="5" class="text-center py-5 text-danger">${esc(resFunc.erro)}</td></tr>`;
      $("usuarios-paginacao-info").textContent = "Erro ao carregar.";
      return;
    }
    if (okCargos) {
      renderizarCargosNoFormulario();
      renderizarFiltroCargo();
    }
    renderizarKpis();
    renderizarLista();
  }

  /* ------------------------------------------------------------------
       Renderização: KPIs, filtro, cargos do formulário
       ------------------------------------------------------------------ */
  function nomeDoCargoDe(f) {
    if (f.cargo && typeof f.cargo === "string") return f.cargo;
    if (f.cargo_nome) return f.cargo_nome;
    const c = estado.cargos.find((x) => x.id === f.id_cargo);
    return c ? c.nome : "—";
  }

  function renderizarKpis() {
    const total = estado.funcionarios.length;
    const cartoes = [
      `<div class="kpi-card kpi-card-operadores">
                <div class="kpi-header"><span class="kpi-label">Equipe Cadastrada</span>
                    <div class="kpi-icon-box" aria-hidden="true"><i class="bi bi-people-fill"></i></div></div>
                <div class="kpi-value-box"><span class="kpi-main-number">${total}</span>
                    <span class="kpi-sub-text">funcionários no sistema</span></div>
                <div class="kpi-footer-badge"><span class="text-muted">Cargos disponíveis</span>
                    <span class="fw-bold text-dark">${estado.cargos.length}</span></div>
            </div>`,
    ];
    estado.cargos.slice(0, 3).forEach((c) => {
      const qtd = estado.funcionarios.filter((f) => f.id_cargo === c.id).length;
      const pct = total ? Math.round((qtd / total) * 100) : 0;
      const est = estiloDe(c.nome);
      cartoes.push(
        `<div class="kpi-card">
                    <div class="kpi-header"><span class="kpi-label">${esc(c.nome)}</span>
                        <div class="kpi-icon-box" aria-hidden="true"><i class="bi ${est.iconeCard}"></i></div></div>
                    <div class="kpi-value-box"><span class="kpi-main-number">${qtd}</span>
                        <span class="kpi-sub-text">com este cargo</span></div>
                    <div class="kpi-footer-badge"><span class="text-muted">Da equipe</span>
                        <span class="fw-bold text-dark">${pct}%</span></div>
                </div>`,
      );
    });
    $("kpi-usuarios").innerHTML = cartoes.join("");
  }

  function renderizarFiltroCargo() {
    const select = $("filtro-cargo");
    const atual = select.value;
    select.innerHTML =
      '<option value="">Todos os Cargos</option>' +
      estado.cargos
        .map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`)
        .join("");
    select.value = atual;
  }

  function renderizarCargosNoFormulario() {
    const padrao =
      estado.cargos.find((c) => norm(c.nome) === "estoquista") ||
      estado.cargos[0];
    $("lista-cargos").innerHTML = estado.cargos
      .map((c) => {
        const est = estiloDe(c.nome);
        return `
                <label class="role-selector-card" for="cargo-${c.id}">
                    <input type="radio" name="cargo" id="cargo-${c.id}" value="${c.id}" class="role-radio-input" ${padrao && padrao.id === c.id ? "checked" : ""}>
                    <div class="role-card-content">
                        <div class="role-card-header">
                            <div class="d-flex align-items-center gap-2">
                                <span class="role-icon-box role-icon-${est.classe}" aria-hidden="true"><i class="bi ${est.iconeCard}"></i></span>
                                <span class="role-card-name">${esc(c.nome)}</span>
                            </div>
                            <span class="role-level-pill ${est.nivelClasse}">${esc(est.nivel)}</span>
                        </div>
                        <p class="role-card-desc">${esc(est.desc)}</p>
                    </div>
                </label>`;
      })
      .join("");
    atualizarMatrizPermissoes();
  }

  /** Mostra as permissões do cargo marcado, se o GET /cargos/:id devolver essa lista. */
  async function atualizarMatrizPermissoes() {
    const marcado = document.querySelector('input[name="cargo"]:checked');
    const caixa = $("matriz-permissoes");
    if (!marcado) {
      caixa.classList.add("d-none");
      return;
    }

    const id = Number(marcado.value);
    if (!estado.permissoesPorCargo.has(id)) {
      const r = await Docisis.api(`/cargos/${id}`);
      const lista = r.ok && r.data ? r.data.permissoes : null;
      estado.permissoesPorCargo.set(id, Array.isArray(lista) ? lista : null);
    }
    const permissoes = estado.permissoesPorCargo.get(id);
    const aindaMarcado = document.querySelector('input[name="cargo"]:checked');
    if (!aindaMarcado || Number(aindaMarcado.value) !== id) return; // usuário já trocou

    if (!permissoes || permissoes.length === 0) {
      caixa.classList.add("d-none");
      return;
    }
    $("lista-permissoes").innerHTML = permissoes
      .map((p) => {
        const texto = typeof p === "string" ? p : p.descricao || p.nome || "";
        return `<li><i class="bi bi-check-circle-fill text-success me-1" aria-hidden="true"></i> ${esc(texto)}</li>`;
      })
      .join("");
    caixa.classList.remove("d-none");
  }

  $("lista-cargos").addEventListener("change", atualizarMatrizPermissoes);

  /* ------------------------------------------------------------------
       Renderização: tabela
       ------------------------------------------------------------------ */
  function funcionariosFiltrados() {
    const termo = norm(estado.busca);
    const termoDigitos = somenteDigitos(estado.busca);
    return estado.funcionarios.filter((f) => {
      if (estado.filtroCargo && String(f.id_cargo) !== estado.filtroCargo)
        return false;
      if (!termo) return true;
      return (
        norm(f.nome).includes(termo) ||
        norm(f.email).includes(termo) ||
        (termoDigitos.length >= 3 &&
          somenteDigitos(f.cpf).includes(termoDigitos))
      );
    });
  }

  const cpfMascarado = (cpf) => {
    const d = somenteDigitos(cpf);
    return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : "—";
  };

  function linhaFuncionario(f) {
    const id = idDoFuncionario(f);
    const nomeCargo = nomeDoCargoDe(f);
    const est = estiloDe(nomeCargo);
    const ehEuMesmo = id === euMesmo;
    const nome = esc(f.nome);

    const botaoCargo = podeAlterarCargo
      ? `<button type="button" class="btn-table-action" data-acao="cargo" data-id="${id}" title="Alterar cargo" aria-label="Alterar cargo de ${nome}"><i class="bi bi-sliders" aria-hidden="true"></i></button>`
      : "";

    return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-badge avatar-${est.classe}" aria-hidden="true">${esc(util.iniciais(f.nome))}</div>
                        <div class="user-meta">
                            <span class="user-name">${nome}${ehEuMesmo ? ' <small class="text-muted">(você)</small>' : ""}</span>
                            <span class="user-email">${esc(f.email)}</span>
                        </div>
                    </div>
                </td>
                <td><span class="role-badge role-${est.classe}"><i class="bi ${est.icone}" aria-hidden="true"></i> ${esc(nomeCargo)}</span></td>
                <td>
                    <span class="timestamp-main">${esc(f.telefone || "—")}</span>
                    <span class="timestamp-sub">CPF ${cpfMascarado(f.cpf)}</span>
                </td>
                <td><span class="timestamp-main">${f.criado_em ? util.formatarData(String(f.criado_em).slice(0, 10)) : "—"}</span></td>
                <td class="text-end">
                    <div class="action-buttons-group justify-content-end">
                        <button type="button" class="btn-table-action" data-acao="editar" data-id="${id}" title="Editar dados ou redefinir senha" aria-label="Editar ${nome}"><i class="bi bi-pencil" aria-hidden="true"></i></button>
                        ${botaoCargo}
                        <button type="button" class="btn-table-action acao-perigo" data-acao="excluir" data-id="${id}" ${ehEuMesmo ? "disabled" : ""} title="${ehEuMesmo ? "Você não pode excluir a própria conta" : "Excluir funcionário"}" aria-label="Excluir ${nome}"><i class="bi bi-trash3" aria-hidden="true"></i></button>
                    </div>
                </td>
            </tr>`;
  }

  function renderizarLista() {
    const lista = funcionariosFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (estado.pagina > totalPaginas) estado.pagina = totalPaginas;

    const inicio = (estado.pagina - 1) * POR_PAGINA;
    const pagina = lista.slice(inicio, inicio + POR_PAGINA);

    $("tabela-usuarios-corpo").innerHTML = pagina.length
      ? pagina.map(linhaFuncionario).join("")
      : `<tr><td colspan="5" class="text-center py-5 text-muted">
                   <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary" aria-hidden="true"></i>
                   Nenhum funcionário encontrado.</td></tr>`;

    $("usuarios-paginacao-info").textContent = lista.length
      ? `Mostrando ${inicio + 1} a ${inicio + pagina.length} de ${lista.length} funcionários`
      : "Nenhum registro encontrado.";

    const ctrl = $("usuarios-paginacao-controles");
    if (totalPaginas <= 1) {
      ctrl.innerHTML = "";
      return;
    }
    const p = estado.pagina;
    let html = `<button type="button" class="page-btn" data-pagina="${p - 1}" aria-label="Página anterior" ${p === 1 ? "disabled" : ""}><i class="bi bi-chevron-left" aria-hidden="true"></i></button>`;
    for (let i = 1; i <= totalPaginas; i++) {
      html += `<button type="button" class="page-btn ${i === p ? "active" : ""}" data-pagina="${i}" ${i === p ? 'aria-current="page"' : ""}>${i}</button>`;
    }
    html += `<button type="button" class="page-btn" data-pagina="${p + 1}" aria-label="Próxima página" ${p === totalPaginas ? "disabled" : ""}><i class="bi bi-chevron-right" aria-hidden="true"></i></button>`;
    ctrl.innerHTML = html;
  }

  /* ------------------------------------------------------------------
       Eventos da lista
       ------------------------------------------------------------------ */
  $("busca-usuario").addEventListener(
    "input",
    util.debounce((e) => {
      estado.busca = e.target.value.trim();
      estado.pagina = 1;
      renderizarLista();
    }, 200),
  );

  $("filtro-cargo").addEventListener("change", (e) => {
    estado.filtroCargo = e.target.value;
    estado.pagina = 1;
    renderizarLista();
  });

  $("usuarios-paginacao-controles").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pagina]");
    if (!btn || btn.disabled) return;
    estado.pagina = Number(btn.dataset.pagina);
    renderizarLista();
  });

  $("tabela-usuarios-corpo").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-acao]");
    if (!btn || btn.disabled) return;
    const f = estado.funcionarios.find(
      (x) => String(idDoFuncionario(x)) === btn.dataset.id,
    );
    if (!f) return;
    estado.alvo = f;
    if (btn.dataset.acao === "editar") abrirEdicao(f);
    else if (btn.dataset.acao === "cargo") abrirCargo(f);
    else if (btn.dataset.acao === "excluir") abrirExclusao(f);
  });

  /* ------------------------------------------------------------------
       Cadastro
       ------------------------------------------------------------------ */
  const form = $("form-cadastro-usuario");
  const campo = {
    nome: $("novo-nome"),
    email: $("novo-email"),
    cpf: $("novo-cpf"),
    telefone: $("novo-telefone"),
    senha: $("novo-senha"),
  };

  campo.cpf.addEventListener("input", (e) => {
    e.target.value = util.formatarCPF(e.target.value);
  });
  campo.telefone.addEventListener("input", (e) => {
    e.target.value = util.formatarTelefone(e.target.value);
  });
  Object.values(campo).forEach((i) =>
    i.addEventListener("input", () => marcarCampo(i, "")),
  );

  $("btn-gerar-senha").addEventListener("click", () => {
    campo.senha.type = "text"; // mostra para o administrador anotar
    campo.senha.value = gerarSenha();
    marcarCampo(campo.senha, "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAviso();
    limparMarcacoes(form);

    const erros = [];
    const falha = (input, msg) => {
      marcarCampo(input, msg);
      erros.push(input);
    };

    const nome = campo.nome.value.trim();
    if (nome.length < 2 || nome.length > 100)
      falha(campo.nome, "O nome deve ter entre 2 e 100 caracteres.");
    const email = campo.email.value.trim();
    if (!REGEX_EMAIL.test(email))
      falha(campo.email, "Informe um e-mail válido.");
    if (!cpfValido(campo.cpf.value)) falha(campo.cpf, "CPF inválido.");
    if (!telefoneValido(campo.telefone.value))
      falha(campo.telefone, "Informe o telefone com DDD.");
    const senha = campo.senha.value;
    if (!senhaValida(senha))
      falha(campo.senha, "A senha deve ter de 8 a 72 caracteres.");
    const cargoMarcado = document.querySelector('input[name="cargo"]:checked');
    if (!cargoMarcado) {
      mostrarAviso("Selecione o cargo do funcionário.", "danger");
      return;
    }
    if (erros.length) {
      erros[0].focus();
      return;
    }

    const btn = $("btn-cadastrar-usuario");
    botaoCarregando(btn, true, "Cadastrando...");
    const r = await Docisis.api("/funcionarios", {
      method: "POST",
      body: {
        nome,
        email,
        cpf: campo.cpf.value,
        senha,
        telefone: campo.telefone.value.trim(),
        id_cargo: Number(cargoMarcado.value),
      },
    });
    botaoCarregando(btn, false);

    if (!r.ok) {
      if (r.status === 409) {
        // mensagem do back: "Já existe um registro com este cpf/email"
        const m = /este (\w+)/.exec(r.error || "");
        const alvo = m && campo[m[1]];
        if (alvo) falha(alvo, r.error);
        else mostrarAviso(esc(r.error), "danger");
        if (alvo) alvo.focus();
      } else {
        mostrarAviso(esc(r.error), "danger");
      }
      return;
    }

    mostrarAviso(
      `<strong>${esc(nome)} foi cadastrado(a).</strong> Entregue a senha provisória pessoalmente: ` +
        `<span class="senha-provisoria">${esc(senha)}</span> ` +
        '<span class="small">Ela não será exibida novamente.</span>',
      "success",
    );
    Docisis.toast("Funcionário cadastrado com sucesso!");
    form.reset();
    campo.senha.type = "password";
    renderizarCargosNoFormulario();
    window.scrollTo({ top: 0, behavior: "smooth" });
    await carregarFuncionarios();
    renderizarKpis();
    renderizarLista();
  });

  /* ------------------------------------------------------------------
       Edição de dados / redefinição de senha
       ------------------------------------------------------------------ */
  const edit = {
    nome: $("edit-nome"),
    email: $("edit-email"),
    telefone: $("edit-telefone"),
    senha: $("edit-senha"),
  };
  edit.telefone.addEventListener("input", (e) => {
    e.target.value = util.formatarTelefone(e.target.value);
  });
  Object.values(edit).forEach((i) =>
    i.addEventListener("input", () => marcarCampo(i, "")),
  );

  function abrirEdicao(f) {
    limparMarcacoes($("form-editar"));
    mostrarAvisoModal("editar-aviso", "");
    edit.nome.value = f.nome || "";
    edit.email.value = f.email || "";
    edit.telefone.value = f.telefone || "";
    edit.senha.value = "";
    edit.senha.type = "password";
    modal("modalEditar").show();
  }

  $("btn-gerar-senha-edicao").addEventListener("click", () => {
    edit.senha.type = "text";
    edit.senha.value = gerarSenha();
    marcarCampo(edit.senha, "");
  });

  $("form-editar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = estado.alvo;
    limparMarcacoes($("form-editar"));
    mostrarAvisoModal("editar-aviso", "");

    const corpo = {};
    const erros = [];
    const falha = (input, msg) => {
      marcarCampo(input, msg);
      erros.push(input);
    };

    const nome = edit.nome.value.trim();
    if (nome !== (f.nome || "")) {
      if (nome.length < 2 || nome.length > 100)
        falha(edit.nome, "O nome deve ter entre 2 e 100 caracteres.");
      else corpo.nome = nome;
    }
    const email = edit.email.value.trim();
    if (email.toLowerCase() !== (f.email || "").toLowerCase()) {
      if (!REGEX_EMAIL.test(email))
        falha(edit.email, "Informe um e-mail válido.");
      else corpo.email = email;
    }
    const telefone = edit.telefone.value.trim();
    if (somenteDigitos(telefone) !== somenteDigitos(f.telefone)) {
      if (!telefoneValido(telefone))
        falha(edit.telefone, "Informe o telefone com DDD.");
      else corpo.telefone = telefone;
    }
    if (edit.senha.value) {
      if (!senhaValida(edit.senha.value))
        falha(edit.senha, "A senha deve ter de 8 a 72 caracteres.");
      else corpo.senha = edit.senha.value;
    }
    if (erros.length) {
      erros[0].focus();
      return;
    }
    if (Object.keys(corpo).length === 0) {
      mostrarAvisoModal("editar-aviso", "Nenhuma alteração para salvar.");
      return;
    }

    const btn = $("btn-salvar-edicao");
    botaoCarregando(btn, true, "Salvando...");
    const r = await Docisis.api(
      `/funcionarios/${encodeURIComponent(idDoFuncionario(f))}`,
      { method: "PUT", body: corpo },
    );
    botaoCarregando(btn, false);

    if (!r.ok) {
      if (r.status === 409 && /email/i.test(r.error || ""))
        falha(edit.email, r.error);
      else mostrarAvisoModal("editar-aviso", r.error);
      return;
    }

    modal("modalEditar").hide();
    if (corpo.senha) {
      mostrarAviso(
        `<strong>Dados de ${esc(f.nome)} atualizados.</strong> Nova senha: <span class="senha-provisoria">${esc(corpo.senha)}</span> ` +
          '<span class="small">Entregue pessoalmente. Ela não será exibida novamente.</span>',
        "success",
      );
    } else {
      mostrarAviso(
        `Dados de <strong>${esc(f.nome)}</strong> atualizados.`,
        "success",
      );
    }
    await carregarFuncionarios();
    renderizarKpis();
    renderizarLista();
  });

  /* ------------------------------------------------------------------
       Alteração de cargo
       ------------------------------------------------------------------ */
  function abrirCargo(f) {
    mostrarAvisoModal("cargo-aviso", "");
    $("cargo-nome-funcionario").textContent = f.nome;
    $("cargo-select").innerHTML = estado.cargos
      .map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`)
      .join("");
    $("cargo-select").value = String(f.id_cargo);
    modal("modalCargo").show();
  }

  $("form-cargo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = estado.alvo;
    const novo = Number($("cargo-select").value);
    if (novo === f.id_cargo) {
      mostrarAvisoModal("cargo-aviso", "Este já é o cargo atual.");
      return;
    }
    const btn = $("btn-salvar-cargo");
    botaoCarregando(btn, true, "Alterando...");
    const r = await Docisis.api(
      `/funcionarios/${encodeURIComponent(idDoFuncionario(f))}/cargo`,
      { method: "PUT", body: { id_cargo: novo } },
    );
    botaoCarregando(btn, false);

    if (!r.ok) {
      mostrarAvisoModal("cargo-aviso", r.error);
      return;
    }

    modal("modalCargo").hide();
    mostrarAviso(
      `Cargo de <strong>${esc(f.nome)}</strong> alterado.`,
      "success",
    );
    if (idDoFuncionario(f) === euMesmo) {
      // as permissões guardadas no navegador ficaram velhas: entra de novo
      Docisis.toast(
        "Seu cargo mudou. Entre novamente para aplicar as permissões.",
        "info",
      );
      setTimeout(() => Docisis.sair(), 1800);
      return;
    }
    await carregarFuncionarios();
    renderizarKpis();
    renderizarLista();
  });

  /* ------------------------------------------------------------------
       Exclusão
       ------------------------------------------------------------------ */
  function abrirExclusao(f) {
    mostrarAvisoModal("excluir-aviso", "");
    $("excluir-nome-funcionario").textContent = f.nome;
    modal("modalExcluir").show();
  }

  $("btn-confirmar-exclusao").addEventListener("click", async () => {
    const f = estado.alvo;
    const btn = $("btn-confirmar-exclusao");
    botaoCarregando(btn, true, "Excluindo...");
    const r = await Docisis.api(
      `/funcionarios/${encodeURIComponent(idDoFuncionario(f))}`,
      { method: "DELETE" },
    );
    botaoCarregando(btn, false);

    if (!r.ok) {
      mostrarAvisoModal("excluir-aviso", r.error);
      return;
    }

    modal("modalExcluir").hide();
    mostrarAviso(`<strong>${esc(f.nome)}</strong> foi excluído(a).`, "success");
    await carregarFuncionarios();
    renderizarKpis();
    renderizarLista();
  });

  /* ------------------------------------------------------------------
       Início
       ------------------------------------------------------------------ */
  carregarTudo();
});
