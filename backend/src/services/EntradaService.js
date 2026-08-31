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
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const entrada = await EntradaRepository.findById(id);
    if (!entrada) {
      throw { status: 404, mensagem: "Entrada não encontrada" };
    }

    return {
      sucesso: true,
      dados: entrada,
    };
  }

  async cadastrarEntrada(dados) {
    const { id_funcionario, id_lote, motivo, dt_entrada } = dados;

    if (!id_funcionario || !id_lote || !motivo) {
      throw {
        status: 400,
        mensagem: "Os campos id_funcionario, id_lote e motivo são obrigatórios",
      };
    }

    const funcionarioExiste =
      await FuncionarioRepository.findById(id_funcionario);
    if (!funcionarioExiste) {
      throw {
        status: 404,
        mensagem: `Funcionário com ID ${id_funcionario} não encontrado`,
      };
    }

    const loteExiste = await LoteRepository.findById(id_lote);
    if (!loteExiste) {
      throw { status: 404, mensagem: `Lote com ID ${id_lote} não encontrado` };
    }

    const novaEntrada = {
      dt_entrada: dt_entrada || new Date(),
      id_funcionario: Number(id_funcionario),
      id_lote: Number(id_lote),
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
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await EntradaRepository.findById(id);
    if (!existe) {
      throw { status: 404, mensagem: "Entrada não encontrada" };
    }

    const atualizado = {};

    if (dados.id_funcionario !== undefined) {
      const funcionarioExiste = await FuncionarioRepository.findById(
        dados.id_funcionario,
      );
      if (!funcionarioExiste) {
        throw {
          status: 404,
          mensagem: `Funcionário com ID ${dados.id_funcionario} não encontrado`,
        };
      }
      atualizado.id_funcionario = Number(dados.id_funcionario);
    }

    if (dados.id_lote !== undefined) {
      const loteExiste = await LoteRepository.findById(dados.id_lote);
      if (!loteExiste) {
        throw {
          status: 404,
          mensagem: `Lote com ID ${dados.id_lote} não encontrado`,
        };
      }
      atualizado.id_lote = Number(dados.id_lote);
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

    await EntradaRepository.update(id, atualizado);

    return {
      sucesso: true,
      mensagem: "Entrada atualizada com sucesso",
    };
  }

  async deletarEntrada(id) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await EntradaRepository.findById(id);
    if (!existe) {
      throw { status: 404, mensagem: "Entrada não encontrada" };
    }

    await EntradaRepository.delete(id);

    return {
      sucesso: true,
      mensagem: "Entrada apagada com sucesso",
    };
  }
}

module.exports = new EntradaService();
