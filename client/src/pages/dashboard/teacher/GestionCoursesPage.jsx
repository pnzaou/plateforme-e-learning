import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Send,
  AlertCircle,
  Eye,
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
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  fetchModulesThunk,
  createModuleThunk,
  updateModuleThunk,
  soumettreModuleThunk,
  deleteModuleThunk,
  resetModulesAction,
} from "@/features/modules/modules.slice";
import { fetchNiveauxThunk } from "@/features/academique/niveaux.slice";

import ModulesListSkeleton from "@/components/skeletons/modules-list-skeleton";
import ModuleFormDialog from "@/components/dashboard/modules/module-form-dialog";
import ErrorState from "@/components/dashboard/shared/error-state";

const statutLabel = {
  brouillon: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  en_revision: { label: "En révision", color: "bg-warning/10 text-warning" },
  publie: { label: "Publié", color: "bg-success/10 text-success" },
  archive: { label: "Archivé", color: "bg-muted text-muted-foreground" },
};

const GestionCoursesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data, status, error, actionStatus, actionError } = useSelector(
    (state) => state.modules,
  );
  const { data: niveaux, status: nStatus } = useSelector(
    (state) => state.niveaux,
  );

  const [open, setOpen] = useState(false);
  const [editModule, setEditModule] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const submittedAsEdit = useRef(false);

  useEffect(() => {
    if (nStatus === "idle") dispatch(fetchNiveauxThunk());
    dispatch(fetchModulesThunk());
  }, [nStatus, dispatch]);

  useEffect(() => {
    if (actionStatus === "succeeded") {
      toast.success(
        submittedAsEdit.current ? "Module mis à jour." : "Module créé.",
      );
      dispatch(resetModulesAction());
      setOpen(false);
      setEditModule(null);
    }
    if (actionStatus === "failed") {
      toast.error(actionError ?? "Une erreur est survenue.");
      dispatch(resetModulesAction());
    }
  }, [actionStatus, actionError, dispatch]);

  const handleSubmit = (formData) => {
    submittedAsEdit.current = !!editModule;
    if (editModule) {
      dispatch(updateModuleThunk({ id: editModule._id, data: formData }));
    } else {
      dispatch(createModuleThunk(formData));
    }
  };

  const handleSoumettre = async (m) => {
    const result = await dispatch(soumettreModuleThunk(m._id));
    if (soumettreModuleThunk.fulfilled.match(result)) {
      toast.success("Module soumis pour révision.");
    } else {
      toast.error(result.payload ?? "Erreur.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteModuleThunk(deleteTarget._id));
    if (deleteModuleThunk.fulfilled.match(result)) {
      toast.success("Module supprimé.");
    } else {
      toast.error(result.payload ?? "Suppression impossible.");
    }
    setDeleteTarget(null);
  };

  const handleRetry = () => dispatch(fetchModulesThunk());

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Mes cours
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez et créez vos modules
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditModule(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nouveau module
        </Button>
      </div>

      {status === "pending" && data.length === 0 && (
        <ModulesListSkeleton count={4} />
      )}

      {status === "failed" && (
        <ErrorState
          variant="inline"
          title="Impossible de charger vos modules"
          message={error || "Une erreur est survenue."}
          onRetry={handleRetry}
        />
      )}

      {status === "succeeded" && data.length === 0 && (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Aucun module pour l'instant. Créez votre premier cours !
          </p>
        </div>
      )}

      {data.length > 0 && (
        <div className="grid gap-3">
          {data.map((m) => {
            const st = statutLabel[m.statut];
            const canEdit =
              m.statut === "brouillon" || m.statut === "en_revision";
            const canSubmit = m.statut === "brouillon" && m.nbChapitres > 0;
            const canDelete =
              m.statut === "brouillon" && (m.nbChapitres ?? 0) === 0;

            return (
              <div
                key={m._id}
                className="glass rounded-lg p-4 space-y-3 animate-fade-in"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{m.titre}</p>
                        <Badge variant="outline" className="text-xs">
                          {m.code}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`border-0 text-xs ${st.color}`}
                        >
                          {st.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {m.niveau?.libelle ?? "—"} • Coeff. {m.coefficient} •{" "}
                        {m.nbChapitres ?? 0} chapitre(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/dashboard/teacher/courses/${m._id}`)
                      }
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditModule(m);
                          setOpen(true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(m)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Motif de rejet */}
                {m.statut === "brouillon" && m.motifRejet && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Module rejeté</p>
                      <p className="opacity-90">{m.motifRejet}</p>
                    </div>
                  </div>
                )}

                {canSubmit && (
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleSoumettre(m)}
                    disabled={actionStatus === "pending"}
                  >
                    <Send className="h-3.5 w-3.5" /> Soumettre pour révision
                  </Button>
                )}
                {m.statut === "brouillon" && m.nbChapitres === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Ajoutez au moins un chapitre avant de soumettre.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ModuleFormDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditModule(null);
        }}
        module={editModule}
        niveaux={niveaux}
        actorRole="enseignant"
        onSubmit={handleSubmit}
        loading={actionStatus === "pending"}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce module ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le module <strong>{deleteTarget?.titre}</strong> sera supprimé
              définitivement.
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

export default GestionCoursesPage;