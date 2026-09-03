const EstoqueRepository = require("../repositories/EstoqueRepository");
const LoteRepository = require("../repositories/LoteRepository");

class EstoqueService {
  async listarEstoque() {
    const estoque = await EstoqueRepository.findAll();
    return {
      sucesso: true,
      dados: estoque,
      total: estoque.length,
    };
  }

  async buscarEstoquePorId(id) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const item = await EstoqueRepository.findById(id);
    if (!item) {
      throw { status: 404, mensagem: "Registro de estoque não encontrado" };
    }

    return {
      sucesso: true,
      dados: item,
    };
  }

  async buscarEstoqueBaixo(limite) {
    const limiteNum = parseInt(limite, 10) || 10;
    const itens = await EstoqueRepository.findBaixo(limiteNum);
    return {
      sucesso: true,
      dados: itens,
      total: itens.length,
    };
  }
}

module.exports = new EstoqueService();
