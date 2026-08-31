const SaidaService = require("../services/SaidaService");

class SaidaController {
  async listar(req, res) {
    try {
      const resultado = await SaidaService.listarSaidas();
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }

  async buscarPorId(req, res) {
    try {
      const resultado = await SaidaService.buscarSaidaPorId(req.params.id);
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }

  async cadastrar(req, res) {
    try {
      const resultado = await SaidaService.cadastrarSaida(req.body);
      res.status(201).json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }

  async atualizar(req, res) {
    try {
      const resultado = await SaidaService.atualizarSaida(
        req.params.id,
        req.body,
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

  async deletar(req, res) {
    try {
      const resultado = await SaidaService.deletarSaida(req.params.id);
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

module.exports = new SaidaController();
