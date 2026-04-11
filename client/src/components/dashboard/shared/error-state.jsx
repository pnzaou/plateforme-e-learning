import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Composant d'état d'erreur réutilisable.
 *
 * @param {string} title - Titre de l'erreur (par défaut "Une erreur est survenue")
 * @param {string} message - Message détaillé
 * @param {Function} [onRetry] - Callback du bouton "Réessayer" (optionnel)
 * @param {"page" | "inline"} [variant="page"] - "page" prend toute la zone, "inline" est compact
 */
const ErrorState = ({
  title = "Une erreur est survenue",
  message = "Impossible de charger les données. Veuillez réessayer.",
  onRetry,
  variant = "page",
}) => {
  if (variant === "inline") {
    return (
      <div className="glass rounded-lg p-6 flex items-start gap-4 border border-destructive/20">
        <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-sm">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="mt-3 h-8 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Réessayer
            </Button>
          )}
        </div>
      </div>
    );
  }

  // variant === "page"
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center space-y-4 animate-fade-in">
        <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1">
          <h2 className="font-heading font-bold text-xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <Button
            onClick={onRetry}
            className="gradient-primary text-primary-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
