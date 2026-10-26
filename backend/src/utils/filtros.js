const { idValido, lerData } = require("./validadores");

const SO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Lê ?data_inicio= e ?data_fim= (AAAA-MM-DD). As duas juntas ou nenhuma.
 * data_fim só com a data vale até o ÚLTIMO instante do dia.
 * Devolve { erro } ou { periodo: { data_inicio, data_fim } } (vazio se não informado).
 */
function lerPeriodo(query = {}) {
  const { data_inicio, data_fim } = query;
  if ((data_inicio === undefined) !== (data_fim === undefined)) {
    return { erro: "Informe data_inicio e data_fim juntos" };
  }
  if (data_inicio === undefined) return { periodo: {} };

  const inicio = lerData(data_inicio);
  const fim = lerData(data_fim);
  if (!inicio || !fim) return { erro: "Datas inválidas (use AAAA-MM-DD)" };
  if (SO_DATA.test(data_fim.trim())) fim.setHours(23, 59, 59, 999);
  if (fim < inicio)
    return { erro: "data_fim não pode ser anterior a data_inicio" };
  return { periodo: { data_inicio: inicio, data_fim: fim } };
}

/**
 * Filtros das listagens de movimentações (entradas, saídas, ajustes):
 * ?id_funcionario= &id_lote= &data_inicio= &data_fim=
 * Devolve { erro } ou { filtros }.
 */
function lerFiltrosMovimentacao(query = {}) {
  const filtros = {};

  for (const campo of ["id_funcionario", "id_lote"]) {
    if (query[campo] !== undefined) {
      if (!idValido(query[campo])) return { erro: `${campo} inválido` };
      filtros[campo] = Number(query[campo]);
    }
  }

  const { erro, periodo } = lerPeriodo(query);
  if (erro) return { erro };
  return { filtros: { ...filtros, ...periodo } };
}

module.exports = { lerPeriodo, lerFiltrosMovimentacao };
