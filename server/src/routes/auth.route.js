const { Router } = require("express");
const validate = require("../middlewares/validator.middleware");
const {
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require("../utils/validators");
const {
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  changedPassword,
} = require("../controllers/auth.controller");
const requireAuth = require("../middlewares/auth.middleware");

const authRouter = Router();

authRouter.get("/me", requireAuth, getMe);
authRouter.post("/logout", requireAuth, logout);
authRouter.post("/login", validate(loginValidator), login);

authRouter.post(
  "/forgot-password",
  validate(forgotPasswordValidator),
  forgotPassword,
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordValidator),
  resetPassword,
);
authRouter.post(
  "/change-password",
  validate(changePasswordValidator),
  requireAuth,
  changedPassword,
);

module.exports = authRouter;