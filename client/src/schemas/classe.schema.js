import * as yup from "yup";

export const classeSchema = yup.object({
  nom: yup
    .string()
    .trim()
    .required("Le nom est obligatoire")
    .min(1, "Trop court")
    .max(50, "Trop long"),
  niveau: yup.string().required("Le niveau est obligatoire"),
  anneeScolaire: yup
    .string()
    .required("L'année scolaire est obligatoire")
    .matches(/^\d{4}-\d{4}$/, "Format attendu : YYYY-YYYY (ex: 2025-2026)")
    .test("annees-coherentes", "Les années doivent se suivre", (value) => {
      if (!value) return false;
      const [debut, fin] = value.split("-").map(Number);
      return fin === debut + 1;
    }),
  capacite: yup
    .number()
    .typeError("La capacité doit être un nombre")
    .required("La capacité est obligatoire")
    .integer("Doit être un entier")
    .min(1, "Minimum 1")
    .max(500, "Maximum 500"),
});