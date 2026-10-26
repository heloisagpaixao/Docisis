const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/produtos.controller");
const { receberImagem } = require("../middlewares/upload");

router.use(autenticar);

// Consultar: todos os cargos têm ESTOQUE_CONSULTAR
router.get("/", exigirPermissao("ESTOQUE_CONSULTAR"), asyncHandler(c.listar));
router.get(
  "/:id",
  exigirPermissao("ESTOQUE_CONSULTAR"),
  asyncHandler(c.buscar),
);

// Alterar: só quem gerencia produtos
router.post("/", exigirPermissao("PRODUTO_GERENCIAR"), asyncHandler(c.criar));
router.put(
  "/:id",
  exigirPermissao("PRODUTO_GERENCIAR"),
  asyncHandler(c.atualizar),
);
router.delete(
  "/:id",
  exigirPermissao("PRODUTO_GERENCIAR"),
  asyncHandler(c.excluir),
);

// Imagem do produto
router.get(
  "/:id/imagem",
  exigirPermissao("ESTOQUE_CONSULTAR"),
  asyncHandler(c.baixarImagem),
);
router.put(
  "/:id/imagem",
  exigirPermissao("PRODUTO_GERENCIAR"),
  receberImagem("imagem"),
  asyncHandler(c.enviarImagem),
);
router.delete(
  "/:id/imagem",
  exigirPermissao("PRODUTO_GERENCIAR"),
  asyncHandler(c.removerImagem),
);

module.exports = router;
