-- =====================================================================
-- DOCISIS - Migração v4 (refresh token)
-- Rode UMA vez, depois da migracao_v3.sql. Não apaga dados.
-- =====================================================================
SET NAMES utf8mb4;
USE docisis_oficial_db;

-- Cada login cria uma "família" de refresh tokens (uma sessão). A cada renovação o
-- token usado é revogado e um novo nasce na MESMA família. Se um token já usado
-- aparecer de novo (possível roubo), a família inteira é revogada.
-- O token em si NUNCA é gravado: só o hash SHA-256 dele. Se o banco vazar, os
-- tokens não podem ser usados.
CREATE TABLE refresh_tokens (
    id_refresh INT AUTO_INCREMENT PRIMARY KEY,
    id_funcionario INT NOT NULL,
    familia CHAR(36) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expira_em DATETIME NOT NULL,
    revogado_em DATETIME NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_funcionario FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id) ON DELETE CASCADE
);
CREATE INDEX idx_refresh_familia ON refresh_tokens(familia);
CREATE INDEX idx_refresh_funcionario ON refresh_tokens(id_funcionario);
CREATE INDEX idx_refresh_expira ON refresh_tokens(expira_em);
