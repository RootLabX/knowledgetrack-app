import { useCallback, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  criteria_type: string;
  criteria_value: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

interface CheckContext {
  assessmentScore?: number; // percentage 0-100
  assessmentCompleted?: boolean;
  coursesCompleted?: number;
  sectionScores?: { [section: string]: number }; // percentage per section
}

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    const { data: achievementsData, error: achievementsError } = await supabase
      .schema("mapper")
      .from("achievements")
      .select("*");

    if (achievementsError) {
      console.error("Error fetching achievements:", achievementsError);
      return;
    }

    setAchievements(achievementsData || []);

    const { data: userAchievementsData, error: userAchievementsError } = await supabase
      .schema("mapper")
      .from("user_achievements")
      .select("*, achievements!fk_user_achievements_achievements(*)")
      .eq("user_id", user.id);

    if (userAchievementsError) {
      console.error("Error fetching user achievements:", userAchievementsError);
      return;
    }

    const mappedUserAchievements: UserAchievement[] = (userAchievementsData || []).map((item: any) => ({
      ...item,
      achievement: item.achievements
    }));

    setUserAchievements(mappedUserAchievements);
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const checkAndUnlockAchievements = useCallback(async (context: CheckContext) => {
    if (!user || achievements.length === 0) return;

    const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const newUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      if (earnedAchievementIds.has(achievement.id)) continue;

      let unlocked = false;

      switch (achievement.criteria_type) {
        case "first_assessment":
          if (context.assessmentCompleted) unlocked = true;
          break;
        case "assessment_score":
          if (context.assessmentScore !== undefined && context.assessmentScore >= achievement.criteria_value) {
            unlocked = true;
          }
          break;
        case "first_course":
          if (context.coursesCompleted !== undefined && context.coursesCompleted >= 1) {
            unlocked = true;
          }
          break;
        case "courses_completed":
          if (context.coursesCompleted !== undefined && context.coursesCompleted >= achievement.criteria_value) {
            unlocked = true;
          }
          break;
        case "section_perfect":
          // Check if any section has 100% and matches the achievement requirement if specific?
          // The migration implies specific sections like 'Git Master' for 'Git' section.
          // We need to match section name.
          // For now, let's assume the achievement description or name might hint, or we need a mapping.
          // Looking at migration: 'Git Master' -> 'Git', 'SQL Expert' -> 'SQL'.
          // The criteria_type is 'section_perfect', but how do we know WHICH section?
          // Maybe we check if ANY section matches? Or we need a mapping.
          // Let's look at the migration again.
          // ('Git Master', ..., 'section_perfect', 1)
          // It doesn't explicitly link to 'Git' section in a machine readable way other than maybe name?
          // Actually, let's check if I can infer it.
          // For now, I will implement a simple check: if the achievement name contains the section name.
          if (context.sectionScores) {
            // This is tricky without a proper mapping column. 
            // I'll skip this specific logic for now or make it generic if I can.
            // Wait, the migration has:
            // ('Git Master', ..., 'section_perfect', 1)
            // ('SQL Expert', ..., 'section_perfect', 1)
            // ('Arquitecto', ..., 'section_perfect', 1) -> Patrones de Diseño?

            // I'll try to match based on some keywords if possible, or just skip for now to avoid errors.
            // Actually, I can check if context.sectionScores has any 100.
            // But that would unlock all 'section_perfect' achievements at once if I'm not careful.

            // Let's assume for now we only check generic ones or I'll leave a TODO.
            // Or better, I'll check if the achievement name contains the section key.
            Object.entries(context.sectionScores).forEach(([section, score]) => {
              if (score === 100 && achievement.name.toLowerCase().includes(section.toLowerCase())) {
                unlocked = true;
              }
              // Special case for 'Arquitecto' -> 'Patrones'
              if (score === 100 && achievement.name === 'Arquitecto' && section.includes('Patrones')) {
                unlocked = true;
              }
            });
          }
          break;
        case "section_score":
          if (context.sectionScores) {
            Object.entries(context.sectionScores).forEach(([section, score]) => {
              if (score >= achievement.criteria_value && achievement.name.toLowerCase().includes(section.toLowerCase())) {
                unlocked = true;
              }
              if (score >= achievement.criteria_value && achievement.name === 'Colaborador' && section.includes('Trabajo en Equipo')) {
                unlocked = true;
              }
            });
          }
          break;
      }

      if (unlocked) {
        const { error } = await supabase
          .schema("mapper")
          .from("user_achievements")
          .insert({
            user_id: user.id,
            achievement_id: achievement.id
          });

        if (!error) {
          newUnlocked.push(achievement);
          toast.success(`¡Logro Desbloqueado: ${achievement.name}!`, {
            description: achievement.description,
            icon: achievement.icon === 'award' ? '🏆' : '⭐' // Simple mapping
          });
        }
      }
    }

    if (newUnlocked.length > 0) {
      fetchAchievements();
    }

    return newUnlocked;
  }, [user, achievements, userAchievements, fetchAchievements]);

  return {
    achievements,
    userAchievements,
    checkAndUnlockAchievements
  };
};
