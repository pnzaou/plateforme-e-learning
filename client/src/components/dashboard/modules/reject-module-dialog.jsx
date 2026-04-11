import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const RejectModuleDialog = ({
  open,
  onOpenChange,
  moduleTitle = "",
  onConfirm,
  loading = false,
}) => {
  const [motif, setMotif] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setMotif("");
      setTouched(false);
    }
  }, [open]);

  const error =
    touched && motif.trim().length < 10
      ? "Le motif doit contenir au moins 10 caractères."
      : null;

  const handleConfirm = () => {
    setTouched(true);
    if (motif.trim().length < 10) return;
    onConfirm(motif.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rejeter le module</DialogTitle>
          <DialogDescription>
            Expliquez à l'enseignant pourquoi <strong>{moduleTitle}</strong> est
            renvoyé en brouillon. Ce motif lui sera transmis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>
            Motif <span className="text-destructive">*</span>
          </Label>
          <Textarea
            rows={5}
            placeholder="Expliquez les corrections nécessaires..."
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rejeter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectModuleDialog;