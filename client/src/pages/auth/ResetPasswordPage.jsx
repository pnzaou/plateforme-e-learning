import { useState } from "react";
import { Link } from "react-router";
import { GraduationCap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResetPasswordForm from "@/components/auth/reset-password-form";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    // TODO: Connect to Express.js backend
    console.log("Reset password to:", password);
    setDone(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-heading font-bold">ISI Learn</h2>
        </div>

        {!done ? (
          <ResetPasswordForm/>
        ) : (
          <div className="text-center space-y-4 glass rounded-lg p-8">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
            <h2 className="text-xl font-heading font-bold">Mot de passe modifié !</h2>
            <p className="text-muted-foreground text-sm">
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
            </p>
            <Link to="/login">
              <Button className="gradient-primary text-primary-foreground mt-2">
                Se connecter
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
