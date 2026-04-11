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

import { createChapitreSchema } from "@/schemas";

const ChapitreFormDialog = ({
  open,
  onOpenChange,
  chapitre = null,
  isSubChapter = false,
  parentTitle = null,
  onSubmit,
  loading = false,
}) => {
  const isEdit = !!chapitre?._id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { titre: "", description: "" },
    resolver: yupResolver(createChapitreSchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        titre: chapitre?.titre ?? "",
        description: chapitre?.description ?? "",
      });
    }
  }, [open, chapitre, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Modifier le chapitre"
              : isSubChapter
                ? `Nouveau sous-chapitre${parentTitle ? ` — ${parentTitle}` : ""}`
                : "Nouveau chapitre"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
          noValidate
        >
          <div className="space-y-2">
            <Label>
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ex: Introduction à la complexité"
              {...register("titre")}
            />
            {errors.titre && (
              <p className="text-xs text-destructive">{errors.titre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              placeholder="Décrivez brièvement le contenu de ce chapitre..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChapitreFormDialog;