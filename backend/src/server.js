require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/database");
const autenticar = require("./middlewares/auth");
const exigirPermissao = require("./middlewares/permissao");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS cargos FROM cargos");
    res.json({ status: "ok", cargos: rows[0].cargos });
  } catch (err) {
    res.status(500).json({ status: "erro", mensagem: err.message });
  }
});

app.use("/auth", require("./routes/auth.routes"));
app.use("/funcionarios", require("./routes/funcionarios.routes"));
app.use("/cargos", require("./routes/cargos.routes"));
app.use("/produtos", require("./routes/produtos.routes"));

app.listen(process.env.PORT || 3000, () =>
  console.log(`Docisis API rodando na porta ${process.env.PORT || 3000}!`),
);
