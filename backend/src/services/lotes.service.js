const loteRepository = require("../repositories/lotes.repository");
const produtoRepository = require("../repositories/produtos.repository");
const notaRepository = require("../repositories/notasfiscais.repository");
const funcionarioRepository = require("../repositories/funcionarios.repository");
const notificacoes = require("./notificacoes.service");

const erro = (status, mensagem) => ({ status, mensagem });

async function garantirProduto(id) {
  if (!(await produtoRepository.findById(id)))
    throw erro(400, "Produto informado não existe");
}
async function garantirNota(id) {
  if (!(await notaRepository.findById(id)))
    throw erro(400, "Nota fiscal informada não existe");
}

const listar = (filtros) => loteRepository.findAll(filtros);
const vencendo = (dias) => loteRepository.findVencendo(dias);

async function buscar(id) {
  const lote = await loteRepository.findById(id);
  if (!lote) throw erro(404, "Lote não encontrado");
  return lote;
}

async function movimentacoes(id) {
  await buscar(id);
  return loteRepository.findMovimentacoes(id);
}

/**
 * O lote já nasce com a quantidade informada E com a entrada inicial registrada
 * (no histórico, em nome de quem cadastrou). Quem não pode registrar entradas
 * só pode cadastrar o lote vazio.
 */
async function criar(
  { id_produto, id_nota, dt_validade, quantidade = 0 },
  idFuncionario,
) {
  await garantirProduto(id_produto);
  await garantirNota(id_nota);

  if (quantidade > 0) {
    const permissoes =
      await funcionarioRepository.findPermissoes(idFuncionario);
    if (!permissoes.includes("ENTRADA_REGISTRAR")) {
      throw erro(403, "Sem permissão para registrar a entrada inicial do lote");
    }
  }

  const id = await loteRepository.createComEntradaInicial({
    quantidade,
    id_produto,
    dt_validade,
    id_nota,
    id_funcionario: idFuncionario,
  });
  notificacoes.agendarVerificacao();
  return loteRepository.findById(id);
}

async function atualizar(id, dados) {
  const lote = await buscar(id);

  if (dados.id_produto !== undefined) {
    await garantirProduto(dados.id_produto);
    // trocar o produto de um lote que já tem histórico falsificaria as movimentações
    if (
      dados.id_produto !== lote.id_produto &&
      (await loteRepository.hasDependents(id))
    ) {
      throw erro(
        409,
        "Lote já possui movimentações; não é possível trocar o produto",
      );
    }
  }
  if (dados.id_nota !== undefined) await garantirNota(dados.id_nota);

  await loteRepository.update(id, dados);
  notificacoes.agendarVerificacao();
  return loteRepository.findById(id);
}

async function excluir(id) {
  await buscar(id);
  if (await loteRepository.hasDependents(id)) {
    throw erro(
      409,
      "Lote possui movimentações registradas e não pode ser excluído",
    );
  }
  await loteRepository.delete(id);
  notificacoes.agendarVerificacao();
}

module.exports = {
  listar,
  vencendo,
  buscar,
  movimentacoes,
  criar,
  atualizar,
  excluir,
};
