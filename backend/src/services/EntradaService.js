const EntradaRepository = require("../repositories/EntradaRepository");
const FuncionarioRepository = require("../repositories/FuncionarioRepository");
const LoteRepository = require("../repositories/LoteRepository");

class EntradaService {
  async listarEntradas(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(queryParams.limit, 10) || 10),
    );

    const resultado = await EntradaRepository.findAll({
      ...queryParams,
      page,
      limit,
    });

    return {
      sucesso: true,
      ...resultado,
    };
  }

  async buscarEntradaPorId(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const entrada = await EntradaRepository.findById(idNum);
    if (!entrada) {
      throw { status: 404, mensagem: "Entrada não encontrada" };
    }

    return {
      sucesso: true,
      dados: entrada,
    };
  }

  async cadastrarEntrada(dados) {
    const { id_funcionario, id_lote, quantidade, motivo, dt_entrada } = dados;

    if (!id_funcionario || !id_lote || !quantidade || !motivo) {
      throw {
        status: 400,
        mensagem: "Os campos id_funcionario, id_lote, quantidade e motivo são obrigatórios",
      };
    }

    const qtdNum = Number(quantidade);
    if (!Number.isInteger(qtdNum) || qtdNum <= 0) {
      throw {
        status: 400,
        mensagem: "A quantidade deve ser um número inteiro positivo",
      };
    }

    const idFuncNum = Number(id_funcionario);
    if (!Number.isInteger(idFuncNum) || idFuncNum <= 0) {
      throw { status: 400, mensagem: "ID do funcionário inválido" };
    }

    const idLoteNum = Number(id_lote);
    if (!Number.isInteger(idLoteNum) || idLoteNum <= 0) {
      throw { status: 400, mensagem: "ID do lote inválido" };
    }

    const funcionarioExiste = await FuncionarioRepository.findById(idFuncNum);
    if (!funcionarioExiste) {
      throw {
        status: 404,
        mensagem: `Funcionário com ID ${idFuncNum} não encontrado`,
      };
    }

    const loteExiste = await LoteRepository.findById(idLoteNum);
    if (!loteExiste) {
      throw { status: 404, mensagem: `Lote com ID ${idLoteNum} não encontrado` };
    }

    const novaEntrada = {
      dt_entrada: dt_entrada || new Date(),
      id_funcionario: idFuncNum,
      id_lote: idLoteNum,
      quantidade: qtdNum,
      motivo: motivo.trim(),
    };

    const id = await EntradaRepository.create(novaEntrada);

    return {
      sucesso: true,
      mensagem: "Entrada registrada com sucesso",
      id,
    };
  }

  async atualizarEntrada(id, dados) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await EntradaRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Entrada não encontrada" };
    }

    const atualizado = {};

    if (dados.id_funcionario !== undefined) {
      const idFuncNum = Number(dados.id_funcionario);
      if (!Number.isInteger(idFuncNum) || idFuncNum <= 0) {
        throw { status: 400, mensagem: "ID do funcionário inválido" };
      }
      const funcionarioExiste = await FuncionarioRepository.findById(idFuncNum);
      if (!funcionarioExiste) {
        throw {
          status: 404,
          mensagem: `Funcionário com ID ${idFuncNum} não encontrado`,
        };
      }
      atualizado.id_funcionario = idFuncNum;
    }

    if (dados.id_lote !== undefined) {
      const idLoteNum = Number(dados.id_lote);
      if (!Number.isInteger(idLoteNum) || idLoteNum <= 0) {
        throw { status: 400, mensagem: "ID do lote inválido" };
      }
      const loteExiste = await LoteRepository.findById(idLoteNum);
      if (!loteExiste) {
        throw {
          status: 404,
          mensagem: `Lote com ID ${idLoteNum} não encontrado`,
        };
      }
      atualizado.id_lote = idLoteNum;
    }

    if (dados.motivo !== undefined) atualizado.motivo = dados.motivo.trim();
    if (dados.dt_entrada !== undefined)
      atualizado.dt_entrada = dados.dt_entrada;

    if (Object.keys(atualizado).length === 0) {
      throw {
        status: 400,
        mensagem: "Nenhum dado válido enviado para atualização",
      };
    }

    await EntradaRepository.update(idNum, atualizado);

    return {
      sucesso: true,
      mensagem: "Entrada atualizada com sucesso",
    };
  }

  async deletarEntrada(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await EntradaRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Entrada não encontrada" };
    }

    await EntradaRepository.delete(idNum);

    return {
      sucesso: true,
      mensagem: "Entrada apagada com sucesso",
    };
  }
}

module.exports = new EntradaService();
