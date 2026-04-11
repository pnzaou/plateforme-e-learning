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

import { niveauSchema } from "@/schemas";

const NiveauFormDialog = ({
  open,
  onOpenChange,
  niveau = null,
  filieres = [],
  onSubmit,
  loading = false,
}) => {
  const isEdit = !!niveau?._id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { libelle: "", code: "", filiere: "", ordre: 1 },
    resolver: yupResolver(niveauSchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        libelle: niveau?.libelle ?? "",
        code: niveau?.code ?? "",
        filiere: niveau?.filiere?._id ?? niveau?.filiere ?? "",
        ordre: niveau?.ordre ?? 1,
      });
    }
  }, [open, niveau, reset]);

  const onValid = (formData) => {
    const payload = {
      libelle: formData.libelle,
      code: formData.code,
      ordre: formData.ordre,
    };
    if (!isEdit) payload.filiere = formData.filiere;
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le niveau" : "Nouveau niveau"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onValid)}
          className="space-y-4 pt-2"
          noValidate
        >
          {!isEdit && (
            <div className="space-y-2">
              <Label>
                Filière <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("filiere")}
                onValueChange={(v) =>
                  setValue("filiere", v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une filière" />
                </SelectTrigger>
                <SelectContent>
                  {filieres.map((f) => (
                    <SelectItem key={f._id} value={f._id}>
                      {f.nom} ({f.departement?.nom ?? "—"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.filiere && (
                <p className="text-xs text-destructive">
                  {errors.filiere.message}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Libellé <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Ex: Licence 1" {...register("libelle")} />
              {errors.libelle && (
                <p className="text-xs text-destructive">
                  {errors.libelle.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Code <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Ex: L1" {...register("code")} />
              {errors.code && (
                <p className="text-xs text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Ordre <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              max={20}
              {...register("ordre", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Permet de trier les niveaux (L1 = 1, L2 = 2, etc.)
            </p>
            {errors.ordre && (
              <p className="text-xs text-destructive">{errors.ordre.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer le niveau"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NiveauFormDialog;