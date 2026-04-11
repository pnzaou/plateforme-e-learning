import * as yup from "yup";

const mongoId = yup
  .string()
  .matches(/^[a-f\d]{24}$/i, "ID invalide");

  export const updateUserSchema = (role) =>
  yup.object({
    nom: yup
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .required("Le nom est obligatoire"),

    prenom: yup
      .string()
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .required("Le prénom est obligatoire"),

    telephone: ["admin", "chef_departement", "enseignant"].includes(role)
      ? yup.string().required("Le téléphone est obligatoire")
      : yup.string().optional(),

    specialite: role === "enseignant"
      ? yup
          .string()
          .min(2, "Spécialité trop courte")
          .required("La spécialité est obligatoire")
      : yup.string().optional(),

    classe: role === "etudiant"
      ? mongoId.required("La classe est obligatoire")
      : yup.string().optional(),
  });