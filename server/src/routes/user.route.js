const { Router } = require("express");
const { createUser, updateUser, toggleUserStatus, getUsers, getUserDetails } = require("../controllers/user.controller");
const requireAuth = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validator.middleware");
const { createUserValidator, updateUserValidator, toggleUserStatusValidator } = require("../utils/validators");

const userRouter = Router();

userRouter.get("/", requireAuth, getUsers);
userRouter.post("/", requireAuth, validate(createUserValidator), createUser);
userRouter.put("/:id", requireAuth, validate(updateUserValidator), updateUser);
userRouter.get("/:id/details", requireAuth, getUserDetails);
userRouter.patch("/:id/toggle-status", requireAuth, validate(toggleUserStatusValidator), toggleUserStatus);

module.exports = userRouter;