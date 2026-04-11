import { Plus, Search, Edit, ToggleLeft, ToggleRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  fetchUsersThunk,
  createUserThunk,
  updateUserThunk,
  toggleUserStatusThunk,
  resetActionStatus,
} from "@/features/user/users.slice";
import { fetchClassesThunk } from "@/features/academique/classes.slice";
import { fetchDepartementsThunk } from "@/features/academique/departements.slice";

import UserFormDialog from "@/components/dashboard/shared/user-form-dialog";
import UsersListSkeleton from "@/components/skeletons/users-list-skeleton";
import ErrorState from "@/components/dashboard/shared/error-state";

const GestionStudentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: students, status, pagination, error } = useSelector(
    (state) => state.users.byRole.etudiant,
  );
  const { actionStatus, actionError } = useSelector((state) => state.users);
  const { data: classes, status: classesStatus } = useSelector(
    (state) => state.classes,
  );
  const { data: departements, status: depStatus } = useSelector(
    (state) => state.departements,
  );

  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState("");
  const submittedAsEdit = useRef(false);

  // Chargement des classes & départements (pour le form)
  useEffect(() => {
    if (classesStatus === "idle") dispatch(fetchClassesThunk());
    if (depStatus === "idle") dispatch(fetchDepartementsThunk());
  }, [classesStatus, depStatus, dispatch]);

  // Fetch étudiants avec debounce
  useEffect(() => {
    const timer = setTimeout(
      () => dispatch(fetchUsersThunk({ role: "etudiant", search })),
      search ? 400 : 0,
    );
    return () => clearTimeout(timer);
  }, [search, dispatch]);

  // Feedback actions
  useEffect(() => {
    if (actionStatus === "succeeded") {
      toast.success(
        submittedAsEdit.current ? "Étudiant mis à jour." : "Étudiant créé.",
      );
      dispatch(resetActionStatus());
      setOpen(false);
      setEditUser(null);
    }
    if (actionStatus === "failed") {
      toast.error(actionError ?? "Une erreur est survenue.");
      dispatch(resetActionStatus());
    }
  }, [actionStatus, actionError, dispatch]);

  const handleSubmit = (data) => {
    submittedAsEdit.current = !!editUser;
    if (editUser) {
      dispatch(updateUserThunk({ id: editUser._id, data }));
    } else {
      dispatch(createUserThunk(data));
    }
  };

  const handleToggle = async (user) => {
    const result = await dispatch(toggleUserStatusThunk(user._id));
    if (toggleUserStatusThunk.fulfilled.match(result)) {
      toast.success(
        `Compte ${result.payload.user.estActif ? "activé" : "désactivé"}.`,
      );
      if (result.payload.warning) toast.warning(result.payload.warning);
    } else {
      toast.error(result.payload ?? "Erreur.");
    }
  };

  const handleRetry = () =>
    dispatch(fetchUsersThunk({ role: "etudiant", search }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Gestion des étudiants
          </h1>
          <p className="text-muted-foreground mt-1">
            {pagination.total} étudiant{pagination.total > 1 ? "s" : ""} inscrit
            {pagination.total > 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditUser(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Ajouter un étudiant
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un étudiant..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {status === "pending" && students.length === 0 && (
        <UsersListSkeleton count={5} />
      )}

      {status === "failed" && (
        <ErrorState
          variant="inline"
          title="Impossible de charger les étudiants"
          message={error || "Une erreur est survenue."}
          onRetry={handleRetry}
        />
      )}

      {status === "succeeded" && students.length === 0 && (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {search
              ? "Aucun étudiant ne correspond à votre recherche."
              : "Aucun étudiant enregistré."}
          </p>
        </div>
      )}

      {students.length > 0 && (
        <div className="grid gap-3">
          {students.map((s) => (
            <div
              key={s._id}
              className="glass rounded-lg p-4 flex items-center justify-between animate-fade-in"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {s.prenom?.[0]}
                    {s.nom?.[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">
                      {s.prenom} {s.nom}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`border-0 text-xs ${
                        s.estActif
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {s.estActif ? "Actif" : "Désactivé"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.matricule} • {s.email}
                    {s.classe?.nom && ` • ${s.classe.nom}`}
                    {s.classe?.niveau?.libelle &&
                      ` • ${s.classe.niveau.libelle}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  title="Voir les détails"
                  onClick={() =>
                    navigate(`/dashboard/admin/students/${s._id}`)
                  }
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditUser(s);
                    setOpen(true);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  title={s.estActif ? "Désactiver" : "Activer"}
                  onClick={() => handleToggle(s)}
                >
                  {s.estActif ? (
                    <ToggleRight className="h-3.5 w-3.5" />
                  ) : (
                    <ToggleLeft className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UserFormDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditUser(null);
        }}
        actorRole="admin"
        user={editUser}
        allowedRoles={["etudiant"]}
        departements={departements}
        classes={classes}
        onSubmit={handleSubmit}
        loading={actionStatus === "pending"}
      />
    </div>
  );
};

export default GestionStudentsPage;