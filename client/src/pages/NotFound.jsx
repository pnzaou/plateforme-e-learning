import { useLocation, Link } from "react-router";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/3 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/2 blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Big 404 */}
        <div className="relative mb-6">
          <h1 className="text-[10rem] sm:text-[12rem] font-heading font-black leading-none text-primary/10 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="glass rounded-2xl p-6 border border-border/50 backdrop-blur-xl">
              <Search className="h-12 w-12 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Page introuvable</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">
          Oups ! Cette page n'existe pas
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          La page <code className="px-2 py-0.5 rounded bg-muted text-sm font-mono text-primary">{location.pathname}</code> n'a pas été trouvée. Elle a peut-être été déplacée ou supprimée.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2 gradient-primary text-primary-foreground w-full sm:w-auto">
            <Link to="/">
              <Home className="h-4 w-4" />
              Retour au dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 w-full sm:w-auto border-border/50">
            <Link to="/login">
              Se connecter
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
