const { body, param } = require("express-validator");

const ROLES_VALIDES = ["admin", "chef_departement", "enseignant", "etudiant"];

const loginValidator = [
  body("email")
    .trim()
    .isEmail()
    .notEmpty()
    .withMessage("Un email valide est obligatoire."),

  body("motDePasse")
    .trim()
    .notEmpty()
    .withMessage("Le mot de passe est obligatoire.")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères.")
    .matches(/[A-Z]/)
    .withMessage("Le mot de passe doit contenir au moins une majuscule.")
    .matches(/[a-z]/)
    .withMessage("Le mot de passe doit contenir au moins une minuscule.")
    .matches(/[0-9]/)
    .withMessage("Le mot de passe doit contenir au moins un chiffre."),
];

const forgotPasswordValidator = [
  body("email")
    .trim()
    .isEmail()
    .notEmpty()
    .withMessage("Un email valide est obligatoire."),
];

const resetPasswordValidator = [
  body("token")
    .notEmpty()
    .withMessage("Le token est obligatoire.")
    .isString()
    .withMessage("Le token doit être une chaîne de caractères."),

  body("motDePasse")
    .trim()
    .notEmpty()
    .withMessage("Le mot de passe est obligatoire.")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères.")
    .matches(/[A-Z]/)
    .withMessage("Le mot de passe doit contenir au moins une majuscule.")
    .matches(/[a-z]/)
    .withMessage("Le mot de passe doit contenir au moins une minuscule.")
    .matches(/[0-9]/)
    .withMessage("Le mot de passe doit contenir au moins un chiffre."),

  body("confirmMotDePasse")
    .trim()
    .notEmpty()
    .withMessage("La confirmation du mot de passe est obligatoire.")
    .custom((value, { req }) => {
      if (value !== req.body.motDePasse) {
        throw new Error("Les mots de passe ne correspondent pas.");
      }
      return true;
    }),
];

const changePasswordValidator = [
  body("oldMotDePasse")
    .notEmpty()
    .withMessage("L'ancien mot de passe est obligatoire.")
    .isString()
    .withMessage("L'ancien mot de passe doit être une chaîne de caractères."),

  body("newMotDePasse")
    .notEmpty()
    .withMessage("Le nouveau mot de passe est obligatoire.")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères.")
    .matches(/[A-Z]/)
    .withMessage("Le mot de passe doit contenir au moins une majuscule.")
    .matches(/[a-z]/)
    .withMessage("Le mot de passe doit contenir au moins une minuscule.")
    .matches(/[0-9]/)
    .withMessage("Le mot de passe doit contenir au moins un chiffre.")
    .custom((value, { req }) => {
      if (value === req.body.oldMotDePasse) {
        throw new Error(
          "Le nouveau mot de passe doit être différent de l'ancien.",
        );
      }
      return true;
    }),

  body("confirmMotDePasse")
    .notEmpty()
    .withMessage("La confirmation du mot de passe est obligatoire.")
    .custom((value, { req }) => {
      if (value !== req.body.newMotDePasse) {
        throw new Error("Les mots de passe ne correspondent pas.");
      }
      return true;
    }),
];

const createUserValidator = [
  // Nom
  body("nom")
    .notEmpty()
    .withMessage("Le nom est obligatoire")
    .isLength({ min: 2 })
    .withMessage("Le nom doit contenir au moins 2 caractères")
    .trim(),

  // Prénom
  body("prenom")
    .notEmpty()
    .withMessage("Le prénom est obligatoire")
    .isLength({ min: 2 })
    .withMessage("Le prénom doit contenir au moins 2 caractères")
    .trim(),

  // Email
  body("email")
    .notEmpty()
    .withMessage("L'email est obligatoire")
    .isEmail()
    .withMessage("Format email invalide")
    .customSanitizer((val) => val.toLowerCase().trim()),

  // Role
  body("role")
    .notEmpty()
    .withMessage("Le rôle est obligatoire")
    .isIn(ROLES_VALIDES)
    .withMessage("Rôle invalide"),

  // Téléphone (optionnel mais valide si présent)
  body("telephone")
    .if(
      body("role").custom((role) =>
        ["admin", "chef_departement", "enseignant"].includes(role),
      ),
    )
    .notEmpty()
    .withMessage("Le téléphone est obligatoire pour ce rôle")
    .isString()
    .trim(),

  // Spécialité (enseignant uniquement)
  body("specialite")
    .if(body("role").equals("enseignant"))
    .notEmpty()
    .withMessage("La spécialité est obligatoire pour un enseignant")
    .isLength({ min: 2 })
    .withMessage("Spécialité trop courte"),

  body("departement")
    .if(body("role").isIn(["enseignant", "chef_departement"]))
    .notEmpty()
    .withMessage("Le département est obligatoire")
    .isMongoId()
    .withMessage("ID de département invalide")
    .custom(async (id) => {
      const { Departement } = require("../models");
      const dep = await Departement.findById(id);
      if (!dep) throw new Error("Département introuvable");
    }),

  // Classe (étudiant uniquement)
  body("classe")
    .if(body("role").equals("etudiant"))
    .notEmpty()
    .withMessage("La classe est obligatoire pour un étudiant")
    .isMongoId()
    .withMessage("ID de classe invalide")
    .custom(async (id) => {
      const { Classe } = require("../models");
      const classe = await Classe.findById(id);
      if (!classe) throw new Error("Classe introuvable");
    }),
];

const updateUserValidator = [
  // Nom
  body("nom")
    .optional()
    .notEmpty()
    .withMessage("Le nom ne peut pas être vide")
    .isLength({ min: 2 })
    .withMessage("Le nom doit contenir au moins 2 caractères")
    .trim(),

  // Prénom
  body("prenom")
    .optional()
    .notEmpty()
    .withMessage("Le prénom ne peut pas être vide")
    .isLength({ min: 2 })
    .withMessage("Le prénom doit contenir au moins 2 caractères")
    .trim(),

  // Téléphone
  body("telephone")
    .optional()
    .notEmpty()
    .withMessage("Le téléphone ne peut pas être vide")
    .isString()
    .trim(),

  // Avatar
  body("avatar")
    .optional()
    .notEmpty()
    .withMessage("L'avatar ne peut pas être vide")
    .isURL()
    .withMessage("L'avatar doit être une URL valide"),

  // Spécialité
  body("specialite")
    .optional()
    .notEmpty()
    .withMessage("La spécialité ne peut pas être vide")
    .isLength({ min: 2 })
    .withMessage("Spécialité trop courte")
    .trim(),

  // Classe
  body("classe")
    .optional()
    .notEmpty()
    .withMessage("La classe ne peut pas être vide")
    .isMongoId()
    .withMessage("ID de classe invalide")
    .custom(async (id) => {
      const { Classe } = require("../models");
      const classe = await Classe.findById(id);
      if (!classe) throw new Error("Classe introuvable");
    }),

  // Champs non modifiables : rejetés si présents
  body("email").not().exists().withMessage("L'email n'est pas modifiable ici"),
  body("role").not().exists().withMessage("Le rôle n'est pas modifiable ici"),
  body("motDePasse").not().exists().withMessage("Le mot de passe n'est pas modifiable ici"),
  body("matricule").not().exists().withMessage("Le matricule n'est pas modifiable ici"),
];

const toggleUserStatusValidator = [
  param("id")
    .isMongoId()
    .withMessage("ID utilisateur invalide"),
];

module.exports = {
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  createUserValidator,
  updateUserValidator,
  toggleUserStatusValidator
};
