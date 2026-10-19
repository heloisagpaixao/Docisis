const SaidaService = require("../services/SaidaService");

class SaidaController {
  async listar(req, res) {
    try {
      const resultado = await SaidaService.listarSaidas(req.query);
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
      const resultado = await SaidaService.buscarSaidaPorId(req.params.id);
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
      const dados = {
        ...req.body,
        id_funcionario: req.body.id_funcionario || req.user?.id || req.funcionario?.id,
      };
      const resultado = await SaidaService.cadastrarSaida(dados);
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
      const resultado = await SaidaService.atualizarSaida(
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
      const resultado = await SaidaService.deletarSaida(req.params.id);
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

module.exports = new SaidaController();
