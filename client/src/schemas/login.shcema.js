import * as yup from "yup"

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("Veuillez saisir une adresse mail valide.")
    .required("L'email est obligatoire."),
  motDePasse: yup
    .string()
    .min(8, "Le mot de passe doit avoir au moins 8 caractères")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
      "Minimum: 1 maj, 1 min, 1 chiffre, 1 spé"
    )
    .max(30, "Le mot de passe ne peut pas dépasser 20 caractères.")
    .required("Le mot de passe est obligatoire."),
})
