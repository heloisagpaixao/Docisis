const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const pool = require("../config/database");

router.get(
  "/",
  autenticar,
  exigirPermissao("FUNCIONARIO_GERENCIAR"),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT c.id_cargo, c.nome, GROUP_CONCAT(p.nome ORDER BY p.nome) AS permissoes
       FROM cargos c
       LEFT JOIN cargo_permissoes cp ON cp.id_cargo = c.id_cargo
       LEFT JOIN permissoes p ON p.id_permissao = cp.id_permissao
       GROUP BY c.id_cargo, c.nome`,
      );
      res.json(
        rows.map((r) => ({
          ...r,
          permissoes: r.permissoes ? r.permissoes.split(",") : [],
        })),
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  },
);

module.exports = router;
