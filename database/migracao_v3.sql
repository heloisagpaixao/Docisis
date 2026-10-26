-- =====================================================================
-- DOCISIS - Migração v3 (notificações)
-- Rode UMA vez, depois da migracao_v2.sql. Não apaga dados.
-- =====================================================================
SET NAMES utf8mb4;
USE docisis_oficial_db;

-- 1) PRODUTOS: estoque mínimo e máximo (opcionais).
--    NULL = o produto não gera alerta de estoque. É o que permite avisar
--    "falta", "escassez" e "excesso" (RF002).
ALTER TABLE produtos
  ADD COLUMN estoque_minimo INT NULL,
  ADD COLUMN estoque_maximo INT NULL;

-- 2) NOTIFICAÇÕES: cada alerta ativo existe UMA vez só.
--    `chave_ativa` identifica a situação (ex.: 'VENCIDO:L12'). Quando a situação
--    termina, a chave vira NULL e a notificação fica como histórico. O índice
--    único em `chave_ativa` impede alertas duplicados, mesmo com verificações
--    simultâneas (o MySQL permite vários NULL em coluna UNIQUE).
CREATE TABLE notificacoes (
    id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('VENCIDO','VENCIMENTO_PROXIMO','ESTOQUE_ZERADO','ESTOQUE_BAIXO','ESTOQUE_EXCESSO') NOT NULL,
    severidade ENUM('INFO','ATENCAO','CRITICA') NOT NULL,
    mensagem VARCHAR(255) NOT NULL,
    id_lote INT NULL,
    id_produto INT NULL,
    chave_ativa VARCHAR(60) NULL,
    criada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolvida_em DATETIME NULL,
    CONSTRAINT uq_notificacao_chave_ativa UNIQUE (chave_ativa),
    CONSTRAINT fk_notificacao_lote FOREIGN KEY (id_lote) REFERENCES lotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_notificacao_produto FOREIGN KEY (id_produto) REFERENCES produtos(id_produto) ON DELETE CASCADE
);
CREATE INDEX idx_notificacoes_resolvida ON notificacoes(resolvida_em);

-- 3) LEITURAS: cada funcionário marca as notificações como lidas por conta própria
--    (se uma pessoa lê, o alerta continua "não lido" para as outras).
CREATE TABLE notificacao_leituras (
    id_notificacao INT NOT NULL,
    id_funcionario INT NOT NULL,
    lida_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_notificacao, id_funcionario),
    CONSTRAINT fk_leitura_notificacao FOREIGN KEY (id_notificacao) REFERENCES notificacoes(id_notificacao) ON DELETE CASCADE,
    CONSTRAINT fk_leitura_funcionario FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id) ON DELETE CASCADE
);
