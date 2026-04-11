import * as yup from "yup";

export const niveauSchema = yup.object({
  libelle: yup
    .string()
    .trim()
    .required("Le libellé est obligatoire")
    .min(2, "Trop court")
    .max(50, "Trop long"),
  code: yup
    .string()
    .trim()
    .required("Le code est obligatoire")
    .matches(/^[A-Z0-9]{1,10}$/i, "Code invalide"),
  filiere: yup.string().required("La filière est obligatoire"),
  ordre: yup
    .number()
    .typeError("L'ordre doit être un nombre")
    .required("L'ordre est obligatoire")
    .integer("L'ordre doit être un entier")
    .min(1, "Minimum 1")
    .max(20, "Maximum 20"),
});