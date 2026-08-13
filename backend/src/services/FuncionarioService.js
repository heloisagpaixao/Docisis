const FuncionarioRepository = require("../repositories/FuncionarioRepository");

class FuncionarioService {
  async listarFuncionarios() {
    const funcionarios = await FuncionarioRepository.findAll();

    return {
      sucesso: true,
      dados: funcionarios,
      total: funcionarios.length,
    };
  }

  async buscarFuncionarioPorId(id) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const funcionario = await FuncionarioRepository.findById(id);
    if (!funcionario) {
      throw { status: 404, mensagem: "Funcionário não encontrado" };
    }

    return {
      sucesso: true,
      dados: funcionario,
    };
  }

  async cadastrarFuncionario(dados) {
    let { nome, cpf, email, telefone, id_cargo, file } = dados;

    if (typeof id_cargo === "string") {
      id_cargo = parseInt(id_cargo, 10);
    }

    if (
      !nome ||
      !cpf ||
      !email ||
      !telefone ||
      id_cargo === undefined ||
      isNaN(id_cargo)
    ) {
      throw {
        status: 400,
        mensagem:
          "Nome, CPF, e-mail, telefone e ID do cargo são obrigatórios e devem ser válidos",
      };
    }

    const cpfLimpo = cpf.trim();
    const emailLimpo = email.trim().toLowerCase();

    const cpfExistente = await FuncionarioRepository.findByCpf(cpfLimpo);
    if (cpfExistente) {
      throw {
        status: 400,
        mensagem: "Já existe um funcionário cadastrado com este CPF",
      };
    }

    const emailExistente = await FuncionarioRepository.findByEmail(emailLimpo);
    if (emailExistente) {
      throw {
        status: 400,
        mensagem:
          "Já existe um funcionário cadastrado com este e-mail corporativo",
      };
    }

    const novoFuncionario = {
      nome: nome.trim(),
      cpf: cpfLimpo,
      email: emailLimpo,
      telefone: telefone.trim(),
      id_cargo,
      foto_perfil: file ? `uploads/funcionarios/${file.filename}` : null,
    };

    const id = await FuncionarioRepository.create(novoFuncionario);

    return {
      sucesso: true,
      mensagem: "Funcionário cadastrado com sucesso",
      id,
    };
  }

  async atualizarFuncionario(id, dados) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await FuncionarioRepository.findById(id);
    if (!existe) {
      throw { status: 404, mensagem: "Funcionário não encontrado" };
    }

    const atualizado = {};
    let { nome, cpf, email, telefone, id_cargo } = dados;

    if (nome !== undefined) atualizado.nome = nome.trim();
    if (telefone !== undefined) atualizado.telefone = telefone.trim();

    if (cpf !== undefined) {
      const cpfLimpo = cpf.trim();
      if (cpfLimpo !== existe.cpf) {
        const cpfEmUso = await FuncionarioRepository.findByCpf(cpfLimpo);
        if (cpfEmUso) {
          throw {
            status: 400,
            mensagem: "Já existe outro funcionário cadastrado com este CPF",
          };
        }
      }
      atualizado.cpf = cpfLimpo;
    }

    if (email !== undefined) {
      const emailLimpo = email.trim().toLowerCase();
      if (emailLimpo !== existe.email) {
        const emailEmUso = await FuncionarioRepository.findByEmail(emailLimpo);
        if (emailEmUso) {
          throw {
            status: 400,
            mensagem:
              "Já existe outro funcionário cadastrado com este e-mail corporativo",
          };
        }
      }
      atualizado.email = emailLimpo;
    }

    if (id_cargo !== undefined) {
      if (typeof id_cargo === "string") id_cargo = parseInt(id_cargo, 10);
      if (isNaN(id_cargo)) {
        throw {
          status: 400,
          mensagem: "ID do cargo deve ser um número válido",
        };
      }
      atualizado.id_cargo = id_cargo;
    }

    if (Object.keys(atualizado).length === 0) {
      throw {
        status: 400,
        mensagem: "Nenhum dado válido enviado para atualização",
      };
    }

    await FuncionarioRepository.update(id, atualizado);

    return {
      sucesso: true,
      mensagem: "Dados do funcionário atualizados com sucesso",
    };
  }

  async deletarFuncionario(id) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await FuncionarioRepository.findById(id);
    if (!existe) {
      throw { status: 404, mensagem: "Funcionário não encontrado" };
    }

    await FuncionarioRepository.delete(id);

    return {
      sucesso: true,
      mensagem: "Funcionário removido com sucesso",
    };
  }
}

module.exports = new FuncionarioService();
