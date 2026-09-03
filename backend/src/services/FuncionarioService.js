const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const FuncionarioRepository = require("../repositories/FuncionarioRepository");

// Auxiliar para remover arquivo temporário/recém-enviado pelo Multer
const removerArquivo = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
};

// Auxiliar para remover foto de perfil salva no disco a partir do caminho do banco
const removerFotoDoDisco = (caminhoRelativo) => {
  if (!caminhoRelativo) return;

  const nomeArquivo = path.basename(caminhoRelativo);
  const caminhoAbsoluto = path.join(
    __dirname,
    "../../public/uploads/funcionarios",
    nomeArquivo,
  );

  if (fs.existsSync(caminhoAbsoluto)) {
    try {
      fs.unlinkSync(caminhoAbsoluto);
    } catch (erro) {
      console.error(`Erro ao remover imagem ${nomeArquivo}:`, erro);
    }
  }
};

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
    const { file } = dados;

    try {
      let { nome, cpf, email, senha, telefone, id_cargo } = dados;

      if (typeof id_cargo === "string") {
        id_cargo = parseInt(id_cargo, 10);
      }

      if (
        !nome ||
        !cpf ||
        !email ||
        !senha ||
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

      const emailExistente =
        await FuncionarioRepository.findByEmail(emailLimpo);
      if (emailExistente) {
        throw {
          status: 400,
          mensagem:
            "Já existe um funcionário cadastrado com este e-mail corporativo",
        };
      }

      const salt = await bcrypt.genSalt(10)
      const senhaHash = await bcrypt.hash(senha, salt)

      const novoFuncionario = {
        nome: nome.trim(),
        cpf: cpfLimpo,
        email: emailLimpo,
        senha: senhaHash.trim(),
        telefone: telefone.trim(),
        id_cargo,
        foto_perfil: file
          ? `/public/uploads/funcionarios/${file.filename}`
          : null,
      };

      const id = await FuncionarioRepository.create(novoFuncionario);

      return {
        sucesso: true,
        mensagem: "Funcionário cadastrado com sucesso",
        id,
      };
    } catch (error) {
      removerArquivo(file);
      throw error;
    }
  }

  async login(email, senha) {
    if (!email || !senha) {
      throw { status: 400, mensagem: "E-mail e senha são obrigatórios." };
    }

    const emailLimpo = email.trim().toLowerCase();
    const funcionario = await FuncionarioRepository.findByEmail(emailLimpo);

    if (!funcionario) {
      throw { status: 401, mensagem: "Credenciais inválidas." };
    }

    const senhaCorreta = await bcrypt.compare(senha, funcionario.senha);
    if (!senhaCorreta) {
      throw { status: 401, mensagem: "Credenciais inválidas." };
    }

    const segredo = "chave_super_secreta_docisis_2026" || process.env.JWT_SECRET;
    if (!segredo) {
      throw { status: 500, mensagem: "Configuração do JWT ausente no servidor." };
    }

    const payload = {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      id_cargo: funcionario.id_cargo,
    };

    const token = jwt.sign(payload, segredo, { expiresIn: "8h" });

    return {
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
      token,
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
      },
    };
  }


  async atualizarFuncionario(id, dados) {
    const { file } = dados;

    try {
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
          const emailEmUso =
            await FuncionarioRepository.findByEmail(emailLimpo);
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

      if (file) {
        atualizado.foto_perfil = `/public/uploads/funcionarios/${file.filename}`;
      }

      if (Object.keys(atualizado).length === 0) {
        throw {
          status: 400,
          mensagem: "Nenhum dado válido enviado para atualização",
        };
      }

      await FuncionarioRepository.update(id, atualizado);

      // Se a imagem foi atualizada com sucesso, apaga a antiga
      if (file && existe.foto_perfil) {
        removerFotoDoDisco(existe.foto_perfil);
      }

      return {
        sucesso: true,
        mensagem: "Dados do funcionário atualizados com sucesso",
      };
    } catch (error) {
      removerArquivo(file);
      throw error;
    }
  }

  async deletarFuncionario(id) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await FuncionarioRepository.findById(id);
    if (!existe) {
      throw { status: 404, mensagem: "Funcionário não encontrado" };
    }

    // Apaga a imagem física no disco antes de excluir o registro no banco
    if (existe.foto_perfil) {
      removerFotoDoDisco(existe.foto_perfil);
    }

    await FuncionarioRepository.delete(id);

    return {
      sucesso: true,
      mensagem: "Funcionário removido com sucesso",
    };
  }
}

module.exports = new FuncionarioService();
