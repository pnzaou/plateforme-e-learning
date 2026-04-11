import * as yup from "yup";

export const createChapitreSchema = yup.object({
  titre: yup
    .string()
    .trim()
    .required("Le titre est obligatoire")
    .min(2, "Trop court")
    .max(150, "Trop long"),
  description: yup.string().trim().max(500, "Trop long").nullable(),
});
