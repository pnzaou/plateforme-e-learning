import { GraduationCap, Plus, Edit, Power, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import {
  fetchFilieresThunk,
  createFiliereThunk,
  updateFiliereThunk,
  toggleFiliereStatusThunk,
  resetFilieresAction,
} from "@/features/academique/filieres.slice";
import { fetchDepartementsThunk } from "@/features/academique/departements.slice";

import AcademiqueListSkeleton from "@/components/skeletons/academique-list-skeleton";
import ErrorState from "@/components/dashboard/shared/error-state";
import FiliereFormDialog from "@/components/dashboard/academique/filiere-form-dialog";

const GestionFilieresPage = () => {
  const dispatch = useDispatch();
  const { data, status, error, actionStatus, actionError } = useSelector(
    (state) => state.filieres,
  );
  const { data: departements, status: depStatus } = useSelector(
    (state) => state.departements,
  );

  const [open, setOpen] = useState(false);
  const [editFiliere, setEditFiliere] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDep, setFilterDep] = useState("all");
  const submittedAsEdit = useRef(false);

  // Charger les départements (pour le filtre + le formulaire)
  useEffect(() => {
    if (depStatus === "idle") dispatch(fetchDepartementsThunk());
  }, [depStatus, dispatch]);

  // Fetch des filières (recherche + filtre département)
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (filterDep !== "all") params.departement = filterDep;

    const timer = setTimeout(
      () => dispatch(fetchFilieresThunk(params)),
      search ? 400 : 0,
    );
    return () => clearTimeout(timer);
  }, [search, filterDep, dispatch]);

  // Feedback actions
  useEffect(() => {
    if (actionStatus === "succeeded") {
      toast.success(
        submittedAsEdit.current ? "Filière mise à jour." : "Filière créée.",
      );
      dispatch(resetFilieresAction());
      setOpen(false);
      setEditFiliere(null);
    }
    if (actionStatus === "failed") {
      toast.error(actionError ?? "Une erreur est survenue.");
      dispatch(resetFilieresAction());
    }
  }, [actionStatus, actionError, dispatch]);

  const handleSubmit = (formData) => {
    submittedAsEdit.current = !!editFiliere;
    if (editFiliere) {
      dispatch(updateFiliereThunk({ id: editFiliere._id, data: formData }));
    } else {
      dispatch(createFiliereThunk(formData));
    }
  };

  const handleToggle = async (filiere) => {
    const result = await dispatch(toggleFiliereStatusThunk(filiere._id));
    if (toggleFiliereStatusThunk.fulfilled.match(result)) {
      toast.success(
        `Filière ${result.payload.filiere.estActif ? "activée" : "désactivée"}.`,
      );
      if (result.payload.warning) toast.warning(result.payload.warning);
    } else {
      toast.error(result.payload ?? "Erreur.");
    }
  };

  const handleRetry = () => {
    const params = {};
    if (search) params.search = search;
    if (filterDep !== "all") params.departement = filterDep;
    dispatch(fetchFilieresThunk(params));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Filières
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les filières des départements
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditFiliere(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nouvelle filière
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterDep} onValueChange={setFilterDep}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Filtrer par département" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les départements</SelectItem>
            {departements.map((d) => (
              <SelectItem key={d._id} value={d._id}>
                {d.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {status === "pending" && data.length === 0 && (
        <AcademiqueListSkeleton count={4} columns={2} />
      )}

      {status === "failed" && (
        <ErrorState
          variant="inline"
          title="Impossible de charger les filières"
          message={error || "Une erreur est survenue."}
          onRetry={handleRetry}
        />
      )}

      {status === "succeeded" && data.length === 0 && (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {search || filterDep !== "all"
              ? "Aucune filière ne correspond à vos critères."
              : "Aucune filière enregistrée."}
          </p>
        </div>
      )}

      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((f) => (
            <div
              key={f._id}
              className="glass rounded-lg p-5 space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold truncate">{f.nom}</h3>
                    <p className="text-xs text-muted-foreground">
                      {f.code} • {f.departement?.nom ?? "—"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={`border-0 text-xs shrink-0 ${
                    f.estActif
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {f.estActif ? "Active" : "Inactive"}
                </Badge>
              </div>

              {f.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {f.description}
                </p>
              )}

              <div className="p-2.5 rounded-md bg-muted/30 text-center">
                <p className="text-sm font-bold">{f.nbNiveaux ?? 0}</p>
                <p className="text-xs text-muted-foreground">Niveaux</p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    setEditFiliere(f);
                    setOpen(true);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" /> Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggle(f)}
                >
                  <Power className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FiliereFormDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditFiliere(null);
        }}
        filiere={editFiliere}
        departements={departements}
        onSubmit={handleSubmit}
        loading={actionStatus === "pending"}
      />
    </div>
  );
};

export default GestionFilieresPage;