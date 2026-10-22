require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/database");
const errorHandler = require("./middlewares/errorHandler");

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
app.use("/notasfiscais", require("./routes/notasfiscais.routes"));
app.use("/lotes", require("./routes/lotes.routes"));
app.use("/entradas", require("./routes/entradas.routes"));
app.use("/saidas", require("./routes/saidas.routes"));
app.use("/ajustes", require("./routes/ajustes.routes"));
app.use("/estoque", require("./routes/estoque.routes"));

// Rota inexistente
app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada" }));

// SEMPRE por último
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🧁 Docisis API rodando na porta ${PORT}!`));
