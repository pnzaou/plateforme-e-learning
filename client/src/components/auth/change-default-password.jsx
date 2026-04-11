import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { changePasswordSchema } from "@/schemas";
import { changeUserPassword } from "@/features/auth/auth.slice";
import { toast } from "sonner";

const ChangeDefaultPasswordDialog = () => {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.userData);
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    defaultValues: {
      oldMotDePasse: "",
      newMotDePasse: "",
      confirmMotDePasse: "",
    },
    mode: "onChange",
    resolver: yupResolver(changePasswordSchema),
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (data) => {
    try {
      setLoading(true);
      const result = await dispatch(changeUserPassword(data));
      if (changeUserPassword.fulfilled.match(result)) {
        toast.success("Changement du mot de passe réussi !");
      } else {
        toast.error("Erreur lors de la modification veuillez réessayer.");
      }
    } catch (error) {
      console.log(error);
      toast.error("Erreur lors de la modification veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (!authUser.isDefaultPasswordChanged) {
    return (
      <Dialog open={true}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <DialogTitle>Changement de mot de passe requis</DialogTitle>
            </div>
            <DialogDescription>
              Pour des raisons de sécurité, vous devez changer votre mot de
              passe temporaire avant de continuer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handlePasswordChange)} noValidate>
            <div className="space-y-4 py-2">
              {/* Current password */}
              <div className="space-y-2">
                <Label htmlFor="current-pw">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current-pw"
                    type={showCurrent ? "text" : "password"}
                    {...register("oldMotDePasse")}
                    placeholder="Entrez le mot de passe temporaire"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.oldMotDePasse && (
                  <p className="text-sm text-destructive">
                    {errors.oldMotDePasse.message}
                  </p>
                )}
              </div>

              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="new-pw">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-pw"
                    type={showNew ? "text" : "password"}
                    {...register("newMotDePasse")}
                    placeholder="Minimum 8 caractères"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.newMotDePasse && (
                  <p className="text-sm text-destructive">
                    {errors.newMotDePasse.message}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">
                  Confirmer le nouveau mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-pw"
                    type={showConfirm ? "text" : "password"}
                    {...register("confirmMotDePasse")}
                    placeholder="Retapez le nouveau mot de passe"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmMotDePasse && (
                  <p className="text-sm text-destructive">
                    {errors.confirmMotDePasse.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading
                  ? "Modification en cours..."
                  : "Changer le mot de passe"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

export default ChangeDefaultPasswordDialog;
