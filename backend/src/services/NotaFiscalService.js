const NotaFiscalRepository = require("../repositories/NotaFiscalRepository");

class NotaFiscalService {
  async listarNotas() {
    return await NotaFiscalRepository.findAll();
  }

  async buscarNotaPorId(id) {
    const nota = await NotaFiscalRepository.findById(id);
    if (!nota) {
      throw { status: 404, mensagem: "Nota fiscal não encontrada." };
    }
    return nota;
  }

  async cadastrarNota(dados) {
    // Extrai apenas os campos necessários, desconsiderando id_lote
    const { fornecedor, quantidade, dt_compra } = dados;

    if (!fornecedor || !quantidade) {
      throw {
        status: 400,
        mensagem: "Os campos 'fornecedor' e 'quantidade' são obrigatórios.",
      };
    }

    const id_nota = await NotaFiscalRepository.create({
      fornecedor,
      quantidade,
      dt_compra,
    });

    return { id_nota, fornecedor, quantidade, dt_compra };
  }

  async atualizarNota(id, dados) {
    const notaExiste = await NotaFiscalRepository.findById(id);
    if (!notaExiste) {
      throw { status: 404, mensagem: "Nota fiscal não encontrada." };
    }

    // Garante que id_lote não seja enviado no UPDATE
    delete dados.id_lote;

    await NotaFiscalRepository.update(id, dados);
    return { mensagem: "Nota fiscal atualizada com sucesso." };
  }

  async deletarNota(id) {
    const linhasAfetadas = await NotaFiscalRepository.delete(id);
    if (!linhasAfetadas) {
      throw { status: 404, mensagem: "Nota fiscal não encontrada." };
    }
    return { mensagem: "Nota fiscal deletada com sucesso." };
  }
}

module.exports = new NotaFiscalService();
