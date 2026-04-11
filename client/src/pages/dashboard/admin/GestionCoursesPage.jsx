import { BookOpen, Check, X, Archive, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  fetchModulesThunk,
  approuverModuleThunk,
  rejeterModuleThunk,
  archiverModuleThunk,
  resetModulesAction,
} from "@/features/modules/modules.slice";

import ModulesListSkeleton from "@/components/skeletons/modules-list-skeleton";
import RejectModuleDialog from "@/components/dashboard/modules/reject-module-dialog";
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

  const { data, status, error, actionStatus, pagination } = useSelector(
    (state) => state.modules,
  );

  const [activeTab, setActiveTab] = useState("en_revision");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  // Fetch selon l'onglet
  useEffect(() => {
    const params = { search };
    if (activeTab === "en_revision") params.statut = "en_revision";
    if (activeTab === "publie") params.statut = "publie";
    // "autres" = brouillons + archivés (on fetch sans statut et on filtre côté affichage)
    // pour simplifier : on fetch en 2 appels si besoin
    const timer = setTimeout(
      () => dispatch(fetchModulesThunk(params)),
      search ? 400 : 0,
    );
    return () => clearTimeout(timer);
  }, [activeTab, search, dispatch]);

  useEffect(() => {
    if (actionStatus === "failed") {
      toast.error("Une erreur est survenue.");
      dispatch(resetModulesAction());
    }
  }, [actionStatus, dispatch]);

  const handleApprove = async (m) => {
    const result = await dispatch(approuverModuleThunk(m._id));
    if (approuverModuleThunk.fulfilled.match(result)) {
      toast.success(`Module "${m.titre}" publié.`);
      // Rafraîchir l'onglet actuel
      dispatch(
        fetchModulesThunk({
          search,
          statut: activeTab === "en_revision" ? "en_revision" : undefined,
        }),
      );
    } else {
      toast.error(result.payload ?? "Erreur.");
    }
  };

  const handleReject = async (motif) => {
    if (!rejectTarget) return;
    const result = await dispatch(
      rejeterModuleThunk({ id: rejectTarget._id, motif }),
    );
    if (rejeterModuleThunk.fulfilled.match(result)) {
      toast.success("Module renvoyé en brouillon.");
      setRejectTarget(null);
      dispatch(fetchModulesThunk({ search, statut: "en_revision" }));
    } else {
      toast.error(result.payload ?? "Erreur.");
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    const result = await dispatch(archiverModuleThunk(archiveTarget._id));
    if (archiverModuleThunk.fulfilled.match(result)) {
      toast.success("Module archivé.");
      setArchiveTarget(null);
      dispatch(fetchModulesThunk({ search, statut: "publie" }));
    } else {
      toast.error(result.payload ?? "Erreur.");
    }
  };

  const handleRetry = () => {
    const params = { search };
    if (activeTab === "en_revision") params.statut = "en_revision";
    if (activeTab === "publie") params.statut = "publie";
    dispatch(fetchModulesThunk(params));
  };

  const renderModuleCard = (m) => {
    const st = statutLabel[m.statut];
    return (
      <div
        key={m._id}
        className="glass rounded-lg p-4 flex items-center justify-between animate-fade-in"
      >
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
              {m.enseignant?.prenom} {m.enseignant?.nom} •{" "}
              {m.niveau?.libelle ?? "—"} •{" "}
              {m.niveau?.filiere?.departement?.nom ?? "—"} •{" "}
              {m.nbChapitres ?? 0} chapitre(s)
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            title="Voir les détails"
            onClick={() => navigate(`/dashboard/admin/courses/${m._id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {m.statut === "en_revision" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-success hover:text-success"
                onClick={() => handleApprove(m)}
              >
                <Check className="h-3.5 w-3.5" /> Approuver
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => setRejectTarget(m)}
              >
                <X className="h-3.5 w-3.5" /> Rejeter
              </Button>
            </>
          )}
          {m.statut === "publie" && (
            <Button
              size="sm"
              variant="outline"
              title="Archiver"
              onClick={() => setArchiveTarget(m)}
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">
          Gestion des cours
        </h1>
        <p className="text-muted-foreground mt-1">
          {pagination.total} module{pagination.total > 1 ? "s" : ""} dans cette
          catégorie
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="en_revision">En révision</TabsTrigger>
          <TabsTrigger value="publie">Publiés</TabsTrigger>
          <TabsTrigger value="autres">Brouillons & archives</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-3">
          {status === "pending" && data.length === 0 && (
            <ModulesListSkeleton count={4} />
          )}

          {status === "failed" && (
            <ErrorState
              variant="inline"
              title="Impossible de charger les modules"
              message={error || "Une erreur est survenue."}
              onRetry={handleRetry}
            />
          )}

          {status === "succeeded" && data.length === 0 && (
            <div className="glass rounded-lg p-12 text-center">
              <p className="text-muted-foreground">Aucun module dans cette catégorie.</p>
            </div>
          )}

          {data.length > 0 && data.map(renderModuleCard)}
        </TabsContent>
      </Tabs>

      <RejectModuleDialog
        open={!!rejectTarget}
        onOpenChange={(v) => !v && setRejectTarget(null)}
        moduleTitle={rejectTarget?.titre}
        onConfirm={handleReject}
        loading={actionStatus === "pending"}
      />

      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(v) => !v && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver ce module ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le module <strong>{archiveTarget?.titre}</strong> ne sera plus
              visible pour les étudiants mais sera conservé pour l'historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GestionCoursesPage;