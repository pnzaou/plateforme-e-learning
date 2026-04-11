const { Router } = require("express");
const authRouter = require("./auth.route");
const dashboardRouter = require("./dashboard.route");
const userRouter = require("./user.route");
const departementRouter = require("./departement.route");
const filiereRouter = require("./filiere.route");
const niveauRouter = require("./niveau.route");
const classeRouter = require("./classe.route");
const moduleRouter = require("./module.route");
const chapterRouter = require("./chapitres.route");
const contenuRouter = require("./contenus.route");
const uploadRouter = require("./upload.route");

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/users", userRouter);
appRouter.use("/dashboard", dashboardRouter);
appRouter.use("/departements", departementRouter);
appRouter.use("/filieres", filiereRouter);
appRouter.use("/niveaux", niveauRouter);
appRouter.use("/classes", classeRouter)
appRouter.use("/modules", moduleRouter)
appRouter.use("/chapitres", chapterRouter)
appRouter.use("/contenus", contenuRouter)
appRouter.use("/upload", uploadRouter)

module.exports = appRouter;