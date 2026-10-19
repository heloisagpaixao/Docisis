-- =====================================================================
-- DOCISIS - Banco de dados (MySQL)
--
-- ORDEM DE CRIAÇÃO (sem dependência circular, as setas vão sempre
-- das tabelas "filhas" para as "pais"):
--
--   cargos, permissoes, nota_fiscal, produtos   (não dependem de ninguém)
--        |
--        +-- cargo_permissoes  -> cargos, permissoes
--        +-- funcionarios      -> cargos
--        +-- lotes             -> nota_fiscal
--                |
--                +-- entradas, saidas, ajustes -> funcionarios, lotes
--                +-- estoque                   -> lotes
-- =====================================================================

CREATE DATABASE IF NOT EXISTS docisis_oficial_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE docisis_oficial_db;

-- ===========================
-- CARGOS (agora com nome)
-- ===========================
CREATE TABLE cargos (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

-- ===========================
-- PERMISSÕES (identificadas por nome, ex.: LOTE_CADASTRAR)
-- ===========================
CREATE TABLE permissoes (
    id_permissao INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(150) DEFAULT NULL
);

-- ===========================
-- CARGO x PERMISSÃO (relação N:N)
-- O cargo NÃO aponta para funcionário; só o funcionário aponta
-- para o cargo. É isso que evita o ciclo.
-- ===========================
CREATE TABLE cargo_permissoes (
    id_cargo INT NOT NULL,
    id_permissao INT NOT NULL,
    PRIMARY KEY (id_cargo, id_permissao),
    CONSTRAINT fk_cp_cargo FOREIGN KEY (id_cargo) REFERENCES cargos(id_cargo) ON DELETE CASCADE,
    CONSTRAINT fk_cp_permissao FOREIGN KEY (id_permissao) REFERENCES permissoes(id_permissao) ON DELETE CASCADE
);

-- ===========================
-- FUNCIONÁRIOS
-- ===========================
CREATE TABLE funcionarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    id_cargo INT NOT NULL,
    foto_perfil VARCHAR(255) DEFAULT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_funcionario_cargo FOREIGN KEY (id_cargo) REFERENCES cargos(id_cargo)
);

