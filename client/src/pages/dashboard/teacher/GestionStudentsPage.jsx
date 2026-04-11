import { Search, Mail, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import { fetchUsersThunk } from "@/features/user/users.slice";
import UsersListSkeleton from "@/components/skeletons/users-list-skeleton";
import ErrorState from "@/components/dashboard/shared/error-state";

const GestionStudentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: students, status, pagination, error } = useSelector(
    (state) => state.users.byRole.etudiant,
  );

  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(
      () => dispatch(fetchUsersThunk({ role: "etudiant", search })),
      search ? 400 : 0,
    );
    return () => clearTimeout(timer);
  }, [search, dispatch]);

  const handleRetry = () =>
    dispatch(fetchUsersThunk({ role: "etudiant", search }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">
          Mes étudiants
        </h1>
        <p className="text-muted-foreground mt-1">
          {pagination.total} étudiant{pagination.total > 1 ? "s" : ""} — suivez
          leur progression
        </p>
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
              ? "Aucun étudiant ne correspond."
              : "Aucun étudiant rattaché à vos cours."}
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
                  <p className="font-medium truncate">
                    {s.prenom} {s.nom}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.email} • {s.classe?.nom ?? "—"}
                    {s.classe?.niveau?.libelle &&
                      ` • ${s.classe.niveau.libelle}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() =>
                    navigate(`/dashboard/teacher/students/${s._id}`)
                  }
                >
                  <Eye className="h-3.5 w-3.5" /> Détails
                </Button>
                <Button size="sm" variant="outline" title="Envoyer un message">
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GestionStudentsPage;