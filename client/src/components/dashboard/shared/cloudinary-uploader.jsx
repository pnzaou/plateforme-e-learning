import { useState, useRef } from "react";
import { Upload, X, File, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getUploadSignatureApi } from "@/features/contenus/contenus.api";

// Limites en bytes
const SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5 MB
  pdf: 20 * 1024 * 1024, // 20 MB
  audio: 20 * 1024 * 1024, // 20 MB
  video: 100 * 1024 * 1024, // 100 MB
};

const ACCEPT_MAP = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  pdf: "application/pdf",
  audio: "audio/mpeg,audio/mp3,audio/wav,audio/ogg",
  video: "video/mp4,video/webm,video/quicktime",
};

const TYPE_LABELS = {
  image: "une image",
  pdf: "un PDF",
  audio: "un fichier audio",
  video: "une vidéo",
};

const CloudinaryUploader = ({
  type, // "image" | "pdf" | "audio" | "video"
  moduleId,
  currentUrl = null,
  onUploaded, // ({ url, publicId, duration }) => void
  onClear,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(
    currentUrl
      ? { url: currentUrl, name: currentUrl.split("/").pop() }
      : null,
  );
  const inputRef = useRef(null);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation taille
    const limit = SIZE_LIMITS[type];
    if (file.size > limit) {
      toast.error(
        `Fichier trop lourd (max ${formatSize(limit)}, actuel : ${formatSize(file.size)}).`,
      );
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);

      // 1. Récupérer la signature du backend
      const sigRes = await getUploadSignatureApi(type, moduleId);
      if (!sigRes.success) {
        throw new Error(sigRes.message);
      }
      const { signature, timestamp, folder, apiKey, cloudName, resourceType } =
        sigRes.data;

      // 2. Upload direct vers Cloudinary avec XMLHttpRequest (pour le tracking progress)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          const result = {
            url: response.secure_url,
            publicId: response.public_id,
            duration: response.duration
              ? Math.round(response.duration / 60) // en minutes
              : null,
            size: response.bytes,
            format: response.format,
          };
          setUploadedFile({
            url: response.secure_url,
            name: file.name,
            size: file.size,
          });
          onUploaded(result);
          toast.success("Fichier uploadé avec succès.");
        } else {
          console.error("Erreur Cloudinary:", xhr.responseText);
          toast.error("Échec de l'upload. Réessayez.");
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        toast.error("Erreur réseau lors de l'upload.");
      };

      xhr.send(formData);
    } catch (error) {
      setIsUploading(false);
      console.error(error);
      toast.error(error?.message ?? "Erreur lors de l'upload.");
    }

    // Reset input pour permettre de re-uploader le même fichier
    e.target.value = "";
  };

  const handleClear = () => {
    setUploadedFile(null);
    setProgress(0);
    if (onClear) onClear();
  };

  // ─── État 1 : fichier déjà uploadé ───
  if (uploadedFile && !isUploading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {uploadedFile.name || "Fichier uploadé"}
            </p>
            {uploadedFile.size && (
              <p className="text-xs text-muted-foreground">
                {formatSize(uploadedFile.size)}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              Remplacer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive"
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MAP[type]}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // ─── État 2 : upload en cours ───
  if (isUploading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <p className="text-sm font-medium">Upload en cours...</p>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">{progress}%</p>
      </div>
    );
  }

  // ─── État 3 : zone d'upload initiale ───
  return (
    <div
      className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
      onClick={() => inputRef.current?.click()}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">
            Cliquez pour uploader {TYPE_LABELS[type]}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Taille max : {formatSize(SIZE_LIMITS[type])}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[type]}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default CloudinaryUploader;