import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  FileText,
  Video,
  Image as ImageIcon,
  Headphones,
  FileDown,
  Link as LinkIcon,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import {
  fetchContenusThunk,
  createContenuThunk,
  updateContenuThunk,
  toggleContenuPublicationThunk,
  reorderContenusThunk,
  deleteContenuThunk,
  clearContenus,
  resetContenusAction,
} from "@/features/contenus/contenus.slice";

import ContenusListSkeleton from "@/components/skeletons/contenus-list-skeleton";
import ContenuFormDialog from "@/components/dashboard/contenus/contenu-form-dialog";
import ErrorState from "@/components/dashboard/shared/error-state";

const typeConfig = {
  texte: { label: "Texte", icon: FileText, color: "text-blue-500" },
  video: { label: "Vidéo", icon: Video, color: "text-primary" },
  image: { label: "Image", icon: ImageIcon, color: "text-green-500" },
  pdf: { label: "PDF", icon: FileDown, color: "text-red-500" },
  audio: { label: "Audio", icon: Headphones, color: "text-purple-500" },
  lien: { label: "Lien", icon: LinkIcon, color: "text-yellow-500" },
};

const ChapitreContents = () => {
  const { chapitreId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const moduleId = location.state?.moduleId;
  const chapitreTitle = location.state?.chapitreTitle;
  const backUrl = location.state?.backUrl;

  const { data: contenus, status, error, actionStatus } = useSelector(
    (state) => state.contenus,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editContenu, setEditContenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchContenusThunk(chapitreId));
    return () => {
      dispatch(clearContenus());
    };
  }, [chapitreId, dispatch]);

  useEffect(() => {
    if (actionStatus === "failed") {
      dispatch(resetContenusAction());
    }
  }, [actionStatus, dispatch]);

  const handleCreate = () => {
    setEditContenu(null);
    setFormOpen(true);
  };

  const handleEdit = (c) => {
    setEditContenu(c);
    setFormOpen(true);
  };

  const handleSubmit = async (formData) => {
    if (editContenu) {
      const result = await dispatch(
        updateContenuThunk({ id: editContenu._id, data: formData }),
      );
      if (updateContenuThunk.fulfilled.match(result)) {
        toast.success("Contenu mis à jour.");
        setFormOpen(false);
        setEditContenu(null);
      } else {
        toast.error(result.payload ?? "Erreur.");
      }
    } else {
      const result = await dispatch(
        createContenuThunk({ chapitreId, data: formData }),
      );
      if (createContenuThunk.fulfilled.match(result)) {
        toast.success("Contenu créé.");
        setFormOpen(false);
      } else {
        toast.error(result.payload ?? "Erreur.");
      }
    }
  };

  const handleToggle = async (c) => {
    const result = await dispatch(toggleContenuPublicationThunk(c._id));
    if (toggleContenuPublicationThunk.fulfilled.match(result)) {
      toast.success(
        `Contenu ${result.payload.estPublie ? "publié" : "dépublié"}.`,
      );
    } else {
      toast.error(result.payload ?? "Erreur.");
    }
  };

  const handleMove = (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= contenus.length) return;

    const a = contenus[index];
    const b = contenus[targetIndex];
    const items = contenus.map((c, i) => ({
      id: c._id,
      ordre: i === index ? b.ordre : i === targetIndex ? a.ordre : c.ordre,
    }));

    dispatch(reorderContenusThunk({ chapitreId, items }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteContenuThunk(deleteTarget._id));
    if (deleteContenuThunk.fulfilled.match(result)) {
      toast.success("Contenu supprimé.");
    } else {
      toast.error(result.payload ?? "Erreur.");
    }
    setDeleteTarget(null);
  };

  const handleBack = () => {
    if (backUrl) navigate(backUrl);
    else navigate(-1);
  };

  if (!moduleId) {
    return (
      <ErrorState
        title="Navigation invalide"
        message="Accédez à cette page depuis le détail d'un module."
        onRetry={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" className="gap-2" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4" /> Retour au module
      </Button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Contenus du chapitre
          </h1>
          {chapitreTitle && (
            <p className="text-muted-foreground mt-1">{chapitreTitle}</p>
          )}
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Ajouter un contenu
        </Button>
      </div>

      {status === "pending" && contenus.length === 0 && (
        <ContenusListSkeleton count={4} />
      )}

      {status === "failed" && (
        <ErrorState
          variant="inline"
          title="Impossible de charger les contenus"
          message={error || "Une erreur est survenue."}
          onRetry={() => dispatch(fetchContenusThunk(chapitreId))}
        />
      )}

      {status === "succeeded" && contenus.length === 0 && (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Aucun contenu pour l'instant. Ajoutez votre premier contenu !
          </p>
        </div>
      )}

      {contenus.length > 0 && (
        <div className="space-y-3">
          {contenus.map((c, index) => {
            const cfg = typeConfig[c.type];
            const Icon = cfg.icon;

            return (
              <div
                key={c._id}
                className="glass rounded-lg p-4 flex items-center gap-3 animate-fade-in"
              >
                <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <Icon className={`h-5 w-5 ${cfg.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">
                      {c.ordre}. {c.titre}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {cfg.label}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`border-0 text-xs ${
                        c.estPublie
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.estPublie ? "Publié" : "Brouillon"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {c.dureeMinutes && <span>{c.dureeMinutes} min</span>}
                    {c.telechargeable && (
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" /> Téléchargeable
                      </span>
                    )}
                    {c.urlFichier && (
                      <a
                        href={c.urlFichier}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Aperçu
                      </a>
                    )}
                    {c.urlExterne && (
                      <a
                        href={c.urlExterne}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {c.urlExterne}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => handleMove(index, "up")}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={index === contenus.length - 1}
                    onClick={() => handleMove(index, "down")}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(c)}
                    title={c.estPublie ? "Dépublier" : "Publier"}
                  >
                    {c.estPublie ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(c)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ContenuFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditContenu(null);
        }}
        contenu={editContenu}
        moduleId={moduleId}
        onSubmit={handleSubmit}
        loading={actionStatus === "pending"}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contenu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le contenu <strong>{deleteTarget?.titre}</strong> sera supprimé
              définitivement. Si un fichier est associé, il sera aussi retiré de
              Cloudinary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChapitreContents;