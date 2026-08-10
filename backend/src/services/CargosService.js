const CargosRepository = require("../repositories/CargosRepository");

class CargosService {
  async listarCargos() {
    const cargos = await CargosRepository.listar();

    return {
      sucesso: true,
      cargos: cargos,
    };
  }

  async buscarCargoPorId(id) {
    if (!id || isNaN(id)) {
      const erro = new Error("ID do cargo inválido");
      erro.status = 400;
      erro.mensagem = "O ID do cargo deve ser um número válido.";
      throw erro;
    }

    const cargo = await CargosRepository.buscarPorId(id);

    if (!cargo) {
      const erro = new Error("Cargo não encontrado");
      erro.status = 404;
      erro.mensagem = "Cargo não encontrado.";
      throw erro;
    }

    return {
      sucesso: true,
      cargo: cargo,
    };
  }

  async cadastrarCargo(dados) {
    const { permissoes, id_funcionario } = dados;

    if (permissoes === undefined || permissoes === null) {
      const erro = new Error("Permissão não informada");
      erro.status = 400;
      erro.mensagem = "O campo permissoes é obrigatório.";
      throw erro;
    }

    if (!id_funcionario) {
      const erro = new Error("Funcionário não informado");
      erro.status = 400;
      erro.mensagem = "O campo id_funcionario é obrigatório.";
      throw erro;
    }

    const cargo = await CargosRepository.cadastrar({
      permissoes,
      id_funcionario,
    });

    return {
      sucesso: true,
      mensagem: "Cargo cadastrado com sucesso.",
      cargo: cargo,
    };
  }

  async atualizarCargo(id, dados) {
    if (!id || isNaN(id)) {
      const erro = new Error("ID do cargo inválido");
      erro.status = 400;
      erro.mensagem = "O ID do cargo deve ser um número válido.";
      throw erro;
    }

    const cargoExistente = await CargosRepository.buscarPorId(id);

    if (!cargoExistente) {
      const erro = new Error("Cargo não encontrado");
      erro.status = 404;
      erro.mensagem = "Cargo não encontrado.";
      throw erro;
    }

    const { permissoes, id_funcionario } = dados;

    if (permissoes === undefined || permissoes === null) {
      const erro = new Error("Permissão não informada");
      erro.status = 400;
      erro.mensagem = "O campo permissoes é obrigatório.";
      throw erro;
    }

    if (!id_funcionario) {
      const erro = new Error("Funcionário não informado");
      erro.status = 400;
      erro.mensagem = "O campo id_funcionario é obrigatório.";
      throw erro;
    }

    await CargosRepository.atualizar(id, {
      permissoes,
      id_funcionario,
    });

    return {
      sucesso: true,
      mensagem: "Cargo atualizado com sucesso.",
    };
  }

  async deletarCargo(id) {
    if (!id || isNaN(id)) {
      const erro = new Error("ID do cargo inválido");
      erro.status = 400;
      erro.mensagem = "O ID do cargo deve ser um número válido.";
      throw erro;
    }

    const cargoExistente = await CargosRepository.buscarPorId(id);

    if (!cargoExistente) {
      const erro = new Error("Cargo não encontrado");
      erro.status = 404;
      erro.mensagem = "Cargo não encontrado.";
      throw erro;
    }

    await CargosRepository.deletar(id);

    return {
      sucesso: true,
      mensagem: "Cargo deletado com sucesso.",
    };
  }
}

module.exports = new CargosService();