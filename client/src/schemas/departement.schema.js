import * as yup from "yup";

export const departementSchema = yup.object({
  nom: yup
    .string()
    .trim()
    .required("Le nom est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom est trop long"),
  code: yup
    .string()
    .trim()
    .required("Le code est obligatoire")
    .matches(
      /^[A-Z0-9]{2,10}$/i,
      "Code invalide (2-10 caractères alphanumériques)",
    ),
  description: yup
    .string()
    .trim()
    .max(500, "Description trop longue")
    .nullable(),
  chefDepartement: yup.string().nullable(),
});
