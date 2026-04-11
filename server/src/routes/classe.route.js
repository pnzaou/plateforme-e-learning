const { Router } = require("express");
const requireAuth = require("../middlewares/auth.middleware");
const {
  getClasses,
  createClasse,
  updateClasse,
  deleteClasse,
} = require("../controllers/classe.controller");
const classeRouter = Router();

classeRouter.get("/", requireAuth, getClasses);
classeRouter.post("/", requireAuth, createClasse);
classeRouter.put("/:id", requireAuth, updateClasse);
classeRouter.delete("/:id", requireAuth, deleteClasse);

module.exports = classeRouter;