-- ===========================
-- PRODUTOS
-- ===========================
CREATE TABLE produtos (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    dt_validade DATE NOT NULL,
    codigo INT NOT NULL UNIQUE,
    peso DECIMAL(8,2),
    imagem VARCHAR(255) DEFAULT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    alterado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===========================
-- NOTA FISCAL
-- ===========================
CREATE TABLE nota_fiscal (
    id_nota INT AUTO_INCREMENT PRIMARY KEY,
    dt_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fornecedor VARCHAR(50) NOT NULL,
    quantidade INT NOT NULL,
    arquivo VARCHAR(255) DEFAULT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- LOTES (o lote aponta para a nota; a nota NÃO aponta para o lote)
-- ===========================
CREATE TABLE lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quantidade INT NOT NULL,
    materia_prima VARCHAR(100) NOT NULL,
    dt_validade DATE NOT NULL,
    id_nota INT NOT NULL,
    alterado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lote_nota FOREIGN KEY (id_nota) REFERENCES nota_fiscal(id_nota)
);

-- ===========================
-- ENTRADAS
-- ===========================
CREATE TABLE entradas (
    id_entrada INT AUTO_INCREMENT PRIMARY KEY,
    dt_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_funcionario INT NOT NULL,
    id_lote INT NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    CONSTRAINT fk_entrada_funcionario FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id),
    CONSTRAINT fk_entrada_lote FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- ===========================
-- SAÍDAS
-- ===========================
CREATE TABLE saidas (
    id_saida INT AUTO_INCREMENT PRIMARY KEY,
    dt_saida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_funcionario INT NOT NULL,
    id_lote INT NOT NULL,
    quantidade INT NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    CONSTRAINT fk_saida_funcionario FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id),
    CONSTRAINT fk_saida_lote FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- ===========================
-- AJUSTES
-- ===========================
CREATE TABLE ajustes (
    id_ajuste INT AUTO_INCREMENT PRIMARY KEY,
    dt_ajuste DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_funcionario INT NOT NULL,
    id_lote INT NOT NULL,
    quantidade_anterior INT NOT NULL,
    quantidade_nova INT NOT NULL,
    quantidade_ajuste INT NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    CONSTRAINT fk_ajuste_funcionario FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id),
    CONSTRAINT fk_ajuste_lote FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- ===========================
-- ESTOQUE
-- ===========================
CREATE TABLE estoque (
    id_estoque INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    CONSTRAINT fk_estoque_lote FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- ===========================
-- ÍNDICES DE PERFORMANCE
-- ===========================
CREATE INDEX idx_lotes_quantidade_validade ON lotes(quantidade, dt_validade);
CREATE INDEX idx_entradas_dt_entrada ON entradas(dt_entrada);
CREATE INDEX idx_entradas_lote ON entradas(id_lote);
CREATE INDEX idx_entradas_funcionario ON entradas(id_funcionario);
CREATE INDEX idx_saidas_dt_saida ON saidas(dt_saida);
CREATE INDEX idx_saidas_lote ON saidas(id_lote);
CREATE INDEX idx_saidas_funcionario ON saidas(id_funcionario);
CREATE INDEX idx_ajustes_lote ON ajustes(id_lote);

-- ===========================
-- VIEW: permissões de cada funcionário, por nome
-- ===========================
CREATE VIEW vw_permissoes_funcionario AS
SELECT f.id AS id_funcionario,
       f.nome AS funcionario,
       c.nome AS cargo,
       p.nome AS permissao
FROM funcionarios f
JOIN cargos c            ON c.id_cargo = f.id_cargo
JOIN cargo_permissoes cp ON cp.id_cargo = c.id_cargo
JOIN permissoes p        ON p.id_permissao = cp.id_permissao;

-- ===========================
-- DADOS INICIAIS
-- ===========================

-- Os ids 1, 2 e 3 são os mesmos do script antigo (1 e 2 eram "true", 3 era "false")
INSERT INTO cargos (id_cargo, nome) VALUES
(1, 'Líder'),
(2, 'Responsável do Setor'),
(3, 'Estoquista');

INSERT INTO permissoes (nome, descricao) VALUES
('PRODUTO_GERENCIAR',     'Cadastrar, editar e excluir produtos'),
('LOTE_GERENCIAR',        'Cadastrar e editar lotes'),
('NOTA_FISCAL_REGISTRAR', 'Registrar notas fiscais'),
('ENTRADA_REGISTRAR',     'Registrar entrada de produtos'),
('SAIDA_REGISTRAR',       'Registrar saída de produtos'),
('AJUSTE_REGISTRAR',      'Registrar ajustes de estoque'),
('ESTOQUE_CONSULTAR',     'Consultar o estoque'),
('NOTIFICACAO_CONSULTAR', 'Ver alertas de validade e de estoque'),
('RELATORIO_GERAR',       'Gerar relatórios e exportar XLSX'),
('FUNCIONARIO_GERENCIAR', 'Cadastrar, editar e excluir funcionários'),
('CARGO_GERENCIAR',       'Alterar cargos e permissões');

-- Líder: todas as permissões
INSERT INTO cargo_permissoes (id_cargo, id_permissao)
SELECT c.id_cargo, p.id_permissao
FROM cargos c CROSS JOIN permissoes p
WHERE c.nome = 'Líder';

-- Responsável do Setor: tudo, menos gerenciar funcionários e cargos
INSERT INTO cargo_permissoes (id_cargo, id_permissao)
SELECT c.id_cargo, p.id_permissao
FROM cargos c CROSS JOIN permissoes p
WHERE c.nome = 'Responsável do Setor'
  AND p.nome NOT IN ('FUNCIONARIO_GERENCIAR', 'CARGO_GERENCIAR');

-- Estoquista: operação do dia a dia
INSERT INTO cargo_permissoes (id_cargo, id_permissao)
SELECT c.id_cargo, p.id_permissao
FROM cargos c CROSS JOIN permissoes p
WHERE c.nome = 'Estoquista'
  AND p.nome IN ('ESTOQUE_CONSULTAR', 'ENTRADA_REGISTRAR', 'SAIDA_REGISTRAR', 'NOTIFICACAO_CONSULTAR');