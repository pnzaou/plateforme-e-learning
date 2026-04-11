import { Plus, Search, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import UserFormDialog from "@/components/dashboard/shared/user-form-dialog";
import UsersListSkeleton from "@/components/skeletons/users-list-skeleton";
import ErrorState from "@/components/dashboard/shared/error-state";
import {
  fetchUsersThunk,
  createUserThunk,
  updateUserThunk,
  toggleUserStatusThunk,
  resetActionStatus,
} from "@/features/user/users.slice";
import { fetchDepartementsThunk } from "@/features/academique/departements.slice";

const GestionTeachersPage = () => {
  const dispatch = useDispatch();

  const {
    data: teachers,
    status,
    pagination,
    error,
  } = useSelector((state) => state.users.byRole.enseignant);
  const { actionStatus, actionError } = useSelector((state) => state.users);

  const { data: departements, status: depStatus } = useSelector(
    (state) => state.departements,
  );

  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState("");

  // on capture le mode (création/édition) au moment du submit
  // pour que le toast affiche le bon message même si editUser change après
  const submittedAsEdit = useRef(false);

  useEffect(() => {
    if (depStatus === "idle") dispatch(fetchDepartementsThunk());
  }, [depStatus, dispatch]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        dispatch(fetchUsersThunk({ role: "enseignant", search }));
      },
      search ? 400 : 0,
    ); // pas de debounce au premier load
    return () => clearTimeout(timer);
  }, [search, dispatch]);

  // Feedback actions create/update
  useEffect(() => {
    if (actionStatus === "succeeded") {
      toast.success(
        submittedAsEdit.current ? "Enseignant mis à jour." : "Enseignant créé.",
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
      // ✅ FIX 3 : warning lu depuis payload, pas depuis meta
      toast.success(
        `Compte ${result.payload.user.estActif ? "activé" : "désactivé"}.`,
      );
      if (result.payload.warning) toast.warning(result.payload.warning);
    } else {
      toast.error(result.payload ?? "Erreur lors du changement de statut.");
    }
  };

  const handleRetry = () => {
    dispatch(fetchUsersThunk({ role: "enseignant", search }));
  };

  // ✅ FIX 4 : plus de filter client, on utilise directement teachers du store

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">
            Gestion des enseignants
          </h1>
          <p className="text-muted-foreground mt-1">
            {pagination.total} enseignant{pagination.total > 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditUser(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Ajouter un enseignant
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un enseignant..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ✅ FIX 6 : skeleton au premier chargement seulement */}
      {status === "pending" && teachers.length === 0 && (
        <UsersListSkeleton count={5} />
      )}

      {status === "failed" && (
        <ErrorState
          variant="inline"
          title="Impossible de charger les enseignants"
          message={error || "Une erreur est survenue."}
          onRetry={handleRetry}
        />
      )}

      {status === "succeeded" && teachers.length === 0 && (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {search
              ? "Aucun enseignant ne correspond à votre recherche."
              : "Aucun enseignant enregistré."}
          </p>
        </div>
      )}

      {teachers.length > 0 && (
        <div className="grid gap-3">
          {teachers.map((t) => (
            <div
              key={t._id}
              className="glass rounded-lg p-4 flex items-center justify-between animate-fade-in"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {t.prenom?.[0]}
                    {t.nom?.[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">
                      {t.prenom} {t.nom}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`border-0 text-xs ${
                        t.estActif
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {t.estActif ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.email} • {t.specialite || "—"} •{" "}
                    {t.departement?.nom ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditUser(t);
                    setOpen(true);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  title={t.estActif ? "Désactiver" : "Activer"}
                  onClick={() => handleToggle(t)}
                >
                  {t.estActif ? (
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
        allowedRoles={["enseignant"]}
        departements={departements}
        onSubmit={handleSubmit}
        loading={actionStatus === "pending"}
      />
    </div>
  );
};

export default GestionTeachersPage;
