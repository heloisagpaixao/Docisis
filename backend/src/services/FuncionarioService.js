const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const FuncionarioRepository = require("../repositories/FuncionarioRepository");
const { validarMagicBytes } = require("../utils/fileValidator");

// Auxiliar para remover arquivo temporário/recém-enviado pelo Multer
const removerArquivo = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error(`Erro ao remover arquivo temporário ${file.path}:`, err);
    }
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
  async listarFuncionarios(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(queryParams.limit, 10) || 10),
    );

    const resultado = await FuncionarioRepository.findAll({
      ...queryParams,
      page,
      limit,
    });

    return {
      sucesso: true,
      ...resultado,
    };
  }

  async buscarFuncionarioPorId(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID de funcionário inválido" };
    }

    const funcionario = await FuncionarioRepository.findById(idNum);
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
      if (file && !validarMagicBytes(file.path, ["jpeg", "png", "jpg"])) {
        throw {
          status: 400,
          mensagem:
            "Arquivo inválido ou corrompido: o conteúdo real não corresponde a uma imagem válida (JPEG/PNG).",
        };
      }

      let { nome, cpf, email, senha, telefone, id_cargo } = dados;

      if (id_cargo !== undefined) {
        id_cargo = Number(id_cargo);
      }

      if (
        !nome ||
        !cpf ||
        !email ||
        !senha ||
        !telefone ||
        id_cargo === undefined ||
        !Number.isInteger(id_cargo) ||
        id_cargo <= 0
      ) {
        throw {
          status: 400,
          mensagem:
            "Nome, CPF, e-mail, senha, telefone e ID do cargo são obrigatórios e devem ser válidos",
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

      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);

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

  async atualizarFuncionario(id, dados) {
    const { file } = dados;

    try {
      if (file && !validarMagicBytes(file.path, ["jpeg", "png", "jpg"])) {
        throw {
          status: 400,
          mensagem:
            "Arquivo inválido ou corrompido: o conteúdo real não corresponde a uma imagem válida (JPEG/PNG).",
        };
      }

      const idNum = Number(id);
      if (!id || !Number.isInteger(idNum) || idNum <= 0) {
        throw { status: 400, mensagem: "ID de funcionário inválido" };
      }

      const existe = await FuncionarioRepository.findById(idNum);
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
        const cargoNum = Number(id_cargo);
        if (!Number.isInteger(cargoNum) || cargoNum <= 0) {
          throw {
            status: 400,
            mensagem: "ID do cargo deve ser um número inteiro válido",
          };
        }
        atualizado.id_cargo = cargoNum;
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

      await FuncionarioRepository.update(idNum, atualizado);

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
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID de funcionário inválido" };
    }

    const existe = await FuncionarioRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Funcionário não encontrado" };
    }

    // Trava de integridade: checa se existem registros dependentes (entradas, saídas, ajustes)
    const hasDeps = await FuncionarioRepository.hasDependents(idNum);
    if (hasDeps) {
      throw {
        status: 409,
        mensagem:
          "Não é possível excluir o funcionário: existem movimentações de estoque (entradas, saídas ou ajustes) associadas a ele.",
      };
    }

    // Apaga a imagem física no disco antes de excluir o registro no banco
    if (existe.foto_perfil) {
      removerFotoDoDisco(existe.foto_perfil);
    }

    await FuncionarioRepository.delete(idNum);

    return {
      sucesso: true,
      mensagem: "Funcionário removido com sucesso",
    };
  }

  async alterarSenha(id, { senhaAtual, novaSenha } = {}) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID de funcionário inválido" };
    }
    if (!senhaAtual || !novaSenha) {
      throw {
        status: 400,
        mensagem: "Senha atual e nova senha são obrigatórias",
      };
    }

    // Busca funcionário com senha para comparação segura
    const funcionario = await FuncionarioRepository.findByIdWithPassword(idNum);
    if (!funcionario) {
      throw { status: 404, mensagem: "Funcionário não encontrado" };
    }

    const senhaValida = await bcrypt.compare(senhaAtual, funcionario.senha);
    if (!senhaValida) {
      throw { status: 401, mensagem: "Senha atual incorreta" };
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);
    await FuncionarioRepository.update(idNum, { senha: senhaHash });

    return {
      sucesso: true,
      mensagem: "Senha alterada com sucesso",
    };
  }
}

module.exports = new FuncionarioService();
