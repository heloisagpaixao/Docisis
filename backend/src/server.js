require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/database");
const errorHandler = require("./middlewares/errorHandler");

// 1. IMPORTAR SWAGGER
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger_output.json"); // Ajuste o caminho para o seu arquivo de documentação

const app = express();
app.disable("x-powered-by");
app.use(cors({ exposedHeaders: ["Content-Disposition"] }));
app.use(express.json());

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.get("/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS cargos FROM cargos");
    res.json({ status: "ok", cargos: rows[0].cargos });
  } catch (err) {
    res.status(500).json({ status: "erro", mensagem: err.message });
  }
});

// Rotas da API
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
app.use("/movimentacoes", require("./routes/movimentacoes.routes"));
app.use("/notificacoes", require("./routes/notificacoes.routes"));
app.use("/relatorios", require("./routes/relatorios.routes"));

// 2. ADICIONAR A ROTA DO SWAGGER AQUI (ANTES DO 404)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rota inexistente (mantenha sempre depois de todas as rotas válidas)
app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada" }));

// SEMPRE por último
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🧁 Docisis API rodando na porta ${PORT}!`);
  require("./services/notificacoes.service").iniciarRotina();
  require("./services/auth.service").iniciarLimpeza();
});
