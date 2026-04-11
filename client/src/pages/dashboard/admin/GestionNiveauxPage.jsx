import { Layers, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";

import {
  fetchNiveauxThunk,
  createNiveauThunk,
  updateNiveauThunk,
  deleteNiveauThunk,
  resetNiveauxAction,
} from "@/features/academique/niveaux.slice";
import { fetchFilieresThunk } from "@/features/academique/filieres.slice";

import AcademiqueListSkeleton from "@/components/skeletons/academique-list-skeleton";
import ErrorState from "@/components/dashboard/shared/error-state";
import NiveauFormDialog from "@/components/dashboard/academique/niveau-form-dialog";

const GestionNiveauxPage = () => {
  const dispatch = useDispatch();
  const { data, status, error, actionStatus, actionError } = useSelector(
    (state) => state.niveaux,
  );
  const { data: filieres, status: fStatus } = useSelector(
    (state) => state.filieres,
  );

  const [open, setOpen] = useState(false);
  const [editNiveau, setEditNiveau] = useState(null);
  const [filterFiliere, setFilterFiliere] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const submittedAsEdit = useRef(false);

  useEffect(() => {
    if (fStatus === "idle") dispatch(fetchFilieresThunk());
  }, [fStatus, dispatch]);

  useEffect(() => {
    const params = {};
    if (filterFiliere !== "all") params.filiere = filterFiliere;
    dispatch(fetchNiveauxThunk(params));
  }, [filterFiliere, dispatch]);

  useEffect(() => {
    if (actionStatus === "succeeded") {
      toast.success(
        submittedAsEdit.current ? "Niveau mis à jour." : "Niveau créé.",
      );
      dispatch(resetNiveauxAction());
      setOpen(false);
      setEditNiveau(null);
    }
    if (actionStatus === "failed") {
      toast.error(actionError ?? "Une erreur est survenue.");
      dispatch(resetNiveauxAction());
    }
  }, [actionStatus, actionError, dispatch]);

  const handleSubmit = (formData) => {
    submittedAsEdit.current = !!editNiveau;
    if (editNiveau) {
      dispatch(updateNiveauThunk({ id: editNiveau._id, data: formData }));
    } else {
      dispatch(createNiveauThunk(formData));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteNiveauThunk(deleteTarget._id));
    if (deleteNiveauThunk.fulfilled.match(result)) {
      toast.success("Niveau supprimé.");
    } else {
      toast.error(result.payload ?? "Suppression impossible.");
    }
    setDeleteTarget(null);
  };

  const handleRetry = () => {
    const params = {};
    if (filterFiliere !== "all") params.filiere = filterFiliere;
    dispatch(fetchNiveauxThunk(params));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Niveaux
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les niveaux d'études (L1, L2, M1, etc.)
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditNiveau(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nouveau niveau
        </Button>
      </div>

      <Select value={filterFiliere} onValueChange={setFilterFiliere}>
        <SelectTrigger className="w-full sm:w-[280px]">
          <SelectValue placeholder="Filtrer par filière" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les filières</SelectItem>
          {filieres.map((f) => (
            <SelectItem key={f._id} value={f._id}>
              {f.nom} ({f.departement?.nom ?? "—"})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {status === "pending" && data.length === 0 && (
        <AcademiqueListSkeleton count={5} columns={1} />
      )}

      {status === "failed" && (
        <ErrorState
          variant="inline"
          title="Impossible de charger les niveaux"
          message={error || "Une erreur est survenue."}
          onRetry={handleRetry}
        />
      )}

      {status === "succeeded" && data.length === 0 && (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Aucun niveau trouvé.</p>
        </div>
      )}

      {data.length > 0 && (
        <div className="grid gap-3">
          {data.map((n) => (
            <div
              key={n._id}
              className="glass rounded-lg p-4 flex items-center justify-between animate-fade-in"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{n.libelle}</p>
                    <Badge variant="outline" className="text-xs">
                      {n.code}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Ordre {n.ordre}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {n.filiere?.nom ?? "—"} •{" "}
                    {n.filiere?.departement?.nom ?? "—"} • {n.nbClasses ?? 0}{" "}
                    classe(s)
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditNiveau(n);
                    setOpen(true);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(n)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NiveauFormDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditNiveau(null);
        }}
        niveau={editNiveau}
        filieres={filieres}
        onSubmit={handleSubmit}
        loading={actionStatus === "pending"}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce niveau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le niveau <strong>{deleteTarget?.libelle}</strong> sera supprimé
              définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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

export default GestionNiveauxPage;