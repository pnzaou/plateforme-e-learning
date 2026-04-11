const { Router } = require("express");
const requireAuth = require("../middlewares/auth.middleware");
const {
  getFilieres,
  createFiliere,
  updateFiliere,
  toggleFiliereStatus,
} = require("../controllers/filiere.controller");
const filiereRouter = Router();

filiereRouter.get("/", requireAuth, getFilieres);
filiereRouter.post("/", requireAuth, createFiliere);
filiereRouter.put("/:id", requireAuth, updateFiliere);
filiereRouter.patch("/:id/toggle-status", requireAuth, toggleFiliereStatus);

module.exports = filiereRouter;
