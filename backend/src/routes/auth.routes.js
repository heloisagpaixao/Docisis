const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const authController = require("../controllers/auth.controller");

router.post("/login", asyncHandler(authController.login));

module.exports = router;
