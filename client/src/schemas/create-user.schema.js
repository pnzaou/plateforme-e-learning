import * as yup from "yup";

const mongoId = yup
  .string()
  .matches(/^[a-f\d]{24}$/i, "ID invalide");

export const createUserSchema = (role) =>
  yup.object({
    nom: yup
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .required("Le nom est obligatoire"),

    prenom: yup
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .required("Le prénom est obligatoire"),

    email: yup
      .string()
      .email("Format email invalide")
      .required("L'email est obligatoire"),

    telephone: ["admin", "chef_departement", "enseignant"].includes(role)
      ? yup.string().required("Le téléphone est obligatoire pour ce rôle")
      : yup.string().optional(),

    specialite: role === "enseignant"
      ? yup
          .string()
          .min(2, "Spécialité trop courte")
          .required("La spécialité est obligatoire pour un enseignant")
      : yup.string().optional(),

    departement: ["enseignant", "chef_departement"].includes(role)
      ? mongoId.required("Le département est obligatoire")
      : yup.string().optional(),

    classe: role === "etudiant"
      ? mongoId.required("La classe est obligatoire pour un étudiant")
      : yup.string().optional(),
  });