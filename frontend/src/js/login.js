/**
 * DOCISIS - LOGIN (login.js)
 * Entrar no sistema e tela "Esqueci minha senha".
 * Depende de: config.js, auth.js, api.js
 */
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { auth, config } = Docisis;

  // Quem já está logado não precisa ver o login
  if (auth.estaLogado()) {
    window.location.replace(config.PAGINA_INICIAL);
    return;
  }

  /* ------------------------------------------------------------------
       Elementos
       ------------------------------------------------------------------ */
  const passos = {
    login: document.getElementById("step-login"),
    recuperar: document.getElementById("step-esqueci-senha"),
  };
  const aviso = document.getElementById("aviso-login");

  const formLogin = document.getElementById("form-login");
  const inputEmail = document.getElementById("login-email");
  const inputSenha = document.getElementById("login-senha");
  const btnEntrar = document.getElementById("btn-entrar");

  const formRecuperar = document.getElementById("form-esqueci-senha");
  const inputRecuperarEmail = document.getElementById("recuperar-email");

  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ------------------------------------------------------------------
       Helpers de interface
       ------------------------------------------------------------------ */
  function mostrarAviso(mensagem, tipo = "danger") {
    aviso.className = `alert alert-${tipo} mb-3 auth-step`;
    aviso.textContent = mensagem;
  }

  function esconderAviso() {
    aviso.className = "alert d-none mb-3";
    aviso.textContent = "";
  }

  function mostrarPasso(nome) {
    Object.entries(passos).forEach(([chave, secao]) => {
      secao.classList.toggle("d-none", chave !== nome);
    });
    esconderAviso();
    const primeiroCampo = passos[nome].querySelector("input");
    if (primeiroCampo) primeiroCampo.focus();
  }

  /** Marca/desmarca o campo como inválido (borda + mensagem do Bootstrap). */
  function marcarCampo(input, invalido) {
    input.classList.toggle("is-invalid", invalido);
    input
      .closest(".input-group-docisis")
      ?.classList.toggle("is-invalid", invalido);
    input.setAttribute("aria-invalid", String(invalido));
  }

  function limparMarcacao(...inputs) {
    inputs.forEach((i) => marcarCampo(i, false));
  }

  function botaoCarregando(botao, carregando, textoCarregando) {
    if (carregando) {
      botao.dataset.original = botao.innerHTML;
      botao.disabled = true;
      botao.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>' +
        textoCarregando;
    } else {
      botao.disabled = false;
      if (botao.dataset.original) botao.innerHTML = botao.dataset.original;
    }
  }

  // Digitar de novo tira o vermelho do campo
  [inputEmail, inputSenha, inputRecuperarEmail].forEach((input) => {
    input.addEventListener("input", () => marcarCampo(input, false));
  });

  /* ------------------------------------------------------------------
       Navegação entre os passos
       ------------------------------------------------------------------ */
  document
    .getElementById("link-esqueci-senha")
    .addEventListener("click", (e) => {
      e.preventDefault();
      inputRecuperarEmail.value = inputEmail.value.trim(); // aproveita o que já foi digitado
      mostrarPasso("recuperar");
    });

  document.querySelectorAll(".btn-voltar-login").forEach((btn) => {
    btn.addEventListener("click", () => mostrarPasso("login"));
  });

  /* ------------------------------------------------------------------
       Login
       ------------------------------------------------------------------ */
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAviso();

    const email = inputEmail.value.trim();
    const senha = inputSenha.value; // sem trim: espaço pode fazer parte da senha

    const emailInvalido = !REGEX_EMAIL.test(email);
    const senhaInvalida = !senha;
    marcarCampo(inputEmail, emailInvalido);
    marcarCampo(inputSenha, senhaInvalida);
    if (emailInvalido || senhaInvalida) {
      (emailInvalido ? inputEmail : inputSenha).focus();
      return;
    }

    botaoCarregando(btnEntrar, true, "Autenticando...");
    const r = await Docisis.login({ email, senha });
    botaoCarregando(btnEntrar, false);

    if (r.ok) {
      window.location.replace(config.PAGINA_INICIAL);
      return;
    }

    if (r.status === 0) {
      mostrarAviso(r.error); // servidor fora do ar
    } else if (r.status === 401) {
      mostrarAviso("E-mail ou senha incorretos.");
      inputSenha.value = "";
      inputSenha.focus();
    } else {
      mostrarAviso(r.error || "Não foi possível entrar. Tente novamente.");
    }
  });

  /* ------------------------------------------------------------------
       Esqueci minha senha
       ------------------------------------------------------------------
       ATENÇÃO: por falta de tempo no TCC, esta tela é só visual. O back-end
       ainda não tem rota de recuperação nem envio de e-mail. Quando existir,
       troque o bloco marcado abaixo por uma chamada Docisis.api(...).
       ------------------------------------------------------------------ */
  formRecuperar.addEventListener("submit", (e) => {
    e.preventDefault();
    esconderAviso();

    const email = inputRecuperarEmail.value.trim();
    const invalido = !REGEX_EMAIL.test(email);
    marcarCampo(inputRecuperarEmail, invalido);
    if (invalido) {
      inputRecuperarEmail.focus();
      return;
    }

    // TODO: chamar a API de recuperação de senha aqui
    mostrarAviso(
      "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação. " +
        "Em caso de dúvida, procure o administrador do sistema.",
      "info",
    );
    limparMarcacao(inputRecuperarEmail);
  });
});
