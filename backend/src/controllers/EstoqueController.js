const EstoqueService = require("../services/EstoqueService");

class EstoqueController {
  async listar(req, res) {
    try {
      const resultado = await EstoqueService.listarEstoque();
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || "Erro interno do servidor",
        erro: erro.stack || erro,
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
        mensagem: erro.mensagem || "Erro interno do servidor",
        erro: erro.stack || erro,
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
        erro: erro.stack || erro,
      });
    }
  }
}

module.exports = new EstoqueController();
