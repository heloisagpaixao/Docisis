/**
 * DOCISIS - SESSÃO E PERMISSÕES (auth.js)
 * Guarda tokens, dados do funcionário e permissões, e protege páginas.
 * Depende de: config.js
 *
 * As permissões vêm da resposta do login (campo `permissoes`, lista de nomes
 * como "FUNCIONARIO_GERENCIAR"). O front usa isso para esconder menus e bloquear
 * páginas, mas quem realmente impede o acesso é o back-end (erro 403).
 */
(function (global) {
  "use strict";

  const Docisis = (global.Docisis = global.Docisis || {});
  const { STORAGE_PREFIX: P, PAGINA_LOGIN, PAGINA_INICIAL } = Docisis.config;

  const CHAVES = {
    access: P + "accessToken",
    refresh: P + "refreshToken",
    usuario: P + "usuario",
    permissoes: P + "permissoes",
  };

  // localStorage pode lançar erro (modo privado, dados bloqueados): nunca quebra a página
  function ler(chave) {
    try {
      return localStorage.getItem(chave);
    } catch {
      return null;
    }
  }
  function gravar(chave, valor) {
    try {
      localStorage.setItem(chave, valor);
    } catch {
      /* ignora */
    }
  }
  function remover(chave) {
    try {
      localStorage.removeItem(chave);
    } catch {
      /* ignora */
    }
  }
  function lerJson(chave, padrao) {
    try {
      const bruto = ler(chave);
      return bruto ? JSON.parse(bruto) : padrao;
    } catch {
      return padrao;
    }
  }

  /**
   * Salva o que o back devolve no login e na renovação do token:
   * { accessToken, refreshToken, funcionario: {...}, permissoes: [...] }
   */
  function salvarSessao(dados) {
    const access = dados.accessToken || dados.token;
    if (access) gravar(CHAVES.access, access);
    if (dados.refreshToken) gravar(CHAVES.refresh, dados.refreshToken);
    if (dados.funcionario)
      gravar(CHAVES.usuario, JSON.stringify(dados.funcionario));
    if (Array.isArray(dados.permissoes))
      gravar(CHAVES.permissoes, JSON.stringify(dados.permissoes));
  }

  function limparSessao() {
    Object.values(CHAVES).forEach(remover);
  }

  const getAccessToken = () => ler(CHAVES.access);
  const getRefreshToken = () => ler(CHAVES.refresh);
  const getUsuario = () => lerJson(CHAVES.usuario, null);
  const getPermissoes = () => lerJson(CHAVES.permissoes, []);
  const estaLogado = () => Boolean(getAccessToken() && getRefreshToken());

  /** true se o usuário tem a permissão informada (ex.: "PRODUTO_GERENCIAR"). */
  function temPermissao(nome) {
    return getPermissoes().includes(nome);
  }

  /** true se tem pelo menos uma das permissões da lista. */
  function temAlguma(nomes) {
    const minhas = getPermissoes();
    return nomes.some((n) => minhas.includes(n));
  }

  function redirecionarLogin() {
    global.location.replace(PAGINA_LOGIN);
  }

  /** Chame no topo de toda página interna: sem login, volta para o login. */
  function exigirLogin() {
    if (!estaLogado()) {
      redirecionarLogin();
      return false;
    }
    return true;
  }

  /**
   * Para páginas restritas (ex.: gestão de usuários).
   * Sem a permissão, o usuário volta para a página inicial.
   */
  function exigirPermissao(nome, destino = PAGINA_INICIAL) {
    if (!exigirLogin()) return false;
    if (!temPermissao(nome)) {
      global.location.replace(destino);
      return false;
    }
    return true;
  }

  /**
   * Esconde elementos que o usuário não pode usar.
   * Uso no HTML: <a data-permissao="FUNCIONARIO_GERENCIAR">Usuários</a>
   * Aceita várias separadas por vírgula (basta ter UMA): data-permissao="A,B"
   */
  function aplicarPermissoes(raiz = document) {
    raiz.querySelectorAll("[data-permissao]").forEach((el) => {
      const exigidas = el.dataset.permissao
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      el.hidden = exigidas.length > 0 && !temAlguma(exigidas);
    });
  }

  Docisis.auth = {
    salvarSessao,
    limparSessao,
    getAccessToken,
    getRefreshToken,
    getUsuario,
    getPermissoes,
    estaLogado,
    temPermissao,
    temAlguma,
    exigirLogin,
    exigirPermissao,
    aplicarPermissoes,
    redirecionarLogin,
  };
})(window);
