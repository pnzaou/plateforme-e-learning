import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Trophy,
  TrendingUp,
  FileText,
  ClipboardCheck,
  Calendar,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  fetchUserDetailsThunk,
  clearCurrentDetails,
} from "@/features/user/users.slice";

import StudentDetailSkeleton from "@/components/skeletons/student-detail-skeleton";
import ErrorState from "./error-state";

const mentionLabels = {
  excellent: { label: "Excellent", color: "bg-success/10 text-success" },
  tres_bien: { label: "Très bien", color: "bg-success/10 text-success" },
  bien: { label: "Bien", color: "bg-primary/10 text-primary" },
  assez_bien: { label: "Assez bien", color: "bg-primary/10 text-primary" },
  passable: { label: "Passable", color: "bg-warning/10 text-warning" },
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data, status, error } = useSelector(
    (state) => state.users.currentDetails,
  );

  useEffect(() => {
    dispatch(fetchUserDetailsThunk(id));
    return () => {
      dispatch(clearCurrentDetails());
    };
  }, [id, dispatch]);

  const handleRetry = () => dispatch(fetchUserDetailsThunk(id));

  if (status === "pending" || (status === "idle" && !data)) {
    return <StudentDetailSkeleton />;
  }

  if (status === "failed") {
    return (
      <ErrorState
        title="Impossible de charger le profil"
        message={error || "Une erreur est survenue."}
        onRetry={handleRetry}
      />
    );
  }

  if (!data?.user) return null;

  const {
    user,
    stats,
    notes = [],
    progressions = [],
    recentSubmissions = [],
    recentQuizzes = [],
  } = data;

  const isStudent = user.role === "etudiant";

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>

      {/* Header profil */}
      <div className="glass rounded-lg p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary">
              {user.prenom?.[0]}
              {user.nom?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-heading font-bold">
                {user.prenom} {user.nom}
              </h1>
              <Badge
                variant="secondary"
                className={`border-0 ${
                  user.estActif
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {user.estActif ? "Actif" : "Désactivé"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </span>
              {user.telephone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {user.telephone}
                </span>
              )}
              {isStudent && user.matricule && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" /> {user.matricule}
                </span>
              )}
            </div>
            {isStudent && user.classe && (
              <p className="text-sm text-muted-foreground mt-1">
                {user.classe.nom} • {user.classe.niveau?.libelle} •{" "}
                {user.classe.niveau?.filiere?.nom} •{" "}
                {user.classe.niveau?.filiere?.departement?.nom}
              </p>
            )}
          </div>
        </div>
      </div>

      {!isStudent && (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            Les statistiques détaillées ne sont disponibles que pour les
            étudiants.
          </p>
        </div>
      )}

      {isStudent && stats && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Trophy className="h-3.5 w-3.5" /> Moyenne
              </div>
              <p className="text-2xl font-bold text-primary">
                {stats.moyenneGenerale ?? "—"}
                {stats.moyenneGenerale && (
                  <span className="text-sm text-muted-foreground">/20</span>
                )}
              </p>
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Progression
              </div>
              <p className="text-2xl font-bold">{stats.progressionMoyenne}%</p>
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <FileText className="h-3.5 w-3.5" /> Devoirs
              </div>
              <p className="text-2xl font-bold">{stats.nbDevoirsSoumis}</p>
            </div>
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <ClipboardCheck className="h-3.5 w-3.5" /> Quiz faits
              </div>
              <p className="text-2xl font-bold">{stats.nbQuizFaits}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes par module */}
            <div className="glass rounded-lg p-5 space-y-4">
              <h2 className="font-heading font-bold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Notes par module
              </h2>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune note enregistrée.
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => {
                    const mention = mentionLabels[n.mention];
                    return (
                      <div
                        key={n._id}
                        className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {n.module?.titre}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {n.module?.code} • Coeff. {n.module?.coefficient}
                            {n.rang && ` • Rang ${n.rang}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {mention && (
                            <Badge
                              variant="secondary"
                              className={`${mention.color} border-0 text-xs`}
                            >
                              {mention.label}
                            </Badge>
                          )}
                          <span className="text-sm font-bold">
                            {n.noteMoyenne ?? "—"}/20
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Progression par module */}
            <div className="glass rounded-lg p-5 space-y-4">
              <h2 className="font-heading font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Progression
              </h2>
              {progressions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune progression enregistrée.
                </p>
              ) : (
                <div className="space-y-4">
                  {progressions.map((p) => (
                    <div key={p._id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">
                          {p.module?.titre}
                        </span>
                        <span className="text-primary font-medium shrink-0 ml-2">
                          {p.pourcentage}%
                        </span>
                      </div>
                      <Progress value={p.pourcentage} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        Dernière activité : {formatDate(p.derniereActiviteAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Soumissions récentes */}
            <div className="glass rounded-lg p-5 space-y-4">
              <h2 className="font-heading font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Soumissions
                récentes
              </h2>
              {recentSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune soumission.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSubmissions.map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {s.devoir?.titre}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(s.dateSoumission)}
                          {s.estTardif && (
                            <Badge
                              variant="secondary"
                              className="bg-destructive/10 text-destructive border-0 text-xs ml-1"
                            >
                              Tardif
                            </Badge>
                          )}
                        </p>
                      </div>
                      {s.note !== null ? (
                        <Badge
                          variant="secondary"
                          className="bg-success/10 text-success border-0 shrink-0"
                        >
                          {s.note}/20
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-warning/10 text-warning border-0 shrink-0 text-xs"
                        >
                          {s.statut === "corrige" ? "Corrigé" : "En attente"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quiz récents */}
            <div className="glass rounded-lg p-5 space-y-4">
              <h2 className="font-heading font-bold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Quiz récents
              </h2>
              {recentQuizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun quiz complété.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentQuizzes.map((q) => (
                    <div
                      key={q._id}
                      className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {q.quiz?.titre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {q.quiz?.module?.titre} • {formatDate(q.soumisAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {q.score}/{q.scoreMax}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`border-0 ${
                            q.noteFinale >= 14
                              ? "bg-success/10 text-success"
                              : q.noteFinale >= 10
                                ? "bg-warning/10 text-warning"
                                : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {q.noteFinale}/20
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDetail;