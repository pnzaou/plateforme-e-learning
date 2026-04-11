import { useState } from "react";
import { Link } from "react-router";
import { GraduationCap, ArrowLeft, CheckCircle } from "lucide-react";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-heading font-bold">ISI Learn</h2>
        </div>

        {!sent ? (
          <ForgotPasswordForm handleSent={setSent}/>
        ) : (
          <div className="text-center space-y-4 glass rounded-lg p-8">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
            <h2 className="text-xl font-heading font-bold">Email envoyé !</h2>
            <p className="text-muted-foreground text-sm">
              Si un compte existe avec l'adresse <span className="font-medium text-foreground">{email}</span>, vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <p className="text-xs text-muted-foreground">
              Vérifiez également vos spams.
            </p>
          </div>
        )}

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
