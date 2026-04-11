import * as yup from "yup";

const URL_REGEX =
  /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?$/;

// Schéma de base commun
const baseSchema = {
  titre: yup
    .string()
    .trim()
    .required("Le titre est obligatoire")
    .min(2, "Trop court")
    .max(150, "Trop long"),
};

export const contenuTexteSchema = yup.object({
  ...baseSchema,
  texte: yup
    .string()
    .required("Le contenu est obligatoire")
    .test("not-empty-html", "Le contenu ne peut pas être vide", (value) => {
      if (!value) return false;
      // On retire les balises HTML pour vérifier qu'il y a bien du texte
      const plain = value.replace(/<[^>]*>/g, "").trim();
      return plain.length > 0;
    }),
});

export const contenuLienSchema = yup.object({
  ...baseSchema,
  urlExterne: yup
    .string()
    .required("L'URL est obligatoire")
    .matches(URL_REGEX, "URL invalide"),
});

export const contenuFichierSchema = yup.object({
  ...baseSchema,
  urlFichier: yup.string().required("Vous devez uploader un fichier."),
  dureeMinutes: yup
    .number()
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .min(0, "Doit être positif"),
  telechargeable: yup.boolean(),
});