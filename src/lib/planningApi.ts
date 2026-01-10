import { supabase } from "@/integrations/supabase/client";

// ==========================================
// 1. CONSTANTES Y TIPOS
// ==========================================
const DB_SCHEMA = "mapper";

const TABLES = {
  OBJECTIVES: "planning_objectives",
  SPRINTS: "planning_sprints",
  TASKS: "planning_tasks",
} as const;

export interface PlanningObjective {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  department_id?: string;
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
  points?: number;          // Nuevo
  due_date?: string;        // Nuevo
  assignee_id?: string;     // Nuevo
  tags?: string[];          // Nuevo
  created_at: string;
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
// 2. SERVICIOS: PLANNING (Sin Edge Functions)
// ==========================================

export async function fetchPlanningList(): Promise<PlanningListResponse> {
  // CORRECCIÓN: Llamada directa a la tabla en lugar de functions.invoke
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.OBJECTIVES)
    .select("*")
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching planning list:", error);
    throw error;
  }

  // Devolvemos un mapa vacío ya que no calculamos progreso en cliente por ahora
  return {
    objectives: (data as PlanningObjective[]) || [],
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
      status: payload.status || 'active'
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating planning:", error);
    throw error;
  }

  return data as PlanningObjective;
}

export async function getPlanningById(planId: string): Promise<PlanningObjective> {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.OBJECTIVES)
    .select("*")
    .eq("id", planId)
    .single();

  if (error) throw error;
  return data as PlanningObjective;
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

// ==========================================
// 4. SERVICIOS: TASKS
// ==========================================

export const getSprintTasks = async (sprintId: string) => {
  const { data, error } = await supabase
    .schema(DB_SCHEMA)
    .from(TABLES.TASKS)
    .select("*")
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
        // Si tienes más campos en el formulario de creación, añádelos aquí
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
    .schema("mapper")
    .from("planning_tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .schema("mapper")
    .from("planning_tasks")
    .delete()
    .eq("id", taskId);

  if (error) throw error;
};