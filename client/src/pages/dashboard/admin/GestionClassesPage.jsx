import { Users2, Plus, Edit, Trash2 } from "lucide-react";
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
  fetchClassesThunk,
  createClasseThunk,
  updateClasseThunk,
  deleteClasseThunk,
  resetClassesAction,
} from "@/features/academique/classes.slice";
import { fetchNiveauxThunk } from "@/features/academique/niveaux.slice";

import AcademiqueListSkeleton from "@/components/skeletons/academique-list-skeleton";
import ErrorState from "@/components/dashboard/shared/error-state";
import ClasseFormDialog from "@/components/dashboard/academique/classe-form-dialog";

const GestionClassesPage = () => {
  const dispatch = useDispatch();
  const { data, status, error, actionStatus, actionError } = useSelector(
    (state) => state.classes,
  );
  const { data: niveaux, status: nStatus } = useSelector(
    (state) => state.niveaux,
  );

  const [open, setOpen] = useState(false);
  const [editClasse, setEditClasse] = useState(null);
  const [filterNiveau, setFilterNiveau] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const submittedAsEdit = useRef(false);

  useEffect(() => {
    if (nStatus === "idle") dispatch(fetchNiveauxThunk());
  }, [nStatus, dispatch]);

  useEffect(() => {
    const params = {};
    if (filterNiveau !== "all") params.niveau = filterNiveau;
    dispatch(fetchClassesThunk(params));
  }, [filterNiveau, dispatch]);

  useEffect(() => {
    if (actionStatus === "succeeded") {
      toast.success(
        submittedAsEdit.current ? "Classe mise à jour." : "Classe créée.",
      );
      dispatch(resetClassesAction());
      setOpen(false);
      setEditClasse(null);
    }
    if (actionStatus === "failed") {
      toast.error(actionError ?? "Une erreur est survenue.");
      dispatch(resetClassesAction());
    }
  }, [actionStatus, actionError, dispatch]);

  const handleSubmit = (formData) => {
    submittedAsEdit.current = !!editClasse;
    if (editClasse) {
      dispatch(updateClasseThunk({ id: editClasse._id, data: formData }));
    } else {
      dispatch(createClasseThunk(formData));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteClasseThunk(deleteTarget._id));
    if (deleteClasseThunk.fulfilled.match(result)) {
      toast.success("Classe supprimée.");
    } else {
      toast.error(result.payload ?? "Suppression impossible.");
    }
    setDeleteTarget(null);
  };

  const handleRetry = () => {
    const params = {};
    if (filterNiveau !== "all") params.niveau = filterNiveau;
    dispatch(fetchClassesThunk(params));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Classes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les classes par niveau et année scolaire
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditClasse(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nouvelle classe
        </Button>
      </div>

      <Select value={filterNiveau} onValueChange={setFilterNiveau}>
        <SelectTrigger className="w-full sm:w-[320px]">
          <SelectValue placeholder="Filtrer par niveau" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les niveaux</SelectItem>
          {niveaux.map((n) => (
            <SelectItem key={n._id} value={n._id}>
              {n.libelle} — {n.filiere?.nom ?? "—"}
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
          title="Impossible de charger les classes"
          message={error || "Une erreur est survenue."}
          onRetry={handleRetry}
        />
      )}

      {status === "succeeded" && data.length === 0 && (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Aucune classe trouvée.</p>
        </div>
      )}

      {data.length > 0 && (
        <div className="grid gap-3">
          {data.map((c) => (
            <div
              key={c._id}
              className="glass rounded-lg p-4 flex items-center justify-between animate-fade-in"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{c.nom}</p>
                    <Badge variant="outline" className="text-xs">
                      {c.anneeScolaire}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`text-xs border-0 ${
                        c.estActive
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.estActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.niveau?.libelle ?? "—"} • {c.niveau?.filiere?.nom ?? "—"}{" "}
                    • {c.nbEtudiants ?? 0}/{c.capacite} étudiants
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditClasse(c);
                    setOpen(true);
                  }}
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
          ))}
        </div>
      )}

      <ClasseFormDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditClasse(null);
        }}
        classe={editClasse}
        niveaux={niveaux}
        onSubmit={handleSubmit}
        loading={actionStatus === "pending"}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette classe ?</AlertDialogTitle>
            <AlertDialogDescription>
              La classe <strong>{deleteTarget?.nom}</strong> (
              {deleteTarget?.anneeScolaire}) sera supprimée définitivement.
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

export default GestionClassesPage;