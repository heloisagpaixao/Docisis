const LoteService = require("../services/LoteService");

class LoteController {
  async listar(req, res) {
    try {
      const resultado = await LoteService.listarLotes(req.query);
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
      const resultado = await LoteService.buscarLotePorId(req.params.id);
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }

  async buscarVencendo(req, res) {
    try {
      const resultado = await LoteService.buscarVencendo(req.query.dias);
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }

  async buscarMovimentacoes(req, res) {
    try {
      const resultado = await LoteService.buscarMovimentacoes(req.params.id);
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
      const resultado = await LoteService.cadastrarLote(req.body);
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
      const resultado = await LoteService.atualizarLote(
        req.params.id,
        req.body,
      );
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
      const resultado = await LoteService.deletarLote(req.params.id);
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

module.exports = new LoteController();
