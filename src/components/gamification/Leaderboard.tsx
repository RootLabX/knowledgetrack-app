import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  department: string | null;
  total_points: number;
  achievements_count: number;
  rank: number;
}

export const Leaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, department");

        if (profilesError) throw profilesError;

        // Fetch user achievements with points
        const { data: userAchievements, error: achievementsError } = await supabase
          .schema("mapper")
          .from("user_achievements")
          .select("user_id, achievement:achievements(points)");

        if (achievementsError) throw achievementsError;

        // Calculate points per user
        const pointsMap = new Map<string, { points: number; count: number }>();

        (userAchievements || []).forEach((ua: any) => {
          const points = ua.achievement?.points || 0;
          const current = pointsMap.get(ua.user_id) || { points: 0, count: 0 };
          pointsMap.set(ua.user_id, {
            points: current.points + points,
            count: current.count + 1,
          });
        });

        // Build leaderboard entries
        const leaderboard: LeaderboardEntry[] = (profiles || []).map((profile) => {
          const stats = pointsMap.get(profile.user_id) || { points: 0, count: 0 };
          return {
            user_id: profile.user_id,
            full_name: profile.full_name,
            department: profile.department,
            total_points: stats.points,
            achievements_count: stats.count,
            rank: 0,
          };
        });

        // Sort by points and assign ranks
        leaderboard.sort((a, b) => b.total_points - a.total_points);
        leaderboard.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setEntries(leaderboard);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [user]);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-500/20 to-orange-600/20 border-amber-600/30";
      default:
        return "";
    }
  };

  const getLevel = (points: number) => {
    if (points >= 500) return { name: "Experto", color: "bg-yellow-500" };
    if (points >= 300) return { name: "Avanzado", color: "bg-purple-500" };
    if (points >= 150) return { name: "Intermedio", color: "bg-orange-500" };
    if (points >= 50) return { name: "Principiante", color: "bg-green-500" };
    return { name: "Novato", color: "bg-blue-500" };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Tabla de Clasificación
        </CardTitle>
        <CardDescription>Ranking de usuarios por puntos de logros</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay datos de clasificación aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const level = getLevel(entry.total_points);
              const isCurrentUser = entry.user_id === user?.id;

              return (
                <div
                  key={entry.user_id}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border p-3 transition-all",
                    getRankStyle(entry.rank),
                    isCurrentUser && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={cn("text-white text-sm", level.color)}>
                      {getInitials(entry.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {entry.full_name || "Usuario"}
                        {isCurrentUser && (
                          <span className="text-xs text-primary ml-1">(Tú)</span>
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.department || "Sin departamento"} • {entry.achievements_count} logros
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold">{entry.total_points}</p>
                    <Badge variant="secondary" className="text-xs">
                      {level.name}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
