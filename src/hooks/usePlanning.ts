import { useEffect, useState, useCallback } from "react";
import type { PlanningObjective } from "@/types/planning";
import { fetchPlanningList, createPlanning, updatePlanning, deletePlanning } from "@/lib/planningApi";
import { toast } from "sonner";

export function usePlanning() {
  const [objectives, setObjectives] = useState<PlanningObjective[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { objectives, progressMap } = await fetchPlanningList();
      setObjectives(objectives);
      setProgressMap(progressMap);
    } catch (error) {
      console.error("Error loading planning data:", error);
      toast.error("Error al cargar las planificaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreatePlanning = useCallback(
    async (payload: {
      title: string;
      description?: string | null;
      start_date?: string | null;
      end_date?: string | null;
      department_id?: string | null;
    }) => {
      try {
        const planning = await createPlanning({
          ...payload,
          status: "in_progress",
        });

        // optimista: agregamos la nueva planificación al estado
        setObjectives((prev) => [planning, ...prev]);
        setProgressMap((prev) => ({ ...prev, [planning.id]: 0 }));

        toast.success("Planificación creada correctamente");
      } catch (error) {
        console.error("Error creating planning:", error);
        toast.error("Error al crear la planificación");
        throw error;
      }
    },
    []
  );

  const handleUpdatePlanning = useCallback(
    async (id: string, payload: Partial<PlanningObjective>) => {
      try {
        const updated = await updatePlanning(id, payload);
        
        setObjectives((prev) => 
          prev.map((obj) => (obj.id === id ? updated : obj))
        );
        toast.success("Planificación actualizada correctamente");
      } catch (error) {
        console.error("Error updating planning:", error);
        toast.error("Error al actualizar la planificación");
        throw error;
      }
    },
    []
  );

  const handleDeletePlanning = useCallback(
    async (id: string) => {
      try {
        await deletePlanning(id);
        
        setObjectives((prev) => prev.filter((obj) => obj.id !== id));
        toast.success("Planificación eliminada correctamente");
      } catch (error) {
        console.error("Error deleting planning:", error);
        toast.error("Error al eliminar la planificación");
        throw error;
      }
    },
    []
  );

  return {
    objectives,
    progressMap,
    loading,
    reload: loadData,
    createPlanning: handleCreatePlanning,
    updatePlanning: handleUpdatePlanning,
    deletePlanning: handleDeletePlanning,
  };
}
