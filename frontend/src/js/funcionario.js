/**
 * DOCISIS - PERFIL DO FUNCIONÁRIO (funcionario.js)
 *
 * O que o back-end permite hoje:
 *   - Foto: qualquer funcionário troca/remove a PRÓPRIA foto
 *       PUT    /funcionarios/:id/foto   (multipart, campo "foto")
 *       DELETE /funcionarios/:id/foto
 *   - Dados e senha: as rotas exigem FUNCIONARIO_GERENCIAR (administrador)
 *       GET /funcionarios/:id    PUT /funcionarios/:id { nome?, email?, telefone?, senha? }
 *     Quem não tem essa permissão vê os dados em modo leitura (vindos do login).
 *
 * A troca de senha confere a senha atual tentando um login (sem guardar a sessão
 * resultante, que é encerrada em seguida), porque o back-end ainda não tem uma
 * rota "alterar minha senha" que peça a senha atual.
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { auth, util, layout } = Docisis;

  /* ------------------------------------------------------------------
       Proteção da página
       ------------------------------------------------------------------ */
  if (!auth.exigirLogin()) return;
  layout.montar("ajustes");

  const $ = (id) => document.getElementById(id);
  const usuario = auth.getUsuario() || {};
  const meuId = usuario.id;
  const podeGerenciar = auth.temPermissao("FUNCIONARIO_GERENCIAR");

  const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];
  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const somenteDigitos = (s) => String(s || "").replace(/\D/g, "");

  /* ------------------------------------------------------------------
       Elementos
       ------------------------------------------------------------------ */
  const campos = {
    nome: $("perfil-nome"),
    email: $("perfil-email"),
    telefone: $("perfil-telefone"),
  };
  const aviso = $("aviso-perfil");
  let timerAviso = null;

  function feedback(mensagem, tipo = "success") {
    aviso.className = `alert alert-${tipo} mb-4`;
    aviso.textContent = mensagem;
    aviso.scrollIntoView({ behavior: "smooth", block: "nearest" });
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => aviso.classList.add("d-none"), 6000);
    Docisis.toast(mensagem, tipo === "success" ? "sucesso" : "erro");
  }

  function marcarCampo(input, mensagem) {
    input.classList.toggle("is-invalid", Boolean(mensagem));
    input.setAttribute("aria-invalid", String(Boolean(mensagem)));
    const fb = input.parentElement.querySelector(".invalid-feedback");
    if (fb && mensagem) fb.textContent = mensagem;
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

  Object.values(campos).forEach((i) =>
    i.addEventListener("input", () => marcarCampo(i, "")),
  );
  campos.telefone.addEventListener("input", (e) => {
    e.target.value = util.formatarTelefone(e.target.value);
  });

  /** Atualiza o usuário guardado no navegador e refaz a barra superior. */
  function atualizarSessao(parcial) {
    auth.salvarSessao({
      funcionario: { ...(auth.getUsuario() || {}), ...parcial },
    });
    layout.atualizarTopbar();
  }

  /* ------------------------------------------------------------------
       Dados pessoais
       ------------------------------------------------------------------ */
  function preencher(f) {
    campos.nome.value = f.nome || "";
    campos.email.value = f.email || "";
    campos.telefone.value = f.telefone || "";
    $("perfil-cargo").value = f.cargo || "";
  }

  async function carregarDados() {
    preencher(usuario); // já mostra o que veio do login

    if (!podeGerenciar) {
      // sem permissão: a API não entrega o telefone nem aceita alterações
      Object.values(campos).forEach((i) => {
        i.readOnly = true;
      });
      $("grupo-telefone").classList.add("d-none");
      $("rodape-perfil").classList.add("d-none");
      $("aviso-somente-leitura").classList.remove("d-none");
      $("form-seguranca-senha").classList.add("d-none");
      $("aviso-senha-restrita").classList.remove("d-none");
      return;
    }

    const r = await Docisis.api(`/funcionarios/${encodeURIComponent(meuId)}`);
    if (r.ok && r.data) {
      // o cargo continua vindo do login (a API pode devolver só o id_cargo)
      preencher({ ...r.data, cargo: usuario.cargo || r.data.cargo });
    }
  }

  $("form-perfil-funcionario").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!podeGerenciar) return;
    Object.values(campos).forEach((i) => marcarCampo(i, ""));

    const corpo = {};
    const invalidos = [];
    const falha = (input, msg) => {
      marcarCampo(input, msg);
      invalidos.push(input);
    };

    const nome = campos.nome.value.trim();
    if (nome.length < 2 || nome.length > 100)
      falha(campos.nome, "O nome deve ter entre 2 e 100 caracteres.");
    else if (nome !== (usuario.nome || "")) corpo.nome = nome;

    const email = campos.email.value.trim();
    if (!REGEX_EMAIL.test(email))
      falha(campos.email, "Informe um e-mail válido.");
    else if (email.toLowerCase() !== (usuario.email || "").toLowerCase())
      corpo.email = email;

    const telefone = campos.telefone.value.trim();
    if (![10, 11].includes(somenteDigitos(telefone).length))
      falha(campos.telefone, "Informe o telefone com DDD.");
    else if (telefone) corpo.telefone = telefone; // a API não devolve o telefone antigo no login: sempre envia

    if (invalidos.length) {
      invalidos[0].focus();
      return;
    }
    if (Object.keys(corpo).length === 0) {
      feedback("Nenhuma alteração para salvar.", "info");
      return;
    }

    const btn = $("btn-salvar-perfil");
    botaoCarregando(btn, true, "Salvando...");
    const r = await Docisis.api(`/funcionarios/${encodeURIComponent(meuId)}`, {
      method: "PUT",
      body: corpo,
    });
    botaoCarregando(btn, false);

    if (!r.ok) {
      if (r.status === 409) {
        marcarCampo(campos.email, r.error);
        campos.email.focus();
      } else feedback(r.error, "danger");
      return;
    }

    atualizarSessao({ nome, email });
    usuario.nome = nome;
    usuario.email = email;
    feedback("Dados do perfil salvos com sucesso!");
  });

  /* ------------------------------------------------------------------
       Foto de perfil
       ------------------------------------------------------------------ */
  const caixaFoto = $("avatar-preview-box");
  const imgFoto = $("avatar-img-preview");
  const iconeFoto = caixaFoto.querySelector(".default-avatar-icon");
  const fotoInput = $("foto-input");
  const btnRemoverFoto = $("btn-remover-foto");
  const erroFoto = $("erro-foto");
  let urlFotoAtual = null; // URL local (blob:) da foto exibida

  function mostrarFoto(url) {
    const tem = Boolean(url);
    if (tem) imgFoto.src = url;
    else imgFoto.removeAttribute("src");
    imgFoto.classList.toggle("d-none", !tem);
    iconeFoto.classList.toggle("d-none", tem);
    btnRemoverFoto.classList.toggle("d-none", !tem);
  }

  async function carregarFoto() {
    if (!usuario.temFoto) {
      mostrarFoto(null);
      return;
    }
    const url = await layout.fotoUrl(meuId);
    urlFotoAtual = url;
    mostrarFoto(url);
  }

  function escolherFoto() {
    fotoInput.click();
  }
  caixaFoto.addEventListener("click", escolherFoto);
  caixaFoto.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      escolherFoto();
    }
  });
  $("btn-alterar-foto").addEventListener("click", escolherFoto);

  fotoInput.addEventListener("change", async () => {
    const arquivo = fotoInput.files && fotoInput.files[0];
    fotoInput.value = "";
    erroFoto.textContent = "";
    if (!arquivo) return;

    if (!TIPOS_FOTO.includes(arquivo.type)) {
      erroFoto.textContent = "Use uma imagem JPG, PNG ou WEBP.";
      return;
    }

    const previa = URL.createObjectURL(arquivo);
    mostrarFoto(previa);
    caixaFoto.classList.add("carregando");

    const fd = new FormData();
    fd.append("foto", arquivo); // o back espera o campo "foto"
    const r = await Docisis.api(
      `/funcionarios/${encodeURIComponent(meuId)}/foto`,
      { method: "PUT", body: fd },
    );
    caixaFoto.classList.remove("carregando");

    if (!r.ok) {
      URL.revokeObjectURL(previa);
      mostrarFoto(urlFotoAtual); // volta para a foto anterior
      erroFoto.textContent = r.error; // inclui limite de tamanho e tipo inválido
      return;
    }

    if (urlFotoAtual) URL.revokeObjectURL(urlFotoAtual);
    urlFotoAtual = previa;
    usuario.temFoto = true;
    atualizarSessao({ temFoto: true });
    feedback("Foto de perfil atualizada com sucesso!");
  });

  btnRemoverFoto.addEventListener("click", async () => {
    if (!confirm("Remover sua foto de perfil?")) return;
    erroFoto.textContent = "";
    const r = await Docisis.api(
      `/funcionarios/${encodeURIComponent(meuId)}/foto`,
      { method: "DELETE" },
    );
    if (!r.ok) {
      erroFoto.textContent = r.error;
      return;
    }

    if (urlFotoAtual) URL.revokeObjectURL(urlFotoAtual);
    urlFotoAtual = null;
    usuario.temFoto = false;
    mostrarFoto(null);
    atualizarSessao({ temFoto: false });
    feedback("Foto removida.");
  });

  /* ------------------------------------------------------------------
       Senha
       ------------------------------------------------------------------ */
  const senhaAtual = $("senha-atual");
  const senhaNova = $("senha-nova");
  const senhaConfirma = $("senha-confirma");
  [senhaAtual, senhaNova, senhaConfirma].forEach((i) =>
    i.addEventListener("input", () => marcarCampo(i, "")),
  );

  const senhaValida = (s) =>
    s.length >= 8 && new TextEncoder().encode(s).length <= 72;

  /** Confere a senha atual. Faz um login e encerra na hora a sessão criada por ele. */
  async function senhaAtualCorreta(email, senha) {
    const r = await Docisis.api("/auth/login", {
      method: "POST",
      body: { email, senha },
      auth: false,
    });
    if (r.ok && r.data && r.data.refreshToken) {
      await Docisis.api("/auth/logout", {
        method: "POST",
        body: { refreshToken: r.data.refreshToken },
        auth: false,
      });
    }
    return r;
  }

  $("form-seguranca-senha").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!podeGerenciar) return;
    [senhaAtual, senhaNova, senhaConfirma].forEach((i) => marcarCampo(i, ""));

    const invalidos = [];
    const falha = (input, msg) => {
      marcarCampo(input, msg);
      invalidos.push(input);
    };

    if (!senhaAtual.value) falha(senhaAtual, "Informe sua senha atual.");
    if (!senhaValida(senhaNova.value))
      falha(senhaNova, "A senha deve ter de 8 a 72 caracteres.");
    else if (senhaNova.value === senhaAtual.value)
      falha(senhaNova, "A nova senha deve ser diferente da atual.");
    if (senhaNova.value !== senhaConfirma.value)
      falha(senhaConfirma, "As senhas não coincidem.");
    if (invalidos.length) {
      invalidos[0].focus();
      return;
    }

    const btn = $("btn-atualizar-senha");
    botaoCarregando(btn, true, "Atualizando...");

    const conferencia = await senhaAtualCorreta(
      (auth.getUsuario() || {}).email,
      senhaAtual.value,
    );
    if (!conferencia.ok) {
      botaoCarregando(btn, false);
      if (conferencia.status === 401) {
        falha(senhaAtual, "Senha atual incorreta.");
        senhaAtual.focus();
      } else feedback(conferencia.error, "danger");
      return;
    }

    const r = await Docisis.api(`/funcionarios/${encodeURIComponent(meuId)}`, {
      method: "PUT",
      body: { senha: senhaNova.value },
    });
    botaoCarregando(btn, false);

    if (!r.ok) {
      feedback(r.error, "danger");
      return;
    }

    $("form-seguranca-senha").reset();
    feedback("Senha atualizada com sucesso!");
  });

  /* ------------------------------------------------------------------
       Início
       ------------------------------------------------------------------ */
  carregarDados();
  carregarFoto();
});
