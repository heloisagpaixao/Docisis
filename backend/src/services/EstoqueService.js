const EstoqueRepository = require("../repositories/EstoqueRepository");

class EstoqueService {
  async listarEstoque(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(queryParams.limit, 10) || 10),
    );

    const resultado = await EstoqueRepository.findAll({
      ...queryParams,
      page,
      limit,
    });

    if (Array.isArray(resultado)) {
      return {
        sucesso: true,
        dados: resultado,
        total: resultado.length,
      };
    }

    return {
      sucesso: true,
      ...resultado,
    };
  }

  async buscarEstoquePorId(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const item = await EstoqueRepository.findById(idNum);
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
