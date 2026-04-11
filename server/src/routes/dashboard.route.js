const { Router } = require("express");
const requireAuth = require("../middlewares/auth.middleware");
const {
  isAdmin,
  isTeacher,
  isStudent,
} = require("../middlewares/role.middleware");
const {
  getAdminDashboard,
  getTeacherDashboard,
} = require("../controllers/dashboard.controller");
const dashboardRouter = Router();

dashboardRouter.get("/admin", requireAuth, isAdmin, getAdminDashboard);
dashboardRouter.get("/teacher", requireAuth, isTeacher, getTeacherDashboard);

module.exports = dashboardRouter;
