import * as yup from "yup";

export const updateClasseSchema = yup.object({
  nom: yup
    .string()
    .trim()
    .required("Le nom est obligatoire")
    .min(1, "Trop court")
    .max(50, "Trop long"),
  capacite: yup
    .number()
    .typeError("La capacité doit être un nombre")
    .required("La capacité est obligatoire")
    .integer()
    .min(1)
    .max(500),
  estActive: yup.boolean(),
});