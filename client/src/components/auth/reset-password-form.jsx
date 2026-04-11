import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { yupResolver } from "@hookform/resolvers/yup";
import { resetPasswordSchema } from "@/schemas";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, XCircle } from "lucide-react";
import { resetPassword } from "@/features/auth/auth.api";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router";

function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { motDePasse: "", confirmMotDePasse: "" },
    mode: "onChange",
    resolver: yupResolver(resetPasswordSchema),
  });

  const navigate = useNavigate()

  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="text-center space-y-4 glass rounded-lg p-8">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h2 className="text-xl font-heading font-bold">Lien invalide</h2>
        <p className="text-muted-foreground text-sm">
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center gap-2 text-sm text-primary hover:underline"
          >
            Renvoyer un lien
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  const handleResetPassword = async (data) => {
    try {
      setLoading(true);
      const res = await resetPassword({ ...data, token });
      if (res.success) {
        reset();
        navigate("/login", { replace: true });
        toast.success(res.message);
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
        <h1 className="text-2xl font-heading font-bold">
          Nouveau mot de passe
        </h1>
        <p className="text-muted-foreground text-sm">
          Choisissez un nouveau mot de passe sécurisé.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(handleResetPassword)}
        className="space-y-5"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("motDePasse")}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.motDePasse && (
            <span className="text-xs text-red-600">
              {errors.motDePasse.message}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("confirmMotDePasse")}
              className="pl-10"
            />
          </div>
          {errors.confirmMotDePasse && (
            <span className="text-xs text-red-600">
              {errors.confirmMotDePasse.message}
            </span>
          )}
        </div>
        <Button
          type="submit"
          className="w-full gradient-primary text-primary-foreground"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
        </Button>
      </form>
    </>
  );
}

export default ResetPasswordForm;
