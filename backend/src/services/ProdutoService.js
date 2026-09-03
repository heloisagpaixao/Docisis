const fs = require("fs");
const path = require("path");
const ProdutoRepository = require("../repositories/ProdutoRepository");

const removerArquivo = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
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
  async listarProdutos() {
    const produtos = await ProdutoRepository.findAll();
    return {
      sucesso: true,
      dados: produtos,
      total: produtos.length,
    };
  }

  async buscarProdutoPorId(id) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const produto = await ProdutoRepository.findById(id);
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
      const { nome, dt_validade, codigo, peso } = dados;

      if (!nome || !dt_validade || codigo === undefined) {
        throw {
          status: 400,
          mensagem: "Os campos nome, dt_validade e codigo são obrigatórios",
        };
      }

      const codigoExistente = await ProdutoRepository.findByCodigo(codigo);
      if (codigoExistente) {
        throw {
          status: 400,
          mensagem: `Já existe um produto com o código ${codigo}`,
        };
      }

      const novoProduto = {
        nome: nome.trim(),
        dt_validade,
        codigo: Number(codigo),
        peso: peso ?? null,
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
      if (!id || isNaN(id)) {
        throw { status: 400, mensagem: "ID inválido" };
      }

      const existe = await ProdutoRepository.findById(id);
      if (!existe) {
        throw { status: 404, mensagem: "Produto não encontrado" };
      }

      const atualizado = {};

      if (dados.nome !== undefined) atualizado.nome = dados.nome.trim();
      if (dados.dt_validade !== undefined)
        atualizado.dt_validade = dados.dt_validade;
      if (dados.peso !== undefined) atualizado.peso = dados.peso;

      if (dados.codigo !== undefined) {
        const codigoExistente = await ProdutoRepository.findByCodigo(
          dados.codigo,
        );
        if (codigoExistente && codigoExistente.id_produto !== Number(id)) {
          throw {
            status: 400,
            mensagem: `Já existe um produto com o código ${dados.codigo}`,
          };
        }
        atualizado.codigo = Number(dados.codigo);
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

      await ProdutoRepository.update(id, atualizado);

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
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await ProdutoRepository.findById(id);
    if (!existe) {
      throw { status: 404, mensagem: "Produto não encontrado" };
    }

    if (existe.imagem) {
      removerFotoDoDisco(existe.imagem);
    }

    await ProdutoRepository.delete(id);

    return {
      sucesso: true,
      mensagem: "Produto apagado com sucesso",
    };
  }
}

module.exports = new ProdutoService();
