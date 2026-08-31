const ajusteRepository = require("../repositories/AjusteRepository");

class AjusteService {
  async criarAjuste({ id_lote, id_funcionario, quantidade_nova, motivo }) {
    if (!id_lote || !id_funcionario) {
      throw {
        status: 400,
        message: "O ID do lote e do funcionário são obrigatórios.",
      };
    }

    if (typeof quantidade_nova !== "number" || quantidade_nova < 0) {
      throw {
        status: 400,
        message:
          "A nova quantidade deve ser um número inteiro maior ou igual a zero.",
      };
    }

    if (!motivo || motivo.trim() === "") {
      throw { status: 400, message: "O motivo do ajuste é obrigatório." };
    }

    return await ajusteRepository.create({
      id_lote,
      id_funcionario,
      quantidade_nova,
      motivo: motivo.trim(),
    });
  }

  async buscarPorId(id) {
    if (!id || isNaN(Number(id))) {
      throw { status: 400, message: "ID do ajuste inválido." };
    }

    const ajuste = await ajusteRepository.findById(id);
    if (!ajuste) {
      throw { status: 404, message: "Ajuste de estoque não encontrado." };
    }

    return ajuste;
  }

  async listarAjustes(filtros) {
    return await ajusteRepository.findAll(filtros);
  }
}

module.exports = new AjusteService();
