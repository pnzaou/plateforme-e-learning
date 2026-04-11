import * as yup from "yup"

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email("Veuillez saisir une adresse mail valide.")
    .required("L'email est obligatoire."),
})