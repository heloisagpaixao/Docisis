const NotaFiscalService = require("../services/NotaFiscalService");

class NotaFiscalController {
  async listar(req, res) {
    try {
      const resultado = await NotaFiscalService.listarNotas(req.query);
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }

  async buscarPorId(req, res) {
    try {
      const resultado = await NotaFiscalService.buscarNotaPorId(req.params.id);
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }

  async cadastrar(req, res) {
    try {
      const resultado = await NotaFiscalService.cadastrarNota({
        ...req.body,
        file: req.file,
      });
      res.status(201).json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }

  async atualizar(req, res) {
    try {
      const resultado = await NotaFiscalService.atualizarNota(req.params.id, {
        ...req.body,
        file: req.file,
      });
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }

  async deletar(req, res) {
    try {
      const resultado = await NotaFiscalService.deletarNota(req.params.id);
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }
}

module.exports = new NotaFiscalController();
