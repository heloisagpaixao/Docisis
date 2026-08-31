-- Adiciona a coluna de senha (hash bcrypt) na tabela funcionarios.
-- Depois de rodar, é preciso definir uma senha (hasheada) para cada
-- funcionário já existente — enquanto o campo estiver vazio, ninguém
-- consegue logar com aquele usuário (comportamento seguro por padrão).

ALTER TABLE funcionarios
  ADD COLUMN senha VARCHAR(255) NOT NULL DEFAULT '' AFTER email;
