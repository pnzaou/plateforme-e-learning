import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Loader2, FileText, Video, Image as ImageIcon, Headphones, FileDown, Link as LinkIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import TiptapEditor from "@/components/dashboard/shared/tip-tap-editor";
import CloudinaryUploader from "@/components/dashboard/shared/cloudinary-uploader";
import {
  contenuTexteSchema,
  contenuLienSchema,
  contenuFichierSchema,
} from "@/schemas/contenu.schemas";

const TYPES = [
  { value: "texte", label: "Texte", icon: FileText },
  { value: "video", label: "Vidéo", icon: Video },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "pdf", label: "PDF", icon: FileDown },
  { value: "audio", label: "Audio", icon: Headphones },
  { value: "lien", label: "Lien externe", icon: LinkIcon },
];

const getSchemaForType = (type) => {
  if (type === "texte") return contenuTexteSchema;
  if (type === "lien") return contenuLienSchema;
  return contenuFichierSchema;
};

const ContenuFormDialog = ({
  open,
  onOpenChange,
  contenu = null,
  moduleId,
  onSubmit,
  loading = false,
}) => {
  const isEdit = !!contenu?._id;
  // En édition, on ne peut pas changer le type — on garde celui du contenu existant
  const [selectedType, setSelectedType] = useState(contenu?.type ?? "texte");

  const currentSchema = getSchemaForType(selectedType);

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
      texte: "",
      urlExterne: "",
      urlFichier: "",
      cloudinaryPublicId: "",
      dureeMinutes: "",
      telechargeable: false,
    },
    resolver: yupResolver(currentSchema),
  });

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      if (isEdit) {
        setSelectedType(contenu.type);
        reset({
          titre: contenu.titre ?? "",
          texte: contenu.texte ?? "",
          urlExterne: contenu.urlExterne ?? "",
          urlFichier: contenu.urlFichier ?? "",
          cloudinaryPublicId: contenu.cloudinaryPublicId ?? "",
          dureeMinutes: contenu.dureeMinutes ?? "",
          telechargeable: contenu.telechargeable ?? false,
        });
      } else {
        setSelectedType("texte");
        reset({
          titre: "",
          texte: "",
          urlExterne: "",
          urlFichier: "",
          cloudinaryPublicId: "",
          dureeMinutes: "",
          telechargeable: false,
        });
      }
    }
  }, [open, contenu, isEdit, reset]);

  // Quand le type change en création, on reset les champs non pertinents
  const handleTypeChange = (newType) => {
    if (isEdit) return;
    setSelectedType(newType);
    setValue("texte", "");
    setValue("urlFichier", "");
    setValue("cloudinaryPublicId", "");
    setValue("urlExterne", "");
    setValue("dureeMinutes", "");
    setValue("telechargeable", false);
  };

  const handleUploaded = ({ url, publicId, duration }) => {
    setValue("urlFichier", url, { shouldValidate: true });
    setValue("cloudinaryPublicId", publicId);
    if (duration && (selectedType === "video" || selectedType === "audio")) {
      setValue("dureeMinutes", duration);
    }
  };

  const handleClearFile = () => {
    setValue("urlFichier", "", { shouldValidate: true });
    setValue("cloudinaryPublicId", "");
    setValue("dureeMinutes", "");
  };

  const onValid = (formData) => {
    const payload = {
      titre: formData.titre,
      type: selectedType,
    };

    if (selectedType === "texte") {
      payload.texte = formData.texte;
    } else if (selectedType === "lien") {
      payload.urlExterne = formData.urlExterne;
    } else {
      // video / image / pdf / audio
      payload.urlFichier = formData.urlFichier;
      payload.cloudinaryPublicId = formData.cloudinaryPublicId;
      if (formData.dureeMinutes)
        payload.dureeMinutes = Number(formData.dureeMinutes);
      payload.telechargeable = !!formData.telechargeable;
    }

    onSubmit(payload);
  };

  const currentUrl = watch("urlFichier");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le contenu" : "Nouveau contenu"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onValid)}
          className="space-y-5 pt-2"
          noValidate
        >
          {/* Sélecteur de type — uniquement en création */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>Type de contenu</Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = selectedType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => handleTypeChange(t.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-border/80 hover:bg-muted/30"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Titre — toujours visible */}
          <div className="space-y-2">
            <Label>
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ex: Introduction aux algorithmes"
              {...register("titre")}
            />
            {errors.titre && (
              <p className="text-xs text-destructive">{errors.titre.message}</p>
            )}
          </div>

          {/* ─── TEXTE ─── */}
          {selectedType === "texte" && (
            <div className="space-y-2">
              <Label>
                Contenu <span className="text-destructive">*</span>
              </Label>
              <TiptapEditor
                value={watch("texte")}
                onChange={(html) =>
                  setValue("texte", html, { shouldValidate: true })
                }
                placeholder="Rédigez votre contenu pédagogique..."
              />
              {errors.texte && (
                <p className="text-xs text-destructive">
                  {errors.texte.message}
                </p>
              )}
            </div>
          )}

          {/* ─── LIEN EXTERNE ─── */}
          {selectedType === "lien" && (
            <div className="space-y-2">
              <Label>
                URL externe <span className="text-destructive">*</span>
              </Label>
              <Input
                type="url"
                placeholder="https://youtube.com/..."
                {...register("urlExterne")}
              />
              <p className="text-xs text-muted-foreground">
                YouTube, Google Drive, Notion... tout lien valide est accepté.
              </p>
              {errors.urlExterne && (
                <p className="text-xs text-destructive">
                  {errors.urlExterne.message}
                </p>
              )}
            </div>
          )}

          {/* ─── UPLOAD FICHIER (video / image / pdf / audio) ─── */}
          {["video", "image", "pdf", "audio"].includes(selectedType) && (
            <>
              <div className="space-y-2">
                <Label>
                  Fichier <span className="text-destructive">*</span>
                </Label>
                <CloudinaryUploader
                  type={selectedType}
                  moduleId={moduleId}
                  currentUrl={currentUrl}
                  onUploaded={handleUploaded}
                  onClear={handleClearFile}
                />
                {errors.urlFichier && (
                  <p className="text-xs text-destructive">
                    {errors.urlFichier.message}
                  </p>
                )}
              </div>

              {/* Durée (vidéo/audio) */}
              {(selectedType === "video" || selectedType === "audio") && (
                <div className="space-y-2">
                  <Label>Durée (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Auto-détectée à l'upload"
                    {...register("dureeMinutes")}
                  />
                  <p className="text-xs text-muted-foreground">
                    La durée est calculée automatiquement après l'upload. Vous
                    pouvez l'ajuster.
                  </p>
                </div>
              )}

              {/* Téléchargeable */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">
                    Autoriser le téléchargement
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Les étudiants pourront télécharger ce fichier.
                  </p>
                </div>
                <Switch
                  checked={watch("telechargeable")}
                  onCheckedChange={(v) => setValue("telechargeable", v)}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Enregistrer les modifications" : "Créer le contenu"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContenuFormDialog;