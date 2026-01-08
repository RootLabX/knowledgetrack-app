export interface PlanningObjective {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_by: string;
  created_at?: string;
}

export interface PlanningListResponse {
  objectives: PlanningObjective[];
  progressMap: Record<string, number>;
}
