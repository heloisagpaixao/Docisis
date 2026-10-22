const notificacaoRepository = require("../repositories/notificacoes.repository");

const TIPOS = [
  "VENCIDO",
  "VENCIMENTO_PROXIMO",
  "ESTOQUE_ZERADO",
  "ESTOQUE_BAIXO",
  "ESTOQUE_EXCESSO",
];
const SEVERIDADES = ["INFO", "ATENCAO", "CRITICA"];

const erro = (status, mensagem) => ({ status, mensagem });

// Quantos dias antes do vencimento o alerta começa (padrão 7, como no TC-NOTIF-01)
const diasAlertaValidade = () =>
  Number(process.env.NOTIFICACOES_DIAS_VALIDADE) || 7;

const unidades = (n) => `${n} ${n === 1 ? "unidade" : "unidades"}`;
const quando = (dias) =>
  dias === 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`;

/**
 * Transforma o estado atual do estoque numa lista de SITUAÇÕES de alerta.
 * Cada situação tem uma chave única (ex.: "VENCIDO:L12"), usada para não duplicar.
 */
function montarSituacoes(lotes, produtos) {
  const situacoes = [];

  for (const l of lotes) {
    const base = { id_lote: l.id, id_produto: l.id_produto };
    if (l.dias < 0) {
      situacoes.push({
        ...base,
        chave: `VENCIDO:L${l.id}`,
        tipo: "VENCIDO",
        severidade: "CRITICA",
        mensagem: `Lote ${l.id} de "${l.produto_nome}" venceu em ${l.validade} e ainda tem ${unidades(l.quantidade)} em estoque.`,
      });
    } else {
      situacoes.push({
        ...base,
        chave: `VENCIMENTO_PROXIMO:L${l.id}`,
        tipo: "VENCIMENTO_PROXIMO",
        severidade: "ATENCAO",
        mensagem: `Lote ${l.id} de "${l.produto_nome}" vence ${quando(l.dias)} (${l.validade}); saldo: ${l.quantidade}.`,
      });
    }
  }

  for (const p of produtos) {
    const base = { id_produto: p.id_produto };
    const { saldo, estoque_minimo: min, estoque_maximo: max } = p;

    if (min !== null && saldo === 0) {
      situacoes.push({
        ...base,
        chave: `ESTOQUE_ZERADO:P${p.id_produto}`,
        tipo: "ESTOQUE_ZERADO",
        severidade: "CRITICA",
        mensagem: `"${p.nome}" está sem estoque utilizável (mínimo: ${min}).`,
      });
    } else if (min !== null && saldo <= min) {
      situacoes.push({
        ...base,
        chave: `ESTOQUE_BAIXO:P${p.id_produto}`,
        tipo: "ESTOQUE_BAIXO",
        severidade: "ATENCAO",
        mensagem: `"${p.nome}" com estoque baixo: ${saldo} (mínimo: ${min}).`,
      });
    }
    if (max !== null && saldo > max) {
      situacoes.push({
        ...base,
        chave: `ESTOQUE_EXCESSO:P${p.id_produto}`,
        tipo: "ESTOQUE_EXCESSO",
        severidade: "INFO",
        mensagem: `"${p.nome}" acima do máximo: ${saldo} (máximo: ${max}).`,
      });
    }
  }

  return situacoes.map((s) => ({ ...s, mensagem: s.mensagem.slice(0, 255) }));
}

/**
 * Compara o estoque de agora com os alertas ativos:
 *  - situação nova           -> cria o alerta
 *  - situação que continua   -> só atualiza o texto (ex.: o saldo mudou)
 *  - situação que terminou   -> resolve o alerta (vira histórico)
 */
async function executarVerificacao() {
  const [lotes, produtos, ativas] = await Promise.all([
    notificacaoRepository.findLotesComValidade(diasAlertaValidade()),
    notificacaoRepository.findSaldosPorProduto(),
    notificacaoRepository.findAtivas(),
  ]);

  const situacoes = montarSituacoes(lotes, produtos);
  const chavesAtuais = new Set(situacoes.map((s) => s.chave));
  const chavesAtivas = new Set(ativas.map((a) => a.chave_ativa));

  const resolvidas = await notificacaoRepository.resolver(
    ativas
      .filter((a) => !chavesAtuais.has(a.chave_ativa))
      .map((a) => a.id_notificacao),
  );

  let criadas = 0;
  for (const s of situacoes) {
    if (chavesAtivas.has(s.chave)) {
      await notificacaoRepository.atualizarMensagem(s.chave, s.mensagem);
    } else if (await notificacaoRepository.inserir(s)) {
      criadas++;
    }
  }
  return { criadas, resolvidas, ativas: situacoes.length };
}

// Garante que só UMA verificação roda por vez; pedidos feitos durante ela viram uma nova rodada.
let emExecucao = null;
let rodarDeNovo = false;
let timer = null;

function verificar() {
  if (emExecucao) {
    rodarDeNovo = true;
    return emExecucao;
  }
  emExecucao = executarVerificacao().finally(() => {
    emExecucao = null;
    if (rodarDeNovo) {
      rodarDeNovo = false;
      agendarVerificacao();
    }
  });
  return emExecucao;
}

/**
 * Chamada pelos módulos que mudam o estoque (entradas, saídas, ajustes, lotes, produtos).
 * Não espera o resultado e junta vários pedidos seguidos numa verificação só.
 * Uma falha aqui NUNCA derruba a operação que a chamou.
 */
function agendarVerificacao() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    verificar().catch((e) =>
      console.error("Falha ao verificar notificações:", e.message),
    );
  }, 500);
  if (timer.unref) timer.unref();
}

/**
 * Roda uma vez ao ligar o servidor e depois a cada N minutos
 * (NOTIFICACOES_INTERVALO_MIN, padrão 60; use 0 para desligar o agendamento).
 * É isso que faz os alertas de VALIDADE aparecerem com o passar dos dias,
 * mesmo que ninguém mexa no estoque.
 */
function iniciarRotina() {
  const minutos =
    process.env.NOTIFICACOES_INTERVALO_MIN === undefined
      ? 60
      : Number(process.env.NOTIFICACOES_INTERVALO_MIN);

  verificar().catch((e) =>
    console.error("Falha ao verificar notificações:", e.message),
  );
  if (minutos > 0) {
    const intervalo = setInterval(
      () =>
        verificar().catch((e) =>
          console.error("Falha ao verificar notificações:", e.message),
        ),
      minutos * 60 * 1000,
    );
    if (intervalo.unref) intervalo.unref();
  }
}

// ----- consultas -----

const listar = (filtros) => notificacaoRepository.findAll(filtros);
const resumo = (idFuncionario) => notificacaoRepository.resumo(idFuncionario);

async function buscar(id, idFuncionario) {
  const n = await notificacaoRepository.findById(id, idFuncionario);
  if (!n) throw erro(404, "Notificação não encontrada");
  return n;
}

async function marcarLida(id, idFuncionario) {
  await buscar(id, idFuncionario);
  await notificacaoRepository.marcarLida(id, idFuncionario);
  return buscar(id, idFuncionario);
}

async function marcarTodasLidas(idFuncionario) {
  return {
    marcadas: await notificacaoRepository.marcarTodasLidas(idFuncionario),
  };
}

module.exports = {
  TIPOS,
  SEVERIDADES,
  verificar,
  agendarVerificacao,
  iniciarRotina,
  listar,
  resumo,
  buscar,
  marcarLida,
  marcarTodasLidas,
};
