import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface CreateSprintDialogProps {
  onCreate: (data: {
    title: string;
    goal?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  }) => Promise<void> | void;
  triggerLabel?: string;
  variant?: "default" | "outline" | "ghost";
}

export function CreateSprintDialog({ 
  onCreate, 
  triggerLabel = "Nuevo Sprint", 
  variant = "default" 
}: CreateSprintDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await onCreate({
        title: title.trim(),
        goal: goal.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      setOpen(false);
      // Resetear formulario
      setTitle("");
      setGoal("");
      setStartDate("");
      setEndDate("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant}
          className={variant === 'default' ? "bg-primary hover:bg-primary/90 text-white shadow-sm" : ""}
        >
          <Plus className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nuevo Sprint</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sprintTitle">Nombre del Sprint</Label>
              <Input
                id="sprintTitle"
                placeholder="Ej: Sprint 1 - Inicio de desarrollo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprintGoal">Objetivo del Sprint</Label>
              <Textarea
                id="sprintGoal"
                placeholder="¿Qué queremos lograr en este sprint?"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sprintStart">Fecha de inicio</Label>
                <Input
                  id="sprintStart"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprintEnd">Fecha de fin</Label>
                <Input
                  id="sprintEnd"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear Sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}