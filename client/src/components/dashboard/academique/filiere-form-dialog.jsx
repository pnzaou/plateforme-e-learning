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

import { filiereSchema } from "@/schemas";

const FiliereFormDialog = ({
  open,
  onOpenChange,
  filiere = null,
  departements = [],
  onSubmit,
  loading = false,
}) => {
  const isEdit = !!filiere?._id;

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
      code: "",
      description: "",
      departement: "",
    },
    resolver: yupResolver(filiereSchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        nom: filiere?.nom ?? "",
        code: filiere?.code ?? "",
        description: filiere?.description ?? "",
        departement: filiere?.departement?._id ?? filiere?.departement ?? "",
      });
    }
  }, [open, filiere, reset]);

  const onValid = (formData) => {
    const payload = {
      nom: formData.nom,
      code: formData.code,
      description: formData.description,
    };
    // Le département n'est pas modifiable après création
    if (!isEdit) payload.departement = formData.departement;
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la filière" : "Nouvelle filière"}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Ex: Génie Logiciel" {...register("nom")} />
              {errors.nom && (
                <p className="text-xs text-destructive">{errors.nom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Code <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Ex: GL" {...register("code")} />
              {errors.code && (
                <p className="text-xs text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              placeholder="Description..."
              {...register("description")}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer la filière"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FiliereFormDialog;