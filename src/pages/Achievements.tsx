import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Award, Trophy, Zap, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AchievementCard } from "@/components/gamification/AchievementCard";

import { Leaderboard } from "@/components/gamification/Leaderboard";
import { CreateAchievementDialog } from "@/components/gamification/CreateAchievementDialog";
import { EmployeeList } from "@/components/gamification/EmployeeList";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  criteria_type: string;
  criteria_value: number;
  earned?: boolean;
  earned_at?: string;
}



const Achievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);


  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        // @ts-ignore
        .schema("mapper")
        .from("achievements")
        .select("*");


      if (achievementsError) throw achievementsError;

      // Fetch user earned achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        // @ts-ignore
        .schema("mapper")
        .from("user_achievements")
        .select("achievement_id, earned_at")
        .eq("user_id", user.id);


      if (userAchievementsError) throw userAchievementsError;

      // Map earned status
      const earnedMap = new Map(userAchievements?.map(ua => [ua.achievement_id, ua.earned_at]));

      const processedAchievements = (allAchievements || []).map(a => ({
        ...a,
        earned: earnedMap.has(a.id),
        earned_at: earnedMap.get(a.id)
      }));

      setAchievements(processedAchievements);

      // Calculate total points
      const points = processedAchievements
        .filter(a => a.earned)
        .reduce((sum, a) => sum + a.points, 0);
      setTotalPoints(points);



    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



  const earnedCount = achievements.filter((a) => a.earned).length;
  const progressPercentage = achievements.length > 0
    ? Math.round((earnedCount / achievements.length) * 100)
    : 0;

  const getLevel = (points: number) => {
    if (points >= 500) return { name: "Experto", icon: "🏆", color: "text-yellow-500" };
    if (points >= 300) return { name: "Avanzado", icon: "⭐", color: "text-purple-500" };
    if (points >= 150) return { name: "Intermedio", icon: "🔥", color: "text-orange-500" };
    if (points >= 50) return { name: "Principiante", icon: "🌱", color: "text-green-500" };
    return { name: "Novato", icon: "📚", color: "text-blue-500" };
  };

  const level = getLevel(totalPoints);
  const nextLevel = totalPoints >= 500 ? null :
    totalPoints >= 300 ? 500 :
      totalPoints >= 150 ? 300 :
        totalPoints >= 50 ? 150 : 50;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Logros</h1>
        <p className="text-muted-foreground">
          Gamificación y medallas personales de aprendizaje
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/20 p-3">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Puntos Totales</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-accent/20 p-3">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{level.icon}</span>
                <p className={`text-xl font-bold ${level.color}`}>{level.name}</p>
              </div>
              {nextLevel && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{totalPoints} pts</span>
                    <span>{nextLevel} pts</span>
                  </div>
                  <Progress value={(totalPoints / nextLevel) * 100} className="h-1.5" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold">
                {earnedCount} / {achievements.length}
              </p>
              <p className="text-sm text-muted-foreground">Logros Obtenidos</p>
              <Progress value={progressPercentage} className="h-1.5 mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Award className="h-4 w-4" />
            Logros
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            Colaboradores
          </TabsTrigger>

        </TabsList>

        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="flex justify-end">
            <CreateAchievementDialog onAchievementCreated={fetchData} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                size="md"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <EmployeeList />
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default Achievements;
