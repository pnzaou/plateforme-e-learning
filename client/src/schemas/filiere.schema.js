import * as yup from "yup";

export const filiereSchema = yup.object({
  nom: yup
    .string()
    .trim()
    .required("Le nom est obligatoire")
    .min(2, "Trop court")
    .max(100, "Trop long"),
  code: yup
    .string()
    .trim()
    .required("Le code est obligatoire")
    .matches(
      /^[A-Z0-9]{2,10}$/i,
      "Code invalide (2-10 caractères alphanumériques)",
    ),
  description: yup.string().trim().max(500, "Trop long").nullable(),
  departement: yup.string().required("Le département est obligatoire"),
});
