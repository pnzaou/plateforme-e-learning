import * as yup from "yup";

export const updateModuleSchema = yup.object({
  titre: yup
    .string()
    .trim()
    .required("Le titre est obligatoire")
    .min(3)
    .max(150),
  description: yup.string().trim().max(1000).nullable(),
  coefficient: yup
    .number()
    .typeError("Doit être un nombre")
    .required()
    .integer()
    .min(1)
    .max(10),
});
