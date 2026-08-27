const NotaFiscalRepository = require("../repositories/NotaFiscalRepository");

class NotaFiscalService {
  async listarNotas() {
    const notas = await NotaFiscalRepository.findAll();
    return {
      sucesso: true,
      dados: notas,
      total: notas.length,
    };
  }

  async buscarNotaPorId(id) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const nota = await NotaFiscalRepository.findById(id);
    if (!nota) {
      throw { status: 404, mensagem: "Nota fiscal não encontrada" };
    }

    return {
      sucesso: true,
      dados: nota,
    };
  }

  async cadastrarNota(dados) {
    const { fornecedor, quantidade, dt_compra } = dados;

    if (!fornecedor || quantidade === undefined) {
      throw {
        status: 400,
        mensagem: "Os campos fornecedor e quantidade são obrigatórios",
      };
    }

    const novaNota = {
      dt_compra: dt_compra || new Date(),
      fornecedor: fornecedor.trim(),
      quantidade: Number(quantidade),
    };

    const id = await NotaFiscalRepository.create(novaNota);

    return {
      sucesso: true,
      mensagem: "Nota fiscal cadastrada com sucesso",
      id,
    };
  }

  async atualizarNota(id, dados) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await NotaFiscalRepository.findById(id);
    if (!existe) {
      throw { status: 404, mensagem: "Nota fiscal não encontrada" };
    }

    const atualizado = {};

    if (dados.fornecedor !== undefined)
      atualizado.fornecedor = dados.fornecedor.trim();
    if (dados.quantidade !== undefined)
      atualizado.quantidade = Number(dados.quantidade);
    if (dados.dt_compra !== undefined) atualizado.dt_compra = dados.dt_compra;

    if (Object.keys(atualizado).length === 0) {
      throw {
        status: 400,
        mensagem: "Nenhum dado válido enviado para atualização",
      };
    }

    await NotaFiscalRepository.update(id, atualizado);

    return {
      sucesso: true,
      mensagem: "Nota fiscal atualizada com sucesso",
    };
  }

  async deletarNota(id) {
    if (!id || isNaN(id)) {
      throw { status: 400, mensagem: "ID inválido" };
    }

    const existe = await NotaFiscalRepository.findById(id);
    if (!existe) {
      throw { status: 404, mensagem: "Nota fiscal não encontrada" };
    }

    await NotaFiscalRepository.delete(id);

    return {
      sucesso: true,
      mensagem: "Nota fiscal apagada com sucesso",
    };
  }
}

module.exports = new NotaFiscalService();
