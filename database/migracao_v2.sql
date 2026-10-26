-- =====================================================================
-- DOCISIS - Migração v2
-- Alinha o banco aos repositories (lotes por produto e entradas com quantidade).
-- Rode UMA vez, no banco que você já criou (docisis_db), sem apagar nada.
--
-- ATENÇÃO: a tabela `lotes` precisa estar VAZIA. Como o módulo de lotes ainda
-- não foi construído, isso deve ser verdade. Se já houver lotes, o passo 1
-- falha de propósito (não dá para adivinhar de qual produto cada lote é).
-- =====================================================================
SET NAMES utf8mb4;
USE docisis_oficial_db;
 
-- 1) LOTES: passa a apontar para PRODUTOS (a matéria-prima em texto livre sai)
ALTER TABLE lotes
  ADD COLUMN id_produto INT NULL AFTER quantidade,
  ADD CONSTRAINT fk_lote_produto FOREIGN KEY (id_produto) REFERENCES produtos(id_produto);
 
ALTER TABLE lotes DROP COLUMN materia_prima;
ALTER TABLE lotes MODIFY id_produto INT NOT NULL;
 
-- 2) ENTRADAS: passa a registrar QUANTAS unidades entraram (RF003)
ALTER TABLE entradas
  ADD COLUMN quantidade INT NOT NULL AFTER id_lote;
 
-- 3) PRODUTOS: a validade pertence ao LOTE (cada compra vence numa data).
--    Deixamos a coluna opcional por enquanto, para o módulo de produtos
--    atual continuar funcionando. Quando a documentação confirmar, podemos
--    removê-la com:  ALTER TABLE produtos DROP COLUMN dt_validade;
ALTER TABLE produtos MODIFY dt_validade DATE NULL;
 