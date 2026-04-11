const express = require("express");
const { config } = require("dotenv")
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const appRouter = require("./routes")

config()
const app = express()

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}))
app.use(morgan("combined"));

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json())
app.use(cookieParser(process.env.COOKIE_SECRET))

app.use("/api", appRouter)

module.exports = app;