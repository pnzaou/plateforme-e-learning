const { Router } = require("express");
const requireAuth = require("../middlewares/auth.middleware");
const {
  updateChapitre,
  togglePublication,
  deleteChapitre,
} = require("../controllers/chapitre.controller");
const { getContenusByChapitre, createContenu, reorderContenus } = require("../controllers/contenu.controller");
const chapterRouter = Router();

chapterRouter.put("/:id", requireAuth, updateChapitre);
chapterRouter.patch("/:id/toggle-publication", requireAuth, togglePublication);
chapterRouter.delete("/:id", requireAuth, deleteChapitre);

chapterRouter.get("/:chapitreId/contenus", requireAuth, getContenusByChapitre);
chapterRouter.post("/:chapitreId/contenus", requireAuth, createContenu);
chapterRouter.patch("/:chapitreId/contenus/reorder", requireAuth, reorderContenus);

module.exports = chapterRouter;