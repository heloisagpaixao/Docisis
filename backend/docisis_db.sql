CREATE DATABASE IF NOT EXISTS docisis_db;
USE docisis_db;

-- ===========================
-- CARGOS
-- ===========================
CREATE TABLE cargos (
    id_cargo INT AUTO_INCREMENT PRIMARY KEY,
    permissoes BOOLEAN NOT NULL
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
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
-- ESTOQUE
-- ===========================
CREATE TABLE estoque (
    id_estoque INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    CONSTRAINT fk_estoque_lote FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- ===========================
-- DADOS INICIAIS
-- ===========================
INSERT INTO cargos (id_cargo, permissoes) VALUES 
(1, true), 
(2, true), 
(3, false);