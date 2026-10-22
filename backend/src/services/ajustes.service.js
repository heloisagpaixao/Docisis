const ajusteRepository = require("../repositories/AjusteRepository");
const funcionarioRepository = require("../repositories/FuncionarioRepository");
const loteRepository = require("../repositories/LoteRepository");

class AjusteService {
  async criarAjuste({ id_lote, id_funcionario, quantidade_nova, motivo }) {
    if (!id_lote || !id_funcionario) {
      throw {
        status: 400,
        mensagem: "O ID do lote e do funcionário são obrigatórios.",
        message: "O ID do lote e do funcionário são obrigatórios.",
      };
    }

    const idLoteNum = Number(id_lote);
    if (!Number.isInteger(idLoteNum) || idLoteNum <= 0) {
      throw {
        status: 400,
        mensagem: "ID do lote inválido.",
        message: "ID do lote inválido.",
      };
    }

    const idFuncNum = Number(id_funcionario);
    if (!Number.isInteger(idFuncNum) || idFuncNum <= 0) {
      throw {
        status: 400,
        mensagem: "ID do funcionário inválido.",
        message: "ID do funcionário inválido.",
      };
    }

    const qtdNovaNum = Number(quantidade_nova);
    if (!Number.isInteger(qtdNovaNum) || qtdNovaNum < 0) {
      throw {
        status: 400,
        mensagem:
          "A nova quantidade deve ser um número inteiro maior ou igual a zero.",
        message:
          "A nova quantidade deve ser um número inteiro maior ou igual a zero.",
      };
    }

    if (!motivo || motivo.trim() === "") {
      throw {
        status: 400,
        mensagem: "O motivo do ajuste é obrigatório.",
        message: "O motivo do ajuste é obrigatório.",
      };
    }

    // Valida funcionário e lote
    const funcExiste = await funcionarioRepository.findById(idFuncNum);
    if (!funcExiste) {
      throw {
        status: 404,
        mensagem: `Funcionário com ID ${idFuncNum} não encontrado.`,
        message: `Funcionário com ID ${idFuncNum} não encontrado.`,
      };
    }

    const loteExiste = await loteRepository.findById(idLoteNum);
    if (!loteExiste) {
      throw {
        status: 404,
        mensagem: `Lote com ID ${idLoteNum} não encontrado.`,
        message: `Lote com ID ${idLoteNum} não encontrado.`,
      };
    }

    return await ajusteRepository.create({
      id_lote: idLoteNum,
      id_funcionario: idFuncNum,
      quantidade_nova: qtdNovaNum,
      motivo: motivo.trim(),
    });
  }

  async buscarPorId(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw {
        status: 400,
        mensagem: "ID do ajuste inválido.",
        message: "ID do ajuste inválido.",
      };
    }

    const ajuste = await ajusteRepository.findById(idNum);
    if (!ajuste) {
      throw {
        status: 404,
        mensagem: "Ajuste de estoque não encontrado.",
        message: "Ajuste de estoque não encontrado.",
      };
    }

    return ajuste;
  }

  async listarAjustes(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(queryParams.limit, 10) || 10),
    );

    const resultado = await ajusteRepository.findAll({
      ...queryParams,
      page,
      limit,
    });

    return {
      sucesso: true,
      ...resultado,
    };
  }
}

module.exports = new AjusteService();
