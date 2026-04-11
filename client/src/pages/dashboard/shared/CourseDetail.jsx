import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  BookOpen,
  User as UserIcon,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  fetchModuleByIdThunk,
  clearCurrentModule,
} from "@/features/modules/modules.slice";
import {
  fetchChapitresThunk,
  clearChapitres,
} from "@/features/chapitres/chapitres.slice";

import ChapitresList from "@/components/dashboard/chapitres/chapitres-list";
import CourseDetailSkeleton from "@/components/skeletons/course-details-skeleton";
import ErrorState from "@/components/dashboard/shared/error-state";

const statutLabel = {
  brouillon: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  en_revision: { label: "En révision", color: "bg-warning/10 text-warning" },
  publie: { label: "Publié", color: "bg-success/10 text-success" },
  archive: { label: "Archivé", color: "bg-muted text-muted-foreground" },
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data: moduleData, status: moduleStatus, error: moduleError } =
    useSelector((state) => state.modules.current);
  const {
    data: chapitres,
    status: chapStatus,
    error: chapError,
  } = useSelector((state) => state.chapitres);
  const { userData } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchModuleByIdThunk(id));
    dispatch(fetchChapitresThunk(id));
    return () => {
      dispatch(clearCurrentModule());
      dispatch(clearChapitres());
    };
  }, [id, dispatch]);

  if (moduleStatus === "pending" || (moduleStatus === "idle" && !moduleData)) {
    return <CourseDetailSkeleton />;
  }

  if (moduleStatus === "failed") {
    return (
      <ErrorState
        title="Impossible de charger le module"
        message={moduleError || "Une erreur est survenue."}
        onRetry={() => {
          dispatch(fetchModuleByIdThunk(id));
          dispatch(fetchChapitresThunk(id));
        }}
      />
    );
  }

  if (!moduleData) return null;

  const st = statutLabel[moduleData.statut];
  const isAdmin = userData?.role === "admin";
  const isOwner = moduleData.enseignant?._id === userData?._id;

  // Qui peut modifier les chapitres ?
  const canEdit =
    (isAdmin || isOwner) &&
    moduleData.statut !== "en_revision" &&
    moduleData.statut !== "archive" &&
    !(moduleData.statut === "publie" && !isAdmin);

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>

      {/* Header module */}
      <div className="glass rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-heading font-bold">
                {moduleData.titre}
              </h1>
              <Badge variant="outline">{moduleData.code}</Badge>
              <Badge
                variant="secondary"
                className={`border-0 ${st.color}`}
              >
                {st.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <UserIcon className="h-3.5 w-3.5" />
              {moduleData.enseignant?.prenom} {moduleData.enseignant?.nom}
              {" • "}
              {moduleData.niveau?.libelle} —{" "}
              {moduleData.niveau?.filiere?.nom}
              {" • "}
              Coeff. {moduleData.coefficient}
            </p>
          </div>
        </div>

        {moduleData.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {moduleData.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {chapitres.length} chapitre(s)
          </span>
          {moduleData.approuvePar && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Approuvé par {moduleData.approuvePar.prenom}{" "}
              {moduleData.approuvePar.nom}
            </span>
          )}
        </div>

        {moduleData.statut === "brouillon" && moduleData.motifRejet && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs">
            <p className="font-medium">Module rejeté</p>
            <p className="opacity-90 mt-1">{moduleData.motifRejet}</p>
          </div>
        )}
      </div>

      {/* Chapitres */}
      {chapStatus === "failed" ? (
        <ErrorState
          variant="inline"
          title="Impossible de charger les chapitres"
          message={chapError || "Une erreur est survenue."}
          onRetry={() => dispatch(fetchChapitresThunk(id))}
        />
      ) : (
        <ChapitresList
          moduleId={id}
          chapitres={chapitres}
          canEdit={canEdit}
        />
      )}
    </div>
  );
};

export default CourseDetail;