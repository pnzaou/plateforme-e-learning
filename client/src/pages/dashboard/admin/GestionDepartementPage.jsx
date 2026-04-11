import { Building, Plus, Edit, Power, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import {
  fetchDepartementsThunk,
  createDepartementThunk,
  updateDepartementThunk,
  toggleDepartementStatusThunk,
  resetDepartementsAction,
} from "@/features/academique/departements.slice";

import AcademiqueListSkeleton from "@/components/skeletons/academique-list-skeleton";
import ErrorState from "@/components/dashboard/shared/error-state";
import DepartementFormDialog from "@/components/dashboard/academique/departement-form-dialog";

const GestionDepartementPage = () => {
  const dispatch = useDispatch();
  const { data, status, error, actionStatus, actionError } = useSelector(
    (state) => state.departements,
  );

  const [open, setOpen] = useState(false);
  const [editDep, setEditDep] = useState(null);
  const [search, setSearch] = useState("");
  const submittedAsEdit = useRef(false);

  // Fetch avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchDepartementsThunk({ search }));
    }, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search, dispatch]);

  // Feedback actions
  useEffect(() => {
    if (actionStatus === "succeeded") {
      toast.success(
        submittedAsEdit.current
          ? "Département mis à jour."
          : "Département créé.",
      );
      dispatch(resetDepartementsAction());
      setOpen(false);
      setEditDep(null);
    }
    if (actionStatus === "failed") {
      toast.error(actionError ?? "Une erreur est survenue.");
      dispatch(resetDepartementsAction());
    }
  }, [actionStatus, actionError, dispatch]);

  const handleSubmit = (formData) => {
    submittedAsEdit.current = !!editDep;
    if (editDep) {
      dispatch(updateDepartementThunk({ id: editDep._id, data: formData }));
    } else {
      dispatch(createDepartementThunk(formData));
    }
  };

  const handleToggle = async (dep) => {
    const result = await dispatch(toggleDepartementStatusThunk(dep._id));
    if (toggleDepartementStatusThunk.fulfilled.match(result)) {
      toast.success(
        `Département ${result.payload.dep.estActif ? "activé" : "désactivé"}.`,
      );
      if (result.payload.warning) toast.warning(result.payload.warning);
    } else {
      toast.error(result.payload ?? "Erreur lors du changement de statut.");
    }
  };

  const handleRetry = () => dispatch(fetchDepartementsThunk({ search }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Départements
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les départements de l'établissement
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditDep(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nouveau département
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un département..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {status === "pending" && data.length === 0 && (
        <AcademiqueListSkeleton count={4} columns={2} />
      )}

      {status === "failed" && (
        <ErrorState
          variant="inline"
          title="Impossible de charger les départements"
          message={error || "Une erreur est survenue."}
          onRetry={handleRetry}
        />
      )}

      {status === "succeeded" && data.length === 0 && (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {search
              ? "Aucun département ne correspond à votre recherche."
              : "Aucun département enregistré."}
          </p>
        </div>
      )}

      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((dept) => (
            <div
              key={dept._id}
              className="glass rounded-lg p-5 space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold truncate">
                      {dept.nom}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Code : {dept.code} • Resp.{" "}
                      {dept.chefDepartement
                        ? `${dept.chefDepartement.prenom} ${dept.chefDepartement.nom}`
                        : "—"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={`border-0 text-xs shrink-0 ${
                    dept.estActif
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {dept.estActif ? "Actif" : "Inactif"}
                </Badge>
              </div>

              {dept.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {dept.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-md bg-muted/30 text-center">
                  <p className="text-sm font-bold">{dept.nbFilieres ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Filières</p>
                </div>
                <div className="p-2.5 rounded-md bg-muted/30 text-center">
                  <p className="text-sm font-bold">{dept.nbEnseignants ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Enseignants</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    setEditDep(dept);
                    setOpen(true);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" /> Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  title={dept.estActif ? "Désactiver" : "Activer"}
                  onClick={() => handleToggle(dept)}
                >
                  <Power className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DepartementFormDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditDep(null);
        }}
        departement={editDep}
        onSubmit={handleSubmit}
        loading={actionStatus === "pending"}
      />
    </div>
  );
};

export default GestionDepartementPage;