const SaidaRepository = require("../repositories/SaidaRepository");
const FuncionariosRepository = require("../repositories/FuncionarioRepository");
const LoteRepository = require("../repositories/LoteRepository");

class SaidaService {
  async listarSaidas(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(queryParams.limit, 10) || 10),
    );

    const resultado = await SaidaRepository.findAll({
      ...queryParams,
      page,
      limit,
    });

    return {
      sucesso: true,
      ...resultado,
    };
  }

  async buscarSaidaPorId(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID de saída inválido" };
    }

    const saida = await SaidaRepository.findById(idNum);
    if (!saida) {
      throw { status: 404, mensagem: "Saída não encontrada" };
    }

    return {
      sucesso: true,
      dados: saida,
    };
  }

  async cadastrarSaida(dados) {
    const { id_funcionario, id_lote, quantidade, motivo, dt_saida } = dados;

    if (!id_funcionario || !id_lote || quantidade === undefined || !motivo) {
      throw {
        status: 400,
        mensagem:
          "Os campos id_funcionario, id_lote, quantidade e motivo são obrigatórios",
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

    // Verifica se o funcionário existe
    const funcionarioExiste = await FuncionariosRepository.findById(idFuncNum);
    if (!funcionarioExiste) {
      throw {
        status: 404,
        mensagem: `Funcionário com ID ${idFuncNum} não encontrado`,
      };
    }

    // Verifica se o lote existe
    const loteExiste = await LoteRepository.findById(idLoteNum);
    if (!loteExiste) {
      throw {
        status: 404,
        mensagem: `Lote com ID ${idLoteNum} não encontrado`,
      };
    }

    const novaSaida = {
      dt_saida: dt_saida || new Date(),
      id_funcionario: idFuncNum,
      id_lote: idLoteNum,
      quantidade: qtdNum,
      motivo: motivo.trim(),
    };

    // A transação no repository já valida a quantidade disponível com FOR UPDATE e atomicidade
    const id = await SaidaRepository.create(novaSaida);

    return {
      sucesso: true,
      mensagem: "Saída registrada com sucesso",
      id,
    };
  }

  async atualizarSaida(id, dados) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID de saída inválido" };
    }

    const existe = await SaidaRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Saída não encontrada" };
    }

    const atualizado = {};

    if (dados.id_funcionario !== undefined) {
      const idFuncNum = Number(dados.id_funcionario);
      if (!Number.isInteger(idFuncNum) || idFuncNum <= 0) {
        throw { status: 400, mensagem: "ID do funcionário inválido" };
      }
      const funcionarioExiste = await FuncionariosRepository.findById(idFuncNum);
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

    if (dados.quantidade !== undefined) {
      const qtdNum = Number(dados.quantidade);
      if (!Number.isInteger(qtdNum) || qtdNum <= 0) {
        throw {
          status: 400,
          mensagem: "A quantidade deve ser um número inteiro positivo",
        };
      }
      atualizado.quantidade = qtdNum;
    }

    if (dados.motivo !== undefined) atualizado.motivo = dados.motivo.trim();
    if (dados.dt_saida !== undefined) atualizado.dt_saida = dados.dt_saida;

    if (Object.keys(atualizado).length === 0) {
      throw {
        status: 400,
        mensagem: "Nenhum dado válido enviado para atualização",
      };
    }

    // SaidaRepository.update ajusta o lote transacionalmente com delta
    await SaidaRepository.update(idNum, atualizado);

    return {
      sucesso: true,
      mensagem: "Saída atualizada com sucesso",
    };
  }

  async deletarSaida(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID de saída inválido" };
    }

    const existe = await SaidaRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Saída não encontrada" };
    }

    // SaidaRepository.delete devolve a quantidade ao lote transacionalmente
    await SaidaRepository.delete(idNum);

    return {
      sucesso: true,
      mensagem: "Saída apagada com sucesso e estoque estornado ao lote",
    };
  }
}

module.exports = new SaidaService();
