CREATE DATABASE IF NOT EXISTS docisis_db;
USE docisis_db;

-- ===========================
-- CARGOS
-- ===========================
CREATE TABLE cargos (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    permissoes BOOLEAN NOT NULL,
    id_funcionario INT NOT NULL
);

-- ===========================
-- FUNCIONÁRIOS
-- ===========================
CREATE TABLE funcionarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    id_cargo INT NOT NULL,
    foto_perfil VARCHAR(255) NULL,
    senha VARCHAR(255) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    alterado_em DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ===========================
-- LOTES
-- ===========================
CREATE TABLE lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quantidade INT NOT NULL,
    materia_prima VARCHAR(100) NOT NULL,
    dt_validade DATE NOT NULL,
    id_nota INT NOT NULL,
    alterado_em DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ===========================
-- NOTA FISCAL
-- ===========================
CREATE TABLE nota_fiscal (
    id_nota INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    dt_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fornecedor VARCHAR(50) NOT NULL,
    quantidade INT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- ENTRADAS
-- ===========================
CREATE TABLE entradas (
    id_entrada INT AUTO_INCREMENT PRIMARY KEY,
    dt_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_funcionario INT NOT NULL,
    id_lote INT NOT NULL,
    motivo VARCHAR(100) NOT NULL
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
    motivo VARCHAR(100) NOT NULL
);

-- ===========================
-- ESTOQUE
-- ===========================
CREATE TABLE estoque (
    id_estoque INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL
);

-- ==========================================
-- FOREIGN KEYS
-- ==========================================

-- Funcionários -> Cargos
ALTER TABLE funcionarios
ADD CONSTRAINT fk_funcionario_cargo
FOREIGN KEY (id_cargo)
REFERENCES cargos(id_cargo);

-- Cargos -> Funcionários
ALTER TABLE cargos
ADD CONSTRAINT fk_cargo_funcionario
FOREIGN KEY (id_funcionario)
REFERENCES funcionarios(id);

-- Nota Fiscal -> Lotes
ALTER TABLE nota_fiscal
ADD CONSTRAINT fk_nota_lote
FOREIGN KEY (id_lote)
REFERENCES lotes(id);

-- Lotes -> Nota Fiscal
ALTER TABLE lotes
ADD CONSTRAINT fk_lote_nota
FOREIGN KEY (id_nota)
REFERENCES nota_fiscal(id_nota);

-- Entradas -> Funcionários
ALTER TABLE entradas
ADD CONSTRAINT fk_entrada_funcionario
FOREIGN KEY (id_funcionario)
REFERENCES funcionarios(id);

-- Entradas -> Lotes
ALTER TABLE entradas
ADD CONSTRAINT fk_entrada_lote
FOREIGN KEY (id_lote)
REFERENCES lotes(id);

-- Saídas -> Funcionários
ALTER TABLE saidas
ADD CONSTRAINT fk_saida_funcionario
FOREIGN KEY (id_funcionario)
REFERENCES funcionarios(id);

-- Saídas -> Lotes
ALTER TABLE saidas
ADD CONSTRAINT fk_saida_lote
FOREIGN KEY (id_lote)
REFERENCES lotes(id);

-- Estoque -> Lotes
ALTER TABLE estoque
ADD CONSTRAINT fk_estoque_lote
FOREIGN KEY (id_lote)
REFERENCES lotes(id);