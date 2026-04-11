import { Link, useNavigate } from "react-router";
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/features/auth/auth.slice"
import { yupResolver } from "@hookform/resolvers/yup"
import { loginSchema } from "@/schemas"
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const loading = useSelector((state) => state.auth.loading)
  const dispatch = useDispatch()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", motDePasse: "" },
    mode: "onChange",
    resolver: yupResolver(loginSchema),
  })

  const navigate = useNavigate()

  const handleLogin = async (data) => {
    const result = await dispatch(loginUser(data))

    if (loginUser.fulfilled.match(result)) {
      toast.success("Connexion réussie !")
      navigate("/dashboard", { replace: true })
    } else {
      toast.error(result.payload)
    }
  }
  
  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md space-y-8">
        <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-heading font-bold">ISI Learn</h2>
        </div>

        <div className="text-center lg:text-left">
          <h1 className="text-2xl font-heading font-bold">Connexion</h1>
          <p className="text-muted-foreground mt-1">
            Accédez à votre espace d'apprentissage
          </p>
        </div>

        <form onSubmit={handleSubmit(handleLogin)} className="space-y-5" noValidate>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
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
                onClick={() => setShowPassword((prev) => !prev)}
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

          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer"
            >
              Se souvenir de moi
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary text-primary-foreground"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            to="/register"
            className="text-primary hover:underline font-medium"
          >
            Contactez l'administration
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
