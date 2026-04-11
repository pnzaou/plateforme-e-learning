const { Router } = require("express");
const moduleRouter = Router();
const requireAuth = require("../middlewares/auth.middleware");
const {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  soumettrePourRevision,
  approuverModule,
  rejeterModule,
  archiverModule,
  deleteModule,
} = require("../controllers/module.controller");
const { getChapitresByModule, createChapitre, reorderChapitres } = require("../controllers/chapitre.controller");

moduleRouter.get("/", requireAuth, getModules);
moduleRouter.get("/:id", requireAuth, getModuleById);
moduleRouter.post("/", requireAuth, createModule);
moduleRouter.put("/:id", requireAuth, updateModule);
moduleRouter.patch("/:id/soumettre", requireAuth, soumettrePourRevision);
moduleRouter.patch("/:id/approuver", requireAuth, approuverModule);
moduleRouter.patch("/:id/rejeter", requireAuth, rejeterModule);
moduleRouter.patch("/:id/archiver", requireAuth, archiverModule);
moduleRouter.delete("/:id", requireAuth, deleteModule);
moduleRouter.get("/:moduleId/chapitres", requireAuth, getChapitresByModule);
moduleRouter.post("/:moduleId/chapitres", requireAuth, createChapitre);
moduleRouter.patch("/:moduleId/chapitres/reorder", requireAuth, reorderChapitres);

module.exports = moduleRouter;
