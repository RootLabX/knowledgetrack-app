import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Trophy, Calendar, Clock, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  department: string | null;
  total_points: number;
  achievements_count: number;
  rank: number;
}

interface ActivityEntry {
  id: string;
  user_id: string;
  full_name: string | null;
  achievement_name: string;
  points: number;
  earned_at: string;
}

export const Leaderboard = () => {
  const { user } = useAuth();
  const [topEntries, setTopEntries] = useState<LeaderboardEntry[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [rewards, setRewards] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, department");

        if (profilesError) throw profilesError;

        // Fetch rewards
        const { data: rewardsData } = await supabase
          // @ts-ignore
          .schema("mapper")
          .from("quarterly_rewards")
          .select("rank, reward");

        const rewardsMap: Record<number, string> = {};
        if (rewardsData) {
          rewardsData.forEach((r: any) => {
            rewardsMap[r.rank] = r.reward;
          });
          setRewards(rewardsMap);
        }

        // Fetch user achievements with points and timestamps
        const { data: userAchievements, error: achievementsError } = await supabase
          // @ts-ignore
          .schema("mapper")
          .from("user_achievements")
          .select("id, user_id, earned_at, achievement:achievements(name, points)");

        if (achievementsError) throw achievementsError;

        // --- Process Top 5 Quarterly ---
        const now = new Date();
        const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
        const currentYear = now.getFullYear();

        const quarterlyAchievements = (userAchievements || []).filter((ua: any) => {
          const earnedDate = new Date(ua.earned_at);
          const earnedQuarter = Math.floor((earnedDate.getMonth() + 3) / 3);
          return earnedQuarter === currentQuarter && earnedDate.getFullYear() === currentYear;
        });

        const pointsMap = new Map<string, { points: number; count: number }>();
        quarterlyAchievements.forEach((ua: any) => {
          const points = ua.achievement?.points || 0;
          const current = pointsMap.get(ua.user_id) || { points: 0, count: 0 };
          pointsMap.set(ua.user_id, {
            points: current.points + points,
            count: current.count + 1,
          });
        });

        const leaderboard: LeaderboardEntry[] = (profiles || []).map((profile) => {
          const stats = pointsMap.get(profile.id) || { points: 0, count: 0 };
          return {
            user_id: profile.id,
            full_name: profile.full_name,
            department: profile.department,
            total_points: stats.points,
            achievements_count: stats.count,
            rank: 0,
          };
        });

        // Filter users with 0 points (optional) or just sort
        const activeLeaderboard = leaderboard
          .filter(e => e.total_points > 0)
          .sort((a, b) => b.total_points - a.total_points)
          .slice(0, 5); // Take top 5

        activeLeaderboard.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setTopEntries(activeLeaderboard);

        // --- Process Recent Activity ---
        const activityList: ActivityEntry[] = (userAchievements || [])
          .map((ua: any) => {
            const profile = profiles?.find(p => p.id === ua.user_id);
            return {
              id: ua.id,
              user_id: ua.user_id,
              full_name: profile?.full_name || "Usuario",
              achievement_name: ua.achievement?.name || "Logro",
              points: ua.achievement?.points || 0,
              earned_at: ua.earned_at
            };
          })
          .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
          .slice(0, 5); // Take top 5 recent

        setRecentActivity(activityList);

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
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };



  const getDaysRemainingInQuarter = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Quarter ends: March (2), June (5), September (8), December (11)
    let quarterEndMonth = 2;
    if (currentMonth > 2) quarterEndMonth = 5;
    if (currentMonth > 5) quarterEndMonth = 8;
    if (currentMonth > 8) quarterEndMonth = 11;

    // Last day of the quarter month
    const quarterEndDate = new Date(currentYear, quarterEndMonth + 1, 0);

    // Calculate difference in days using simple math to avoid extra imports if not needed, 
    // but since we have date-fns already imported in the file (implied by usage of formatDistanceToNow), 
    // let's stick to standard JS for simplicity and zero dep/import changes if possible, 
    // or better yet, just do the math.
    const diffTime = Math.abs(quarterEndDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Top 5 Quarterly */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 5 del Trimestre
            <Badge variant="outline" className="ml-2 text-xs font-normal">
              Termina en {getDaysRemainingInQuarter()} días
            </Badge>
          </CardTitle>
          <CardDescription>Los mejores puntuajes de este trimestre</CardDescription>
        </CardHeader>
        <CardContent>
          {topEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Trophy className="h-10 w-10 mb-2 opacity-20" />
              <p>Aún no hay actividad este trimestre</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topEntries.map((entry) => (
                <div key={entry.user_id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center font-bold text-lg text-muted-foreground">
                    {getRankIcon(entry.rank)}
                  </div>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(entry.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.full_name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{entry.achievements_count} logros</p>
                      {rewards[entry.rank] && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                          {rewards[entry.rank]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary">{entry.total_points}</span>
                    <span className="text-xs text-muted-foreground ml-1">pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>Últimos logros obtenidos por el equipo</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mb-2 opacity-20" />
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3 relative pb-4 last:pb-0">
                  {/* Timeline line */}
                  <div className="absolute left-[18px] top-8 bottom-0 w-px bg-border last:hidden"></div>

                  <Avatar className="h-9 w-9 z-10 border-2 border-background">
                    <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xs">
                      {getInitials(activity.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{activity.full_name}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.earned_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Obtuvo <span className="font-medium text-foreground">{activity.achievement_name}</span>
                    </p>
                    <Badge variant="outline" className="text-xs font-normal">
                      +{activity.points} pts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
