const pool = require("../config/database");

// Todas as comparações de data usam o relógio do BANCO (NOW()), nunca o do Node,
// para não haver divergência de fuso horário entre os dois.
class RefreshTokenRepository {
  async criar({ id_funcionario, familia, token_hash, dias }) {
    await pool.query(
      `INSERT INTO refresh_tokens (id_funcionario, familia, token_hash, expira_em)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [id_funcionario, familia, token_hash, dias],
    );
  }

  async findByHash(token_hash) {
    const [rows] = await pool.query(
      `SELECT id_refresh, id_funcionario, familia, revogado_em,
              (expira_em <= NOW()) AS expirado,
              TIMESTAMPDIFF(SECOND, revogado_em, NOW()) AS segundos_revogado
       FROM refresh_tokens
       WHERE token_hash = ?`,
      [token_hash],
    );
    const r = rows[0];
    return r && { ...r, expirado: Boolean(r.expirado) };
  }

  /**
   * Revoga o token SOMENTE se ele ainda estiver ativo (operação atômica).
   * Se duas requisições tentarem usar o mesmo token ao mesmo tempo, só uma vence.
   */
  async revogarSeAtivo(token_hash) {
    const [result] = await pool.query(
      `UPDATE refresh_tokens SET revogado_em = NOW()
       WHERE token_hash = ? AND revogado_em IS NULL AND expira_em > NOW()`,
      [token_hash],
    );
    return result.affectedRows === 1;
  }

  /** Encerra a sessão inteira (todos os tokens da família). */
  async revogarFamilia(familia) {
    const [result] = await pool.query(
      "UPDATE refresh_tokens SET revogado_em = NOW() WHERE familia = ? AND revogado_em IS NULL",
      [familia],
    );
    return result.affectedRows;
  }

  /** Encerra TODAS as sessões do funcionário (todos os dispositivos). */
  async revogarTodosDoFuncionario(id_funcionario) {
    const [result] = await pool.query(
      "UPDATE refresh_tokens SET revogado_em = NOW() WHERE id_funcionario = ? AND revogado_em IS NULL",
      [id_funcionario],
    );
    return result.affectedRows;
  }

  /** Apaga os já vencidos há mais de um dia (não servem mais nem para auditoria). */
  async limparExpirados() {
    const [result] = await pool.query(
      "DELETE FROM refresh_tokens WHERE expira_em < DATE_SUB(NOW(), INTERVAL 1 DAY)",
    );
    return result.affectedRows;
  }
}

module.exports = new RefreshTokenRepository();
