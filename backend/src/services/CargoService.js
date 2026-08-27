const CargosRepository = require("../repositories/CargoRepository");

class CargoService {
  async listarCargos() {
    const cargos = await CargosRepository.listar();
    return {
      sucesso: true,
      dados: cargos,
      total: cargos.length,
    };
  }

  async buscarCargoPorId(id) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const cargo = await CargosRepository.buscarPorId(id);
    if (!cargo) {
      throw { status: 404, mensagem: "Cargo não encontrado" };
    }

    return {
      sucesso: true,
      dados: cargo,
    };
  }

  async cadastrarCargo(dados) {
    const { permissoes } = dados;

    if (permissoes === undefined) {
      throw { status: 400, mensagem: "O campo 'permissoes' é obrigatório" };
    }

    const novoCargo = await CargosRepository.cadastrar({
      permissoes: Boolean(permissoes),
    });

    return {
      sucesso: true,
      mensagem: "Cargo cadastrado com sucesso",
      dados: novoCargo,
    };
  }

  async atualizarCargo(id, dados) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await CargosRepository.buscarPorId(id);
    if (!existe) {
      throw { status: 404, mensagem: "Cargo não encontrado" };
    }

    if (dados.permissoes === undefined) {
      throw { status: 400, mensagem: "Nenhum dado válido enviado para atualização" };
    }

    await CargosRepository.atualizar(id, {
      permissoes: Boolean(dados.permissoes),
    });

    return {
      sucesso: true,
      mensagem: "Cargo atualizado com sucesso",
    };
  }

  async deletarCargo(id) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await CargosRepository.buscarPorId(id);
    if (!existe) {
      throw { status: 404, mensagem: "Cargo não encontrado" };
    }

    await CargosRepository.deletar(id);

    return {
      sucesso: true,
      mensagem: "Cargo apagado com sucesso",
    };
  }
}

module.exports = new CargoService();