const LoteRepository = require("../repositories/LoteRepository");
const ProdutoRepository = require("../repositories/ProdutoRepository");
const NotaFiscalRepository = require("../repositories/NotaFiscalRepository");

class LoteService {
  async listarLotes(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(queryParams.limit, 10) || 10),
    );

    const resultado = await LoteRepository.findAll({
      ...queryParams,
      page,
      limit,
    });

    return {
      sucesso: true,
      ...resultado,
    };
  }

  async buscarLotePorId(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID do lote inválido" };
    }

    const lote = await LoteRepository.findById(idNum);
    if (!lote) {
      throw { status: 404, mensagem: "Lote não encontrado" };
    }

    return {
      sucesso: true,
      dados: lote,
    };
  }

  async buscarVencendo(dias) {
    const diasNum = parseInt(dias, 10) || 30;
    const lotes = await LoteRepository.findVencendo(diasNum);
    return {
      sucesso: true,
      dados: lotes,
      total: lotes.length,
    };
  }

  async buscarMovimentacoes(idLote) {
    const idNum = Number(idLote);
    if (!idLote || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID do lote inválido" };
    }

    const loteExiste = await LoteRepository.findById(idNum);
    if (!loteExiste) {
      throw { status: 404, mensagem: "Lote não encontrado" };
    }

    const movimentacoes = await LoteRepository.findMovimentacoes(idNum);

    return {
      sucesso: true,
      lote_id: idNum,
      total: movimentacoes.length,
      dados: movimentacoes,
    };
  }

  async cadastrarLote(dados) {
    const { quantidade, id_produto, dt_validade, id_nota } = dados;

    if (quantidade === undefined || !id_produto || !dt_validade || !id_nota) {
      throw {
        status: 400,
        mensagem:
          "Os campos quantidade, id_produto, dt_validade e id_nota são obrigatórios",
      };
    }

    const qtdNum = Number(quantidade);
    if (!Number.isInteger(qtdNum) || qtdNum <= 0) {
      throw {
        status: 400,
        mensagem: "A quantidade inicial deve ser um número inteiro positivo",
      };
    }

    const idProdNum = Number(id_produto);
    if (!Number.isInteger(idProdNum) || idProdNum <= 0) {
      throw { status: 400, mensagem: "O campo 'id_produto' deve ser um número inteiro válido" };
    }

    const idNotaNum = Number(id_nota);
    if (!Number.isInteger(idNotaNum) || idNotaNum <= 0) {
      throw { status: 400, mensagem: "O campo 'id_nota' deve ser um número inteiro válido" };
    }

    // Normalização segura de data evitando bug de fuso horário (Issue 14)
    // Compara YYYY-MM-DD em string direta ou data local normalizada
    const dataValidadeStr = String(dt_validade).split("T")[0];
    const hojeStr = new Date().toLocaleDateString("pt-BR").split("/").reverse().join("-"); // YYYY-MM-DD local
    if (dataValidadeStr < hojeStr) {
      throw {
        status: 400,
        mensagem: "A data de validade não pode ser anterior à data de hoje",
      };
    }

    // Valida se o Produto associado existe (Issue 3)
    const produtoExiste = await ProdutoRepository.findById(idProdNum);
    if (!produtoExiste) {
      throw {
        status: 404,
        mensagem: `Produto com ID ${idProdNum} não foi encontrado`,
      };
    }

    // Valida se a Nota Fiscal associada existe
    const notaExiste = await NotaFiscalRepository.findById(idNotaNum);
    if (!notaExiste) {
      throw {
        status: 404,
        mensagem: `Nota Fiscal com ID ${idNotaNum} não foi encontrada`,
      };
    }

    const novoLote = {
      quantidade: qtdNum,
      id_produto: idProdNum,
      dt_validade: dataValidadeStr,
      id_nota: idNotaNum,
    };

    const id = await LoteRepository.create(novoLote);

    return {
      sucesso: true,
      mensagem: "Lote cadastrado com sucesso",
      id,
    };
  }

  async atualizarLote(id, dados) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID do lote inválido" };
    }

    const existe = await LoteRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Lote não encontrado" };
    }

    // Bloqueia alteração direta de quantidade via PUT (Issue 8)
    if (dados.quantidade !== undefined) {
      throw {
        status: 400,
        mensagem:
          "A quantidade do lote não pode ser alterada diretamente. Para movimentar estoque, registre uma Entrada, Saída ou Ajuste auditado.",
      };
    }

    const atualizado = {};

    if (dados.id_produto !== undefined) {
      const idProdNum = Number(dados.id_produto);
      if (!Number.isInteger(idProdNum) || idProdNum <= 0) {
        throw { status: 400, mensagem: "O campo 'id_produto' deve ser um número inteiro válido" };
      }
      const produtoExiste = await ProdutoRepository.findById(idProdNum);
      if (!produtoExiste) {
        throw {
          status: 404,
          mensagem: `Produto com ID ${idProdNum} não encontrado`,
        };
      }
      atualizado.id_produto = idProdNum;
    }

    if (dados.dt_validade !== undefined) {
      const dataValidadeStr = String(dados.dt_validade).split("T")[0];
      const hojeStr = new Date().toLocaleDateString("pt-BR").split("/").reverse().join("-");
      if (dataValidadeStr < hojeStr) {
        throw {
          status: 400,
          mensagem: "A data de validade não pode ser anterior à data de hoje",
        };
      }
      atualizado.dt_validade = dataValidadeStr;
    }

    if (dados.id_nota !== undefined) {
      const idNotaNum = Number(dados.id_nota);
      if (!Number.isInteger(idNotaNum) || idNotaNum <= 0) {
        throw { status: 400, mensagem: "O id_nota fornecido é inválido" };
      }
      const notaExiste = await NotaFiscalRepository.findById(idNotaNum);
      if (!notaExiste) {
        throw {
          status: 404,
          mensagem: `Nota Fiscal com ID ${idNotaNum} não encontrada`,
        };
      }
      atualizado.id_nota = idNotaNum;
    }

    if (Object.keys(atualizado).length === 0) {
      throw {
        status: 400,
        mensagem: "Nenhum dado válido enviado para atualização",
      };
    }

    await LoteRepository.update(idNum, atualizado);

    return {
      sucesso: true,
      mensagem: "Lote atualizado com sucesso",
    };
  }

  async deletarLote(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID do lote inválido" };
    }

    const existe = await LoteRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Lote não encontrado" };
    }

    // Trava de integridade: checa se existem entradas, saídas ou ajustes vinculados (Issue 9)
    const hasDeps = await LoteRepository.hasDependents(idNum);
    if (hasDeps) {
      throw {
        status: 409,
        mensagem:
          "Não é possível excluir o lote: existem movimentações de estoque (entradas, saídas ou ajustes) associadas a ele.",
      };
    }

    await LoteRepository.delete(idNum);

    return {
      sucesso: true,
      mensagem: "Lote apagado com sucesso",
    };
  }
}

module.exports = new LoteService();
