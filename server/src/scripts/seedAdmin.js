// src/scripts/seedAdmin.js

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { User } = require("../models");

const seedAdmin = async () => {
  try {
    console.log(process.env.MONGODB_URI)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connecté");

    const adminExistant = await User.findOne({ role: "admin" });

    if (adminExistant) {
      console.log("⚠️  Un admin existe déjà :", adminExistant.email);
      process.exit(0);
    }

    const motDePasse = await bcrypt.hash("Passer@123", 12);

    const admin = await User.create({
      nom: process.env.ADMIN_NOM || "Perrin",
      prenom: process.env.ADMIN_PRENOM || "Emmanuel",
      email: process.env.ADMIN_EMAIL || "emmanuelnzaou@gmail.com",
      motDePasse,
      role: "admin",
      estActif: true,
    });

    console.log("🎉 Admin créé avec succès !");
    console.log(`   Nom    : ${admin.nomComplet}`);
    console.log(`   Email  : ${admin.email}`);
    console.log(`   Rôle   : ${admin.role}`);
    console.log("⚠️  Pensez à changer le mot de passe par défaut !");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seed :", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();