require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../src/config/database");

(async () => {
  const [nome, email, cpf, telefone, senha] = process.argv.slice(2);
  if (!nome || !email || !cpf || !telefone || !senha) {
    console.log(
      'Uso: node scripts/criar-admin.js "Nome" email cpf telefone senha',
    );
    process.exit(1);
  }
  const hash = await bcrypt.hash(senha, 10);
  await pool.query(
    `INSERT INTO funcionarios (nome, cpf, email, senha, telefone, id_cargo)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [nome, cpf, email, hash, telefone],
  );
  console.log("Líder criado com sucesso.");
  await pool.end();
})().catch(async (e) => {
  console.error(e.message);
  await pool.end();
  process.exit(1);
});
