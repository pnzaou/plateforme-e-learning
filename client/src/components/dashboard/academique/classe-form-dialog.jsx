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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { classeSchema, updateClasseSchema } from "@/schemas";

const ClasseFormDialog = ({
  open,
  onOpenChange,
  classe = null,
  niveaux = [],
  onSubmit,
  loading = false,
}) => {
  const isEdit = !!classe?._id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nom: "",
      niveau: "",
      anneeScolaire: "",
      capacite: 40,
    },
    resolver: yupResolver(isEdit ? updateClasseSchema : classeSchema),
  });

  useEffect(() => {
    if (open) {
      // Année scolaire par défaut basée sur la date courante
      const now = new Date();
      const year = now.getFullYear();
      const defaultAnnee =
        now.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

      reset({
        nom: classe?.nom ?? "",
        niveau: classe?.niveau?._id ?? classe?.niveau ?? "",
        anneeScolaire: classe?.anneeScolaire ?? defaultAnnee,
        capacite: classe?.capacite ?? 40,
      });
    }
  }, [open, classe, reset]);

  const onValid = (formData) => {
    if (isEdit) {
      onSubmit({ nom: formData.nom, capacite: formData.capacite });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la classe" : "Nouvelle classe"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onValid)}
          className="space-y-4 pt-2"
          noValidate
        >
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

              <div className="space-y-2">
                <Label>
                  Année scolaire <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="2025-2026"
                  {...register("anneeScolaire")}
                />
                {errors.anneeScolaire && (
                  <p className="text-xs text-destructive">
                    {errors.anneeScolaire.message}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Ex: GL3-A" {...register("nom")} />
              {errors.nom && (
                <p className="text-xs text-destructive">{errors.nom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Capacité <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={500}
                {...register("capacite", { valueAsNumber: true })}
              />
              {errors.capacite && (
                <p className="text-xs text-destructive">
                  {errors.capacite.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer la classe"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClasseFormDialog;