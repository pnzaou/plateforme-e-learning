const {Router} = require("express");
const { generateUploadSignature } = require("../controllers/contenu.controller");
const requireAuth = require("../middlewares/auth.middleware");
const uploadRouter = Router();

uploadRouter.post("/signature", requireAuth, generateUploadSignature);

module.exports = uploadRouter;