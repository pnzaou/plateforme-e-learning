const { connect } = require("mongoose")
const MONGODB_URI = process.env.MONGODB_URI;

module.exports = dbConnection = async () => {
    try {
        if(!MONGODB_URI) {
            throw new Error("Veuillez fournir une uri pour la connexion.")
        }
        const conn = await connect(MONGODB_URI)
        console.log("Coonexion à la bd réussie")
    } catch (error) {
        console.log(error)
        throw new Error("Erreur de connexion à MongoDB")
    }
}