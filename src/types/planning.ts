export interface PlanningObjective {
  id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  department_id?: string;
  created_at?: string;
  planning_sprints?: {
    planning_tasks?: { status: string }[];
  }[];
}

export interface PlanningListResponse {
  objectives: PlanningObjective[];
  progressMap: Record<string, number>;
}

export interface Task {
  id: string;
  sprint_id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  created_at: string;
  assignee?: string; // Opcional: para mostrar avatar
}

export interface CreateSprintDTO {
  planning_id: string;
  title: string;
  start_date: string;
  end_date: string;
  goal?: string | null;
  created_by?: string;
}

export interface CreateTaskDTO {
  sprint_id: string;
  title: string;
  status?: string;
  priority?: "low" | "medium" | "high";
}