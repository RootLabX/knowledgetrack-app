import { supabase } from "@/integrations/supabase/client";
import type { PlanningObjective, PlanningListResponse } from "@/types/planning";

export async function fetchPlanningList(): Promise<PlanningListResponse> {
  const { data, error } = await supabase.functions.invoke("planning-list", {
    method: "GET",
  });

  if (error) {
    console.error("Error in planning-list:", error);
    throw error;
  }

  const { objectives = [], progressMap = {} } = (data || {}) as PlanningListResponse;
  return { objectives, progressMap };
}

interface CreatePlanningPayload {
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
}

export async function createPlanning(payload: CreatePlanningPayload): Promise<PlanningObjective> {
  const { data, error } = await supabase.functions.invoke("planning-create", {
    method: "POST",
    body: payload,
  });

  if (error) {
    console.error("Error in planning-create:", error);
    throw error;
  }

  const planning = (data as any)?.planning as PlanningObjective | undefined;

  if (!planning) {
    throw new Error("Invalid response from planning-create");
  }

  return planning;
}
