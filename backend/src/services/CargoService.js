const CargoRepository = require("../repositories/CargoRepository");

class CargoService {
  async listarCargos(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(queryParams.limit, 10) || 10),
    );

    const resultado = await CargoRepository.findAll({
      ...queryParams,
      page,
      limit,
    });

    return {
      sucesso: true,
      ...resultado,
    };
  }

  async buscarCargoPorId(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID do cargo inválido" };
    }

    const cargo = await CargoRepository.findById(idNum);
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

    const novoCargo = await CargoRepository.create({
      permissoes: Boolean(permissoes),
    });

    return {
      sucesso: true,
      mensagem: "Cargo cadastrado com sucesso",
      dados: novoCargo,
    };
  }

  async atualizarCargo(id, dados) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID do cargo inválido" };
    }

    const existe = await CargoRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Cargo não encontrado" };
    }

    if (dados.permissoes === undefined) {
      throw { status: 400, mensagem: "Nenhum dado válido enviado para atualização" };
    }

    await CargoRepository.update(idNum, {
      permissoes: Boolean(dados.permissoes),
    });

    return {
      sucesso: true,
      mensagem: "Cargo atualizado com sucesso",
    };
  }

  async deletarCargo(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID do cargo inválido" };
    }

    const existe = await CargoRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Cargo não encontrado" };
    }

    // Trava de integridade: checa se há funcionários vinculados ao cargo
    const hasDeps = await CargoRepository.hasDependents(idNum);
    if (hasDeps) {
      throw {
        status: 409,
        mensagem:
          "Não é possível excluir o cargo: existem funcionários vinculados a ele.",
      };
    }

    await CargoRepository.delete(idNum);

    return {
      sucesso: true,
      mensagem: "Cargo apagado com sucesso",
    };
  }
}

module.exports = new CargoService();