const app = require("./app");
const dbConnection = require("./config/db")

const PORT = process.env.PORT;

app.get("/", (req, rep) => {
  return rep
    .status(200)
    .json({ message: "Hello API!", success: true, error: false });
});

dbConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur in running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("Erreur lors de la connexion à la bd", err));
