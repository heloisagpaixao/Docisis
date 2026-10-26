// Erros do MySQL que viram respostas HTTP claras
const ERROS_MYSQL = {
  ER_ROW_IS_REFERENCED_2: [
    409,
    "Registro possui vínculos e não pode ser excluído",
  ],
  ER_NO_REFERENCED_ROW_2: [400, "Registro relacionado não existe"],
  ER_TRUNCATED_WRONG_VALUE: [400, "Valor inválido"],
  ER_WRONG_VALUE: [400, "Valor inválido"],
  ER_DATA_TOO_LONG: [400, "Valor longo demais para o campo"],
  ER_BAD_NULL_ERROR: [400, "Campo obrigatório não informado"],
};

// Último middleware do server.js: toda falha da API passa por aqui.
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  // JSON malformado no corpo da requisição
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ erro: "JSON inválido no corpo da requisição" });
  }

  // Erros lançados de propósito pelos repositories/services: { status, mensagem }
  if (err.status && err.mensagem) {
    return res.status(err.status).json({ erro: err.mensagem });
  }

  // Valor único repetido (CPF, e-mail, código...)
  if (err.code === "ER_DUP_ENTRY") {
    const m = /for key '([^']+)'/.exec(err.sqlMessage || "");
    const campo = m ? m[1].split(".").pop() : null;
    return res
      .status(409)
      .json({
        erro: campo
          ? `Já existe um registro com este ${campo}`
          : "Registro duplicado",
      });
  }

  const conhecido = ERROS_MYSQL[err.code];
  if (conhecido) return res.status(conhecido[0]).json({ erro: conhecido[1] });

  console.error(err);
  res.status(500).json({ erro: "Erro interno do servidor" });
};
