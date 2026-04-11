import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  FileText,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

import {
  createChapitreThunk,
  updateChapitreThunk,
  toggleChapitrePublicationThunk,
  reorderChapitresThunk,
  deleteChapitreThunk,
} from "@/features/chapitres/chapitres.slice";

import ChapitreFormDialog from "./chapitre-form-dialog";

const ChapitresList = ({ moduleId, chapitres, canEdit = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [expanded, setExpanded] = useState(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [formCtx, setFormCtx] = useState({
    chapitre: null,
    isSubChapter: false,
    parent: null,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setFormCtx({ chapitre: null, isSubChapter: false, parent: null });
    setFormOpen(true);
  };

  const openCreateSub = (parent) => {
    setFormCtx({ chapitre: null, isSubChapter: true, parent });
    setFormOpen(true);
  };

  const openEdit = (chapitre) => {
    setFormCtx({ chapitre, isSubChapter: false, parent: null });
    setFormOpen(true);
  };

  // Navigation vers la page de gestion des contenus d'un chapitre
  const goToContents = (chapitre) => {
    navigate(`/dashboard/chapitres/${chapitre._id}/contenus`, {
      state: {
        moduleId,
        chapitreTitle: chapitre.titre,
        backUrl: location.pathname,
      },
    });
  };

  const handleSubmit = async (formData) => {
    const { chapitre, parent } = formCtx;
    const isEdit = !!chapitre;

    if (isEdit) {
      const result = await dispatch(
        updateChapitreThunk({ id: chapitre._id, data: formData }),
      );
      if (updateChapitreThunk.fulfilled.match(result)) {
        toast.success("Chapitre mis à jour.");
        setFormOpen(false);
      } else {
        toast.error(result.payload ?? "Erreur.");
      }
    } else {
      const payload = { ...formData };
      if (parent) payload.parentChapitre = parent._id;
      const result = await dispatch(
        createChapitreThunk({ moduleId, data: payload }),
      );
      if (createChapitreThunk.fulfilled.match(result)) {
        toast.success("Chapitre créé.");
        setFormOpen(false);
      } else {
        toast.error(result.payload ?? "Erreur.");
      }
    }
  };

  const handleTogglePublication = async (ch) => {
    const result = await dispatch(toggleChapitrePublicationThunk(ch._id));
    if (toggleChapitrePublicationThunk.fulfilled.match(result)) {
      toast.success(
        `Chapitre ${result.payload.estPublie ? "publié" : "dépublié"}.`,
      );
    } else {
      toast.error(result.payload ?? "Erreur.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteChapitreThunk(deleteTarget._id));
    if (deleteChapitreThunk.fulfilled.match(result)) {
      toast.success("Chapitre supprimé.");
    } else {
      toast.error(result.payload ?? "Suppression impossible.");
    }
    setDeleteTarget(null);
  };

  // Swap d'ordre entre deux chapitres dans le même scope
  const handleMove = (list, index, direction, parentId = null) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const a = list[index];
    const b = list[targetIndex];
    const items = list.map((item, i) => ({
      id: item._id,
      ordre:
        i === index ? b.ordre : i === targetIndex ? a.ordre : item.ordre,
      parentChapitre: parentId,
    }));

    dispatch(reorderChapitresThunk({ moduleId, items }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg">Chapitres</h2>
        {canEdit && (
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter un chapitre
          </Button>
        )}
      </div>

      {chapitres.length === 0 ? (
        <div className="glass rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {canEdit
              ? "Aucun chapitre pour l'instant. Commencez par en ajouter un !"
              : "Aucun chapitre publié."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chapitres.map((ch, index) => {
            const isExpanded = expanded.has(ch._id);
            const hasSous = ch.sousChapitres && ch.sousChapitres.length > 0;

            return (
              <div
                key={ch._id}
                className="glass rounded-lg overflow-hidden animate-fade-in"
              >
                <div className="p-4 flex items-center gap-3">
                  <button
                    onClick={() => toggleExpand(ch._id)}
                    className="shrink-0 p-1 hover:bg-muted/50 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {ch.ordre}. {ch.titre}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs ${
                          ch.estPublie
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ch.estPublie ? "Publié" : "Brouillon"}
                      </Badge>
                    </div>
                    {ch.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {ch.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {ch.nbContenus ?? 0} contenu(s)
                      {hasSous && ` • ${ch.sousChapitres.length} sous-chapitre(s)`}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => handleMove(chapitres, index, "up")}
                        title="Monter"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === chapitres.length - 1}
                        onClick={() => handleMove(chapitres, index, "down")}
                        title="Descendre"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePublication(ch)}
                        title={ch.estPublie ? "Dépublier" : "Publier"}
                      >
                        {ch.estPublie ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(ch)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(ch)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-border/30 bg-muted/20 p-3 space-y-2">
                    {hasSous && (
                      <div className="space-y-2">
                        {ch.sousChapitres.map((sub, subIdx) => (
                          <div
                            key={sub._id}
                            className="flex items-center gap-3 p-2.5 rounded-md bg-background/50"
                          >
                            <span className="text-xs text-muted-foreground shrink-0">
                              {ch.ordre}.{sub.ordre}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {sub.titre}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className={`border-0 text-xs ${
                                    sub.estPublie
                                      ? "bg-success/10 text-success"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {sub.estPublie ? "Publié" : "Brouillon"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {sub.nbContenus ?? 0} contenu(s)
                              </p>
                            </div>
                            {canEdit && (
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => goToContents(sub)}
                                  title="Gérer les contenus"
                                >
                                  <Settings2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={subIdx === 0}
                                  onClick={() =>
                                    handleMove(
                                      ch.sousChapitres,
                                      subIdx,
                                      "up",
                                      ch._id,
                                    )
                                  }
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={
                                    subIdx === ch.sousChapitres.length - 1
                                  }
                                  onClick={() =>
                                    handleMove(
                                      ch.sousChapitres,
                                      subIdx,
                                      "down",
                                      ch._id,
                                    )
                                  }
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTogglePublication(sub)}
                                >
                                  {sub.estPublie ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEdit(sub)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteTarget(sub)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 flex-1"
                          onClick={() => goToContents(ch)}
                        >
                          <Settings2 className="h-3.5 w-3.5" /> Gérer les contenus ({ch.nbContenus ?? 0})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => openCreateSub(ch)}
                        >
                          <Plus className="h-3.5 w-3.5" /> Sous-chapitre
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ChapitreFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        chapitre={formCtx.chapitre}
        isSubChapter={formCtx.isSubChapter}
        parentTitle={formCtx.parent?.titre}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce chapitre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le chapitre <strong>{deleteTarget?.titre}</strong> sera supprimé.
              Cette action nécessite qu'il soit vide (pas de contenus ni de
              sous-chapitres).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

export default ChapitresList;