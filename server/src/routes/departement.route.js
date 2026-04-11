const { Router } = require("express");
const requireAuth = require("../middlewares/auth.middleware");
const {
  getDepartements,
  createDepartement,
  updateDepartement,
  toggleDepartementStatus,
} = require("../controllers/departement.controller");
const departementRouter = Router();

departementRouter.get("/", requireAuth, getDepartements);
departementRouter.post("/", requireAuth, createDepartement);
departementRouter.put("/:id", requireAuth, updateDepartement);
departementRouter.patch(
  "/:id/toggle-status",
  requireAuth,
  toggleDepartementStatus,
);

module.exports = departementRouter;
