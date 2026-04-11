import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { createUserSchema, updateUserSchema } from "@/schemas";

const ROLE_LABELS = {
  admin: "Administrateur",
  chef_departement: "Chef de département",
  enseignant: "Enseignant",
  etudiant: "Étudiant",
};

const UserFormDialog = ({
  open,
  onOpenChange,
  actorRole,
  user = null,
  allowedRoles,
  departements = [],
  classes = [],
  onSubmit,
  loading = false,
}) => {
  const isEdit = !!user?._id;

  const availableRoles =
    allowedRoles ??
    (actorRole === "admin"
      ? ["admin", "chef_departement", "enseignant", "etudiant"]
      : ["enseignant", "etudiant"]);

  const defaultRole = user?.role ?? allowedRoles?.[0] ?? "etudiant";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      role: defaultRole,
      telephone: "",
      specialite: "",
      departement: "",
      classe: "",
    },
    resolver: yupResolver(
      isEdit ? updateUserSchema(defaultRole) : createUserSchema(defaultRole),
    ),
  });

  const selectedRole = watch("role");

  // Chaque fois que le rôle change on reset le resolver dynamiquement
  // en re-resetant le form avec le nouveau schéma
  useEffect(() => {
    // On ne refait pas le resolver ici (react-hook-form ne supporte pas
    // le changement de resolver à la volée) — on reset simplement les
    // champs non pertinents pour éviter des erreurs fantômes
    setValue("telephone", "");
    setValue("specialite", "");
    setValue("departement", "");
    setValue("classe", "");
  }, [selectedRole, setValue]);

  // Reset complet à l'ouverture
  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          nom: user.nom ?? "",
          prenom: user.prenom ?? "",
          email: user.email ?? "",
          role: user.role ?? defaultRole,
          telephone: user.telephone ?? "",
          specialite: user.specialite ?? "",
          departement: user.departement?._id ?? user.departement ?? "",
          classe: user.classe?._id ?? user.classe ?? "",
        });
      } else {
        reset({
          nom: "",
          prenom: "",
          email: "",
          role: defaultRole,
          telephone: "",
          specialite: "",
          departement: "",
          classe: "",
        });
      }
    }
  }, [open, user, reset, defaultRole]);

  // Visibilité des champs selon rôle
  const showTelephone = ["admin", "chef_departement", "enseignant"].includes(
    selectedRole,
  );
  const showSpecialite = selectedRole === "enseignant";
  const showDepartement =
    ["enseignant", "chef_departement"].includes(selectedRole) &&
    actorRole === "admin";
  const showClasse = selectedRole === "etudiant";

  const onValid = (data) => {
    // On n'envoie que les champs pertinents
    const payload = { nom: data.nom, prenom: data.prenom };

    if (!isEdit) {
      payload.email = data.email;
      payload.role = data.role;
    }

    if (showTelephone) payload.telephone = data.telephone;
    if (showSpecialite) payload.specialite = data.specialite;
    if (showDepartement) payload.departement = data.departement;
    if (showClasse) payload.classe = data.classe;

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onValid)}
          className="space-y-4 pt-2"
          noValidate
        >
          {/* Sélecteur de rôle — création uniquement */}
          {!isEdit && availableRoles.length > 1 && (
            <div className="space-y-2">
              <Label>Rôle</Label>
              <div className="flex flex-wrap gap-2">
                {availableRoles.map((r) => (
                  <Badge
                    key={r}
                    variant={selectedRole === r ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                      selectedRole === r
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                    onClick={() =>
                      setValue("role", r, { shouldValidate: false })
                    }
                  >
                    {ROLE_LABELS[r]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {isEdit && (
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">Rôle :</Label>
              <Badge variant="secondary">{ROLE_LABELS[selectedRole]}</Badge>
            </div>
          )}

          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Prénom" {...register("prenom")} />
              {errors.prenom && (
                <p className="text-xs text-destructive">
                  {errors.prenom.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Nom" {...register("nom")} />
              {errors.nom && (
                <p className="text-xs text-destructive">{errors.nom.message}</p>
              )}
            </div>
          </div>

          {/* Email — création uniquement */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                placeholder="email@isi.sn"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          )}

          {/* Téléphone */}
          {showTelephone && (
            <div className="space-y-2">
              <Label>
                Téléphone <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="+221 77 000 00 00"
                {...register("telephone")}
              />
              {errors.telephone && (
                <p className="text-xs text-destructive">
                  {errors.telephone.message}
                </p>
              )}
            </div>
          )}

          {/* Département */}
          {showDepartement && (
            <div className="space-y-2">
              <Label>
                Département <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("departement")}
                onValueChange={(v) =>
                  setValue("departement", v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un département" />
                </SelectTrigger>
                <SelectContent>
                  {departements.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departement && (
                <p className="text-xs text-destructive">
                  {errors.departement.message}
                </p>
              )}
            </div>
          )}

          {/* Spécialité */}
          {showSpecialite && (
            <div className="space-y-2">
              <Label>
                Spécialité <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ex: Intelligence Artificielle"
                {...register("specialite")}
              />
              {errors.specialite && (
                <p className="text-xs text-destructive">
                  {errors.specialite.message}
                </p>
              )}
            </div>
          )}

          {/* Classe */}
          {showClasse && (
            <div className="space-y-2">
              <Label>
                Classe <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("classe")}
                onValueChange={(v) =>
                  setValue("classe", v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classe && (
                <p className="text-xs text-destructive">
                  {errors.classe.message}
                </p>
              )}
            </div>
          )}

          {!isEdit && (
            <div className="rounded-md bg-accent/50 p-3 text-sm text-muted-foreground">
              Un mot de passe temporaire sera généré et envoyé par email à
              l'utilisateur.
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Enregistrer les modifications" : "Créer le compte"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;
