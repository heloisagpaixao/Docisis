const { idValido, lerData } = require("./validadores");

const SO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Lê os filtros das listagens de movimentações (entradas, saídas, ajustes):
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

  const { data_inicio, data_fim } = query;
  if ((data_inicio === undefined) !== (data_fim === undefined)) {
    return { erro: "Informe data_inicio e data_fim juntos" };
  }
  if (data_inicio !== undefined) {
    const inicio = lerData(data_inicio);
    const fim = lerData(data_fim);
    if (!inicio || !fim) return { erro: "Datas inválidas (use AAAA-MM-DD)" };
    // data_fim só com a data vale até o ÚLTIMO instante do dia
    if (SO_DATA.test(data_fim.trim())) fim.setHours(23, 59, 59, 999);
    if (fim < inicio)
      return { erro: "data_fim não pode ser anterior a data_inicio" };
    filtros.data_inicio = inicio;
    filtros.data_fim = fim;
  }
  return { filtros };
}

module.exports = { lerFiltrosMovimentacao };
