const { Router } = require("express");
const requireAuth = require("../middlewares/auth.middleware");
const { updateContenu, toggleContenuPublication, deleteContenu } = require("../controllers/contenu.controller");
const contenuRouter = Router();

contenuRouter.put("/:id", requireAuth, updateContenu);
contenuRouter.patch("/:id/toggle-publication", requireAuth, toggleContenuPublication);
contenuRouter.delete("/:id", requireAuth, deleteContenu);

module.exports = contenuRouter;