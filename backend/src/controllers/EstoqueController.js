const EstoqueService = require("../services/EstoqueService");

class EstoqueController {
  async listar(req, res) {
    try {
      const resultado = await EstoqueService.listarEstoque(req.query);
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
      const resultado = await EstoqueService.buscarEstoquePorId(req.params.id);
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }

  async buscarEstoqueBaixo(req, res) {
    try {
      const resultado = await EstoqueService.buscarEstoqueBaixo(
        req.query.limite,
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
}

module.exports = new EstoqueController();
