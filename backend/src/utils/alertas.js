/** Quantos dias antes do vencimento um lote passa a ser "a vencer" (padrão 7, como nas notificações). */
const diasAlertaValidade = () =>
  Number(process.env.NOTIFICACOES_DIAS_VALIDADE) || 7;

/** VENCIDO, VENCE_EM_BREVE ou OK, a partir dos dias que faltam para a validade. */
function situacaoDaValidade(diasParaVencer, diasAlerta = diasAlertaValidade()) {
  if (diasParaVencer < 0) return "VENCIDO";
  if (diasParaVencer <= diasAlerta) return "VENCE_EM_BREVE";
  return "OK";
}

module.exports = { diasAlertaValidade, situacaoDaValidade };
