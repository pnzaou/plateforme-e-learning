import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CreateModuleSchema,
  updateModuleSchema,
} from "@/schemas";

const ModuleFormDialog = ({
  open,
  onOpenChange,
  module = null,
  niveaux = [],
  enseignants = [],
  actorRole = "enseignant",
  onSubmit,
  loading = false,
}) => {
  const isEdit = !!module?._id;
  const isAdmin = actorRole === "admin";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      titre: "",
      code: "",
      description: "",
      niveau: "",
      coefficient: 1,
      enseignant: "",
    },
    resolver: yupResolver(isEdit ? updateModuleSchema : CreateModuleSchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        titre: module?.titre ?? "",
        code: module?.code ?? "",
        description: module?.description ?? "",
        niveau: module?.niveau?._id ?? module?.niveau ?? "",
        coefficient: module?.coefficient ?? 1,
        enseignant:
          module?.enseignant?._id ?? module?.enseignant ?? "",
      });
    }
  }, [open, module, reset]);

  const onValid = (formData) => {
    if (isEdit) {
      onSubmit({
        titre: formData.titre,
        description: formData.description,
        coefficient: formData.coefficient,
      });
    } else {
      const payload = {
        titre: formData.titre,
        code: formData.code,
        description: formData.description,
        niveau: formData.niveau,
        coefficient: formData.coefficient,
      };
      if (isAdmin) payload.enseignant = formData.enseignant;
      onSubmit(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le module" : "Nouveau module"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onValid)}
          className="space-y-4 pt-2"
          noValidate
        >
          <div className="space-y-2">
            <Label>
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ex: Algorithmique Avancée"
              {...register("titre")}
            />
            {errors.titre && (
              <p className="text-xs text-destructive">{errors.titre.message}</p>
            )}
          </div>

          {!isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Code <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="Ex: INFO301" {...register("code")} />
                {errors.code && (
                  <p className="text-xs text-destructive">
                    {errors.code.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  Coefficient <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  {...register("coefficient", { valueAsNumber: true })}
                />
                {errors.coefficient && (
                  <p className="text-xs text-destructive">
                    {errors.coefficient.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {isEdit && (
            <div className="space-y-2">
              <Label>
                Coefficient <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={10}
                {...register("coefficient", { valueAsNumber: true })}
              />
              {errors.coefficient && (
                <p className="text-xs text-destructive">
                  {errors.coefficient.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={4}
              placeholder="Présentez les objectifs et le contenu..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label>
                  Niveau <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("niveau")}
                  onValueChange={(v) =>
                    setValue("niveau", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveaux.map((n) => (
                      <SelectItem key={n._id} value={n._id}>
                        {n.libelle} — {n.filiere?.nom ?? "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.niveau && (
                  <p className="text-xs text-destructive">
                    {errors.niveau.message}
                  </p>
                )}
              </div>

              {isAdmin && (
                <div className="space-y-2">
                  <Label>
                    Enseignant <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch("enseignant")}
                    onValueChange={(v) =>
                      setValue("enseignant", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un enseignant" />
                    </SelectTrigger>
                    <SelectContent>
                      {enseignants.map((e) => (
                        <SelectItem key={e._id} value={e._id}>
                          {e.prenom} {e.nom}
                          {e.specialite && ` — ${e.specialite}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer le module"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleFormDialog;