const fs = require("fs");
const path = require("path");
const ProdutoRepository = require("../repositories/ProdutoRepository");
const { validarMagicBytes } = require("../utils/fileValidator");

const removerArquivo = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error(`Erro ao remover arquivo temporário ${file.path}:`, err);
    }
  }
};

const removerFotoDoDisco = (caminhoRelativo) => {
  if (!caminhoRelativo) return;

  const nomeArquivo = path.basename(caminhoRelativo);
  const caminhoAbsoluto = path.join(
    __dirname,
    "../../public/uploads/produtos",
    nomeArquivo,
  );

  if (fs.existsSync(caminhoAbsoluto)) {
    try {
      fs.unlinkSync(caminhoAbsoluto);
    } catch (erro) {
      console.error(`Erro ao remover imagem do produto: ${nomeArquivo}`, erro);
    }
  }
};

class ProdutoService {
  async listarProdutos(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(queryParams.limit, 10) || 10),
    );

    const resultado = await ProdutoRepository.findAll({
      ...queryParams,
      page,
      limit,
    });

    return {
      sucesso: true,
      ...resultado,
    };
  }

  async buscarProdutoPorId(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID de produto inválido" };
    }

    const produto = await ProdutoRepository.findById(idNum);
    if (!produto) {
      throw { status: 404, mensagem: "Produto não encontrado" };
    }

    return {
      sucesso: true,
      dados: produto,
    };
  }

  async cadastrarProduto(dados) {
    const { file } = dados;

    try {
      if (file && !validarMagicBytes(file.path, ["jpeg", "png", "jpg"])) {
        throw {
          status: 400,
          mensagem:
            "Arquivo inválido ou corrompido: o conteúdo real não corresponde a uma imagem válida (JPEG/PNG).",
        };
      }

      const { nome, dt_validade, codigo, peso } = dados;

      if (!nome || !dt_validade || codigo === undefined || codigo === null || codigo === "") {
        throw {
          status: 400,
          mensagem: "Os campos nome, dt_validade e codigo são obrigatórios",
        };
      }

      const codigoNum = Number(codigo);
      if (!Number.isInteger(codigoNum) || codigoNum <= 0) {
        throw {
          status: 400,
          mensagem: "O código do produto deve ser um número inteiro positivo",
        };
      }

      if (peso !== undefined && peso !== null && peso !== "") {
        const pesoNum = Number(peso);
        if (isNaN(pesoNum) || pesoNum < 0) {
          throw {
            status: 400,
            mensagem: "O peso do produto deve ser um número válido e não negativo",
          };
        }
      }

      const codigoExistente = await ProdutoRepository.findByCodigo(codigoNum);
      if (codigoExistente) {
        throw {
          status: 400,
          mensagem: `Já existe um produto com o código ${codigoNum}`,
        };
      }

      const novoProduto = {
        nome: nome.trim(),
        dt_validade,
        codigo: codigoNum,
        peso: peso ? Number(peso) : null,
        imagem: file ? `/public/uploads/produtos/${file.filename}` : null,
      };

      const id = await ProdutoRepository.create(novoProduto);

      return {
        sucesso: true,
        mensagem: "Produto cadastrado com sucesso",
        id,
      };
    } catch (erro) {
      removerArquivo(file);
      throw erro;
    }
  }

  async atualizarProduto(id, dados) {
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
        throw { status: 400, mensagem: "ID de produto inválido" };
      }

      const existe = await ProdutoRepository.findById(idNum);
      if (!existe) {
        throw { status: 404, mensagem: "Produto não encontrado" };
      }

      const atualizado = {};

      if (dados.nome !== undefined) atualizado.nome = dados.nome.trim();
      if (dados.dt_validade !== undefined)
        atualizado.dt_validade = dados.dt_validade;

      if (dados.peso !== undefined && dados.peso !== null && dados.peso !== "") {
        const pesoNum = Number(dados.peso);
        if (isNaN(pesoNum) || pesoNum < 0) {
          throw {
            status: 400,
            mensagem: "O peso do produto deve ser um número válido e não negativo",
          };
        }
        atualizado.peso = pesoNum;
      }

      if (dados.codigo !== undefined) {
        const codigoNum = Number(dados.codigo);
        if (!Number.isInteger(codigoNum) || codigoNum <= 0) {
          throw {
            status: 400,
            mensagem: "O código do produto deve ser um número inteiro positivo",
          };
        }

        const codigoExistente = await ProdutoRepository.findByCodigo(codigoNum);
        if (codigoExistente && codigoExistente.id_produto !== idNum) {
          throw {
            status: 400,
            mensagem: `Já existe um produto com o código ${codigoNum}`,
          };
        }
        atualizado.codigo = codigoNum;
      }

      if (file) {
        atualizado.imagem = `/public/uploads/produtos/${file.filename}`;
      }

      if (Object.keys(atualizado).length === 0) {
        throw {
          status: 400,
          mensagem: "Nenhum dado válido enviado para atualização",
        };
      }

      await ProdutoRepository.update(idNum, atualizado);

      if (file && existe.imagem) {
        removerFotoDoDisco(existe.imagem);
      }

      return {
        sucesso: true,
        mensagem: "Produto atualizado com sucesso",
      };
    } catch (erro) {
      removerArquivo(file);
      throw erro;
    }
  }

  async deletarProduto(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID de produto inválido" };
    }

    const existe = await ProdutoRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Produto não encontrado" };
    }

    // Trava de integridade: checa se existem lotes vinculados ao produto
    const hasDeps = await ProdutoRepository.hasDependents(idNum);
    if (hasDeps) {
      throw {
        status: 409,
        mensagem:
          "Não é possível excluir o produto: existem lotes de estoque vinculados a ele.",
      };
    }

    if (existe.imagem) {
      removerFotoDoDisco(existe.imagem);
    }

    await ProdutoRepository.delete(idNum);

    return {
      sucesso: true,
      mensagem: "Produto apagado com sucesso",
    };
  }
}

module.exports = new ProdutoService();
