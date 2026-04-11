import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { forgotPasswordSchema } from "@/schemas";
import { forgotPassword } from "@/features/auth/auth.api";
import { toast } from "sonner";

function ForgotPasswordForm({ handleSent }) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "" },
    mode: "onChange",
    resolver: yupResolver(forgotPasswordSchema),
  });

  const handleForgotPassword = async (data) => {
    try {
      setLoading(true);
      const res = await forgotPassword(data);
      if (res.success) {
        reset();
        handleSent(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur ! Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-heading font-bold">Mot de passe oublié</h1>
        <p className="text-muted-foreground text-sm">
          Entrez votre adresse email et nous vous enverrons un lien pour
          réinitialiser votre mot de passe.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(handleForgotPassword)}
        className="space-y-5"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              {...register("email")}
              className="pl-10"
            />
            {errors.email && (
              <span className="text-xs text-red-600">
                {errors.email.message}
              </span>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full gradient-primary text-primary-foreground"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Reception en cours..." : "Recevoir le lien"}
        </Button>
      </form>
    </>
  );
}

export default ForgotPasswordForm;
