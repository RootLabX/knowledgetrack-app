import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // O "@/hooks/use-toast" si usas el otro, mantengo el de tu código

// 1. Definimos la interfaz del Sprint (Hijo)
export interface PlanningSprint {
  id: string;
  planning_id: string;
  title: string;
  goal?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  created_at?: string;
  created_by?: string | null;
}

// 2. Actualizamos la interfaz del Objetivo (Padre) para incluir los sprints
export interface PlanningObjective {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  created_by: string;
  // Esta propiedad es la clave para que TypeScript no se queje
  planning_sprints?: PlanningSprint[]; 
}

export const usePlanningDetail = (planId?: string) => {
  const [plan, setPlan] = useState<PlanningObjective | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    // Si no hay ID, no hacemos nada
    if (!planId) return;

    try {
      setLoading(true);

      // 3. Consulta corregida: Pedimos los datos del padre Y los hijos (sprints)
      const { data, error } = await supabase
        .schema("mapper")
        .from("planning_objectives")
        .select(`
          *,
          planning_sprints (*)
        `)
        .eq("id", planId) // Aquí usamos la variable planId que viene de los argumentos
        .single();

      if (error) {
        console.error("Error fetching plan:", error);
        toast.error("No se pudo cargar la planificación");
        setPlan(null);
        return;
      }

      // Convertimos los datos para asegurar que coincidan con la interfaz
      // (A veces Supabase devuelve null en arrays vacíos, esto lo asegura)
      const formattedData: PlanningObjective = {
        ...data,
        planning_sprints: data.planning_sprints || []
      };

      setPlan(formattedData);
    } catch (err) {
      console.error("Error inesperado:", err);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void fetchPlan();
  }, [fetchPlan]);

  return { plan, loading, refetch: fetchPlan };
};