const { Router } = require("express");
const requireAuth = require("../middlewares/auth.middleware");
const {
  getNiveaux,
  createNiveau,
  updateNiveau,
  deleteNiveau,
} = require("../controllers/niveau.controller");
const niveauRouter = Router();

niveauRouter.get("/", requireAuth, getNiveaux);
niveauRouter.post("/", requireAuth, createNiveau);
niveauRouter.put("/:id", requireAuth, updateNiveau);
niveauRouter.delete("/:id", requireAuth, deleteNiveau);

module.exports = niveauRouter;
