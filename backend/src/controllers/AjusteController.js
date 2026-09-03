const ajusteService = require("../services/AjusteService");

class AjusteController {
  async criar(req, res) {
    try {
      const { id_lote, id_funcionario, quantidade_nova, motivo } = req.body;

      const ajuste = await ajusteService.criarAjuste({
        id_lote,
        id_funcionario,
        quantidade_nova,
        motivo,
      });

      return res.status(201).json({
        sucesso: true,
        mensagem: "Ajuste de estoque realizado com sucesso.",
        dados: ajuste,
      });
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({
        sucesso: false,
        erro: error.message || "Erro interno ao processar o ajuste de estoque.",
      });
    }
  }

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const ajuste = await ajusteService.buscarPorId(id);
      return res.status(200).json({ sucesso: true, dados: ajuste });
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({
        sucesso: false,
        erro: error.message || "Erro ao buscar o ajuste.",
      });
    }
  }

  async listar(req, res) {
    try {
      const { id_lote, id_funcionario, data_inicio, data_fim } = req.query;

      const ajustes = await ajusteService.listarAjustes({
        id_lote,
        id_funcionario,
        data_inicio,
        data_fim,
      });

      return res.status(200).json({ sucesso: true, dados: ajustes });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        erro: "Erro interno ao buscar o histórico de ajustes.",
      });
    }
  }
}

module.exports = new AjusteController();
