import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

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

import { departementSchema } from "@/schemas";
import { fetchUsersThunk } from "@/features/user/users.slice";

const DepartementFormDialog = ({
  open,
  onOpenChange,
  departement = null,
  onSubmit,
  loading = false,
}) => {
  const dispatch = useDispatch();
  const isEdit = !!departement?._id;

  // Récupère les chefs de département disponibles via le slice users
  const { data: chefs, status: chefsStatus } = useSelector(
    (state) => state.users.byRole.chef_departement,
  );

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
      chefDepartement: "",
    },
    resolver: yupResolver(departementSchema),
  });

  // Charger les chefs au premier ouverture
  useEffect(() => {
    if (open && chefsStatus === "idle") {
      dispatch(fetchUsersThunk({ role: "chef_departement" }));
    }
  }, [open, chefsStatus, dispatch]);

  // Reset form à l'ouverture
  useEffect(() => {
    if (open) {
      reset({
        nom: departement?.nom ?? "",
        code: departement?.code ?? "",
        description: departement?.description ?? "",
        chefDepartement:
          departement?.chefDepartement?._id ??
          departement?.chefDepartement ??
          "",
      });
    }
  }, [open, departement, reset]);

  const onValid = (formData) => {
    const payload = {
      nom: formData.nom,
      code: formData.code,
      description: formData.description,
    };
    if (formData.chefDepartement) {
      payload.chefDepartement = formData.chefDepartement;
    } else if (isEdit) {
      payload.chefDepartement = null;
    }
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le département" : "Créer un département"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onValid)}
          className="space-y-4 pt-2"
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Ex: Informatique" {...register("nom")} />
              {errors.nom && (
                <p className="text-xs text-destructive">{errors.nom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Code <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Ex: INFO" {...register("code")} />
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
              placeholder="Description du département..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Chef de département</Label>
            <Select
              value={watch("chefDepartement") || "none"}
              onValueChange={(v) =>
                setValue("chefDepartement", v === "none" ? "" : v, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun chef assigné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {chefs.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.prenom} {c.nom} ({c.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Le chef doit être un utilisateur avec le rôle « chef de
              département ».
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Enregistrer les modifications" : "Créer le département"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepartementFormDialog;