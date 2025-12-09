import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  criteria_type: string;
  criteria_value: number;
}

interface CheckResult {
  unlocked: Achievement[];
  alreadyEarned: string[];
}

export const useAchievements = () => {
  const { user } = useAuth();

  const checkAndUnlockAchievements = useCallback(async (
    context: {
      assessmentScore?: number; // percentage 0-100
      assessmentCompleted?: boolean;
      coursesCompleted?: number;
      sectionScores?: { [section: string]: number }; // percentage per section
    }
  ): Promise<CheckResult> => {
    if (!user) return { unlocked: [], alreadyEarned: [] };

    try {
      // Get all achievements
      const { data: achievements } = await supabase
        .from("achievements")
        .select("*");

      // Get user's already earned achievements
      const { data: earnedAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);

      const earnedIds = new Set((earnedAchievements || []).map(ea => ea.achievement_id));
      const unlocked: Achievement[] = [];

      for (const achievement of (achievements || [])) {
        // Skip if already earned
        if (earnedIds.has(achievement.id)) continue;

        let shouldUnlock = false;

        switch (achievement.criteria_type) {
          case "first_assessment":
            if (context.assessmentCompleted) {
              shouldUnlock = true;
            }
            break;

          case "assessment_score":
            if (context.assessmentScore !== undefined && 
                context.assessmentScore >= achievement.criteria_value) {
              shouldUnlock = true;
            }
            break;

          case "first_course":
            if (context.coursesCompleted !== undefined && context.coursesCompleted >= 1) {
              shouldUnlock = true;
            }
            break;

          case "courses_completed":
            if (context.coursesCompleted !== undefined && 
                context.coursesCompleted >= achievement.criteria_value) {
              shouldUnlock = true;
            }
            break;

          case "section_perfect":
            // Check if any section has 100%
            if (context.sectionScores) {
              const hasPerfect = Object.values(context.sectionScores).some(score => score === 100);
              if (hasPerfect) {
                shouldUnlock = true;
              }
            }
            break;

          case "section_score":
            // Check if teamwork section >= 80%
            if (context.sectionScores && context.sectionScores.teamwork >= achievement.criteria_value) {
              shouldUnlock = true;
            }
            break;
        }

        if (shouldUnlock) {
          // Insert the achievement
          const { error } = await supabase
            .from("user_achievements")
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
            });

          if (!error) {
            unlocked.push(achievement);
          }
        }
      }

      return {
        unlocked,
        alreadyEarned: Array.from(earnedIds),
      };
    } catch (error) {
      console.error("Error checking achievements:", error);
      return { unlocked: [], alreadyEarned: [] };
    }
  }, [user]);

  const getCompletedCoursesCount = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    const { data, error } = await supabase
      .from("user_courses")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "completed");

    if (error) return 0;
    return data?.length || 0;
  }, [user]);

  return {
    checkAndUnlockAchievements,
    getCompletedCoursesCount,
  };
};
