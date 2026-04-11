import * as yup from "yup";

export const CreateModuleSchema = yup.object({
  titre: yup
    .string()
    .trim()
    .required("Le titre est obligatoire")
    .min(3, "Trop court")
    .max(150, "Trop long"),
  code: yup
    .string()
    .trim()
    .required("Le code est obligatoire")
    .matches(/^[A-Z0-9]{3,15}$/i, "Code invalide (ex: INFO301)"),
  description: yup.string().trim().max(1000, "Trop long").nullable(),
  niveau: yup.string().required("Le niveau est obligatoire"),
  coefficient: yup
    .number()
    .typeError("Doit être un nombre")
    .required("Le coefficient est obligatoire")
    .integer()
    .min(1, "Minimum 1")
    .max(10, "Maximum 10"),
  enseignant: yup.string().nullable(), // obligatoire uniquement pour admin
});