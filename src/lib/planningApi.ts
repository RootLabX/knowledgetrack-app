import { supabase } from "@/integrations/supabase/client";
import type { PlanningObjective } from "@/types/planning";

// ==========================================
// 1. CONSTANTES Y TIPOS
// ==========================================
const DB_SCHEMA = "mapper";

const TABLES = {
  OBJECTIVES: "planning_objectives",
  SPRINTS: "planning_sprints",
  TASKS: "planning_tasks",
  SUBTASKS: "planning_subtasks",
} as const;

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  created_at: string;
}

export interface PlanningListResponse {
  objectives: PlanningObjective[];
  progressMap: Record<string, number>;
}

export interface CreatePlanningPayload {
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  department_id?: string | null;
}

export interface CreateSprintDTO {
  planning_id: string;
  title: string;
  start_date: string;
  end_date: string;
  goal?: string | null;
  created_by?: string;
}

export interface Task {
  id: string;
  sprint_id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  points?: number;
  due_date?: string;
  assignee_id?: string;
  tags?: string[];
  created_at: string;
  planning_subtasks?: Subtask[];
}

export interface CreateTaskDTO {
  sprint_id: string;
  title: string;
  status?: string;
  priority?: "low" | "medium" | "high";
  points?: number;
  due_date?: string;
}

// ==========================================
// 2. SERVICIOS: PLANNING
// ==========================================

export async function fetchPlanningList(): Promise<PlanningListResponse> {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.OBJECTIVES)
    .select(`
      *,
      planning_sprints (
        *,
        planning_tasks (status)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching planning list:", error);
    throw error;
  }

  return {
    objectives: (data as unknown as PlanningObjective[]) || [],
    progressMap: {}
  };
}

export async function createPlanning(payload: CreatePlanningPayload): Promise<PlanningObjective> {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.OBJECTIVES)
    .insert([{
      title: payload.title,
      description: payload.description,
      start_date: payload.start_date,
      end_date: payload.end_date,
      status: payload.status || 'active',
      department_id: payload.department_id
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating planning:", error);
    throw error;
  }

  return data as unknown as PlanningObjective;
}

export async function updatePlanning(id: string, payload: Partial<CreatePlanningPayload>): Promise<PlanningObjective> {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.OBJECTIVES)
    .update({
      title: payload.title,
      description: payload.description,
      start_date: payload.start_date,
      end_date: payload.end_date,
      status: payload.status,
      department_id: payload.department_id
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating planning:", error);
    throw error;
  }

  return data as unknown as PlanningObjective;
}

/**
 * Elimina una planificación.
 * NOTA: Requiere que la base de datos tenga configurado ON DELETE CASCADE
 * en las relaciones (Sprints -> Tasks -> Subtasks).
 */
export async function deletePlanning(id: string): Promise<void> {
  console.log("Iniciando eliminación de plan (Cascade):", id);

  const { error, count } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.OBJECTIVES)
    .delete({ count: 'exact' })
    .eq("id", id);

  if (error) {
    console.error("Error deleting planning:", error);
    throw error;
  }
  
  // Si count es 0, significa que el ID no existía O que RLS bloqueó la operación.
  if (count === 0) {
      console.warn("ADVERTENCIA: La eliminación retornó éxito pero 0 filas afectadas.");
      throw new Error("No se pudo eliminar la planificación. Verifica permisos o existencia.");
  }

  console.log("Planificación eliminada correctamente. Filas afectadas (padre):", count);
}

export async function getPlanningById(planId: string): Promise<PlanningObjective> {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.OBJECTIVES)
    .select("*")
    .eq("id", planId)
    .single();

  if (error) throw error;
  return data as unknown as PlanningObjective;
}

// ==========================================
// 3. SERVICIOS: SPRINTS
// ==========================================

export const getSprintById = async (sprintId: string) => {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.SPRINTS)
    .select("*")
    .eq("id", sprintId)
    .single();

  if (error) throw error;
  return data;
};

export const createSprint = async (sprintData: CreateSprintDTO) => {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.SPRINTS)
    .insert([
      {
        planning_id: sprintData.planning_id,
        title: sprintData.title,
        start_date: sprintData.start_date,
        end_date: sprintData.end_date,
        created_by: sprintData.created_by,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSprint = async (sprintId: string, updates: Partial<CreateSprintDTO>) => {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.SPRINTS)
    .update({
      title: updates.title,
      start_date: updates.start_date,
      end_date: updates.end_date,
      goal: updates.goal,
    })
    .eq("id", sprintId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSprint = async (sprintId: string) => {
  const { error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.SPRINTS)
    .delete()
    .eq("id", sprintId);

  if (error) throw error;
};

// ==========================================
// 4. SERVICIOS: TASKS
// ==========================================

export const getSprintTasks = async (sprintId: string) => {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.TASKS)
    .select("*, planning_subtasks(*)")
    .eq("sprint_id", sprintId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Task[];
};

export const createTask = async (taskData: CreateTaskDTO) => {
  if (!taskData.sprint_id) throw new Error("Sprint ID is required");

  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.TASKS)
    .insert([
      {
        sprint_id: taskData.sprint_id,
        title: taskData.title,
        status: taskData.status || "todo",
        priority: taskData.priority || "medium",
        points: taskData.points || 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTaskStatus = async (taskId: string, newStatus: string) => {
  const { error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.TASKS)
    .update({ status: newStatus })
    .eq("id", taskId);

  if (error) throw error;
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  const { data, error } = await supabase
    .schema(DB_SCHEMA) // CORREGIDO: Usaba "mapper" hardcoded
    .from(TABLES.TASKS) // CORREGIDO: Usaba "planning_tasks" hardcoded
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .schema(DB_SCHEMA) // CORREGIDO: Usaba "mapper" hardcoded
    .from(TABLES.TASKS) // CORREGIDO: Usaba "planning_tasks" hardcoded
    .delete()
    .eq("id", taskId);

  if (error) throw error;
};

// ==========================================
// 5. SERVICIOS: SUBTASKS
// ==========================================

export const getSubtasks = async (taskId: string) => {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.SUBTASKS)
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Subtask[];
};

export const createSubtask = async (taskId: string, title: string) => {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.SUBTASKS)
    .insert([
      {
        task_id: taskId,
        title: title,
        status: "todo",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Subtask;
};

export const updateSubtask = async (subtaskId: string, updates: Partial<Subtask>) => {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.SUBTASKS)
    .update(updates)
    .eq("id", subtaskId)
    .select()
    .single();

  if (error) throw error;
  return data as Subtask;
};

export const deleteSubtask = async (subtaskId: string) => {
  const { error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.SUBTASKS)
    .delete()
    .eq("id", subtaskId);

  if (error) throw error;
};