/**
 * DOCISIS - CLIENTE DA API (api.js)
 * Todas as telas falam com o back-end por aqui.
 * Depende de: config.js, auth.js
 *
 * Uso:
 *   const r = await Docisis.api('/produtos');
 *   const r = await Docisis.api('/produtos', { method: 'POST', body: { nome: 'Brigadeiro' } });
 *   const r = await Docisis.api('/produtos/3', { method: 'PUT', body: formData });   // upload
 *   const r = await Docisis.api('/estoque', { query: { limite: 10 } });
 *   const r = await Docisis.api('/funcionarios/3/foto', { resposta: 'blob' });        // r.data = Blob
 *
 * Resposta sempre no mesmo formato (nunca lança erro):
 *   { ok: true|false, status: 200, data: <JSON ou null>, error: <mensagem ou null> }
 *   status 0 = não conseguiu falar com o servidor.
 *
 * O que ele faz sozinho:
 *   - envia "Authorization: Bearer <accessToken>";
 *   - se a API responder 401, renova o token (/auth/refresh-token) e repete a chamada;
 *   - se a renovação falhar, limpa a sessão e volta para o login;
 *   - lê a mensagem de erro do campo `erro` que o back devolve.
 */
(function (global) {
  "use strict";

  const Docisis = (global.Docisis = global.Docisis || {});
  const { API_URL } = Docisis.config;
  const auth = Docisis.auth;

  const MSG_OFFLINE =
    "Não foi possível conectar ao servidor. Verifique se o back-end está em execução.";

  /** Uma chamada HTTP, sem renovação de token. */
  async function requisitar(caminho, opcoes = {}) {
    const {
      method = "GET",
      body,
      query,
      headers = {},
      auth: usarAuth = true,
      resposta: tipoResposta,
    } = opcoes;

    let url = API_URL + caminho;
    if (query) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.append(k, v);
      });
      const texto = params.toString();
      if (texto) url += (url.includes("?") ? "&" : "?") + texto;
    }

    const cabecalhos = {
      Accept: tipoResposta === "blob" ? "*/*" : "application/json",
      ...headers,
    };
    if (usarAuth) {
      const token = auth.getAccessToken();
      if (token) cabecalhos.Authorization = "Bearer " + token;
    }

    const init = { method, headers: cabecalhos };
    if (body instanceof FormData) {
      // NÃO definir Content-Type: o navegador monta o multipart com o boundary correto
      init.body = body;
    } else if (body !== undefined) {
      cabecalhos["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    let resposta;
    try {
      resposta = await fetch(url, init);
    } catch {
      return { ok: false, status: 0, data: null, error: MSG_OFFLINE };
    }

    let data = null;
    if (resposta.ok && tipoResposta === "blob") {
      // arquivos (ex.: foto de perfil) que exigem o token no cabeçalho
      data = await resposta.blob();
    } else if (resposta.status !== 204) {
      try {
        data = await resposta.json();
      } catch {
        data = null;
      }
    }

    return {
      ok: resposta.ok,
      status: resposta.status,
      data,
      error: resposta.ok
        ? null
        : (data && data.erro) || `Erro ${resposta.status}`,
    };
  }

  // Se várias chamadas recebem 401 ao mesmo tempo, só UMA renovação acontece
  // (o back usa rotação de refresh token: reusar o mesmo token derrubaria a sessão).
  let renovacaoEmAndamento = null;

  function renovarSessao() {
    if (!renovacaoEmAndamento) {
      renovacaoEmAndamento = (async () => {
        const refreshToken = auth.getRefreshToken();
        if (!refreshToken) return { ok: false, status: 401 };

        const r = await requisitar("/auth/refresh-token", {
          method: "POST",
          body: { refreshToken },
          auth: false,
        });
        if (r.ok) auth.salvarSessao(r.data);
        return r;
      })().finally(() => {
        renovacaoEmAndamento = null;
      });
    }
    return renovacaoEmAndamento;
  }

  /** Chamada à API com renovação automática do token. */
  async function api(caminho, opcoes = {}) {
    let resultado = await requisitar(caminho, opcoes);

    if (resultado.status === 401 && opcoes.auth !== false) {
      const renovacao = await renovarSessao();
      if (renovacao.ok) {
        resultado = await requisitar(caminho, opcoes);
      } else if (renovacao.status !== 0) {
        // refresh recusado: a sessão acabou de verdade
        auth.limparSessao();
        auth.redirecionarLogin();
      }
      // status 0 = servidor fora do ar: mantém a sessão e devolve o 401 original
    }

    return resultado;
  }

  /** Login por e-mail OU CPF. Salva a sessão se der certo. */
  async function login({ email, cpf, senha }) {
    const corpo = cpf ? { cpf, senha } : { email, senha };
    const r = await requisitar("/auth/login", {
      method: "POST",
      body: corpo,
      auth: false,
    });
    if (r.ok && r.data) auth.salvarSessao(r.data);
    return r;
  }

  /**
   * Encerra a sessão e volta para o login.
   * { todos: true } = "sair de todos os dispositivos".
   */
  async function sair({ todos = false } = {}) {
    const refreshToken = auth.getRefreshToken();
    if (todos) {
      await api("/auth/logout-todos", { method: "POST" });
    } else if (refreshToken) {
      await requisitar("/auth/logout", {
        method: "POST",
        body: { refreshToken },
        auth: false,
      });
    }
    auth.limparSessao();
    auth.redirecionarLogin();
  }

  Docisis.api = api;
  Docisis.login = login;
  Docisis.sair = sair;
})(window);
