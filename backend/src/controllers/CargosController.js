const CargosService = require("../services/CargosService");

class CargosController {
  async listarCargos(req, res) {
    try {
      const resultado = await CargosService.listarCargos();

      res.status(200).json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }

  async buscarCargosPorId(req, res) {
    try {
      const resultado = await CargosService.buscarCargoPorId(
        req.params.id
      );

      res.status(200).json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }

  async cadastrarCargos(req, res) {
    try {
      const resultado = await CargosService.cadastrarCargo(req.body);

      res.status(201).json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }

  async atualizarCargos(req, res) {
    try {
      const resultado = await CargosService.atualizarCargo(
        req.params.id,
        req.body
      );

      res.status(200).json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }

  async deletarCargos(req, res) {
    try {
      const resultado = await CargosService.deletarCargo(
        req.params.id
      );

      res.status(200).json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }
}

module.exports = new CargosController();