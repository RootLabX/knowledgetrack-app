import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Award, Plus, Target, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AchievementCard } from "@/components/gamification/AchievementCard";
import { ObjectiveCard } from "@/components/gamification/ObjectiveCard";
import { Leaderboard } from "@/components/gamification/Leaderboard";

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

interface UserObjective {
  id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  objective_type: string;
  status: string;
  due_date: string | null;
}

const Achievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [objectives, setObjectives] = useState<UserObjective[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newObjective, setNewObjective] = useState({
    title: "",
    description: "",
    target_value: 1,
    objective_type: "courses",
    due_date: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch all achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*")
        .order("points", { ascending: true });

      // Fetch user's earned achievements
      const { data: earnedAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id, earned_at")
        .eq("user_id", user!.id);

      const earnedMap = new Map(
        (earnedAchievements || []).map((ea) => [ea.achievement_id, ea.earned_at])
      );

      const processedAchievements = (allAchievements || []).map((a) => ({
        ...a,
        earned: earnedMap.has(a.id),
        earned_at: earnedMap.get(a.id),
      }));

      setAchievements(processedAchievements);
      setTotalPoints(
        processedAchievements
          .filter((a) => a.earned)
          .reduce((acc, a) => acc + a.points, 0)
      );

      // Fetch user objectives
      const { data: userObjectives } = await supabase
        .from("user_objectives")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      setObjectives(userObjectives || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      toast.error("Error al cargar logros");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObjective = async () => {
    if (!newObjective.title || newObjective.target_value < 1) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    try {
      const { error } = await supabase.from("user_objectives").insert({
        user_id: user!.id,
        title: newObjective.title,
        description: newObjective.description || null,
        target_value: newObjective.target_value,
        objective_type: newObjective.objective_type,
        due_date: newObjective.due_date || null,
      });

      if (error) throw error;

      toast.success("Objetivo creado exitosamente");
      setDialogOpen(false);
      setNewObjective({
        title: "",
        description: "",
        target_value: 1,
        objective_type: "courses",
        due_date: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating objective:", error);
      toast.error("Error al crear objetivo");
    }
  };

  const handleDeleteObjective = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_objectives")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Objetivo eliminado");
      fetchData();
    } catch (error) {
      console.error("Error deleting objective:", error);
      toast.error("Error al eliminar objetivo");
    }
  };

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
        <h1 className="text-2xl font-bold text-foreground">Logros y Objetivos</h1>
        <p className="text-muted-foreground">
          Gamificación y metas personales de aprendizaje
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
          <TabsTrigger value="objectives" className="gap-2">
            <Target className="h-4 w-4" />
            Objetivos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
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

        <TabsContent value="objectives" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Mis Objetivos</h3>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Objetivo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Objetivo</DialogTitle>
                  <DialogDescription>
                    Define una meta personal para tu aprendizaje
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Ej: Completar 3 cursos de arquitectura"
                      value={newObjective.title}
                      onChange={(e) =>
                        setNewObjective({ ...newObjective, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe tu objetivo..."
                      value={newObjective.description}
                      onChange={(e) =>
                        setNewObjective({ ...newObjective, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <Select
                        value={newObjective.objective_type}
                        onValueChange={(value) =>
                          setNewObjective({ ...newObjective, objective_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="courses">Cursos</SelectItem>
                          <SelectItem value="assessment_score">Puntaje de Evaluación</SelectItem>
                          <SelectItem value="daily_streak">Racha Diaria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target">Meta *</Label>
                      <Input
                        id="target"
                        type="number"
                        min={1}
                        value={newObjective.target_value}
                        onChange={(e) =>
                          setNewObjective({
                            ...newObjective,
                            target_value: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Fecha Límite (opcional)</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newObjective.due_date}
                      onChange={(e) =>
                        setNewObjective({ ...newObjective, due_date: e.target.value })
                      }
                    />
                  </div>
                  <Button onClick={handleCreateObjective} className="w-full">
                    Crear Objetivo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {objectives.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No tienes objetivos definidos
                </p>
                <p className="text-sm text-muted-foreground">
                  Crea tu primer objetivo para empezar a trackear tu progreso
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {objectives.map((objective) => (
                <ObjectiveCard
                  key={objective.id}
                  objective={objective}
                  onDelete={handleDeleteObjective}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Achievements;
