import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementNotification } from "@/components/gamification/AchievementNotification";

interface UserCourse {
  id: string;
  course_id: string;
  progress: number;
  status: string;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  course: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    duration_hours: number | null;
    difficulty: string | null;
    objectives: string[] | null;
  };
}

interface AssessmentResult {
  section: string;
  correct: number;
  total: number;
  percentage: number;
}

const SECTION_NAMES: Record<string, string> = {
  git: "Git y Control de Versiones",
  sql: "SQL y Bases de Datos",
  patterns: "Patrones de Diseño",
  ai: "Inteligencia Artificial",
  devops: "Infraestructura y DevOps",
  networks: "Internet y Redes",
  frontend: "Frontend y Navegadores",
  security: "Protocolos y Seguridad",
  teamwork: "Trabajo en Equipo",
};

const LearningPath = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkAndUnlockAchievements, getCompletedCoursesCount } = useAchievements();
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<UserCourse | null>(null);
  const [newProgress, setNewProgress] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch user's assigned courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("user_courses")
        .select(`
          id,
          course_id,
          progress,
          status,
          assigned_at,
          started_at,
          completed_at,
          course:courses (
            id,
            title,
            description,
            category,
            duration_hours,
            difficulty,
            objectives
          )
        `)
        .eq("user_id", user.id)
        .order("assigned_at", { ascending: false });

      if (coursesError) throw coursesError;
      setUserCourses((coursesData as unknown as UserCourse[]) || []);

      // Fetch latest assessment results
      const { data: assessmentData } = await supabase
        .from("assessments")
        .select("results")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assessmentData?.results) {
        const results = Object.entries(assessmentData.results as Record<string, { correct: number; total: number }>).map(
          ([section, data]) => ({
            section,
            correct: data.correct,
            total: data.total,
            percentage: Math.round((data.correct / data.total) * 100),
          })
        );
        setAssessmentResults(results);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedCourse) return;

    setUpdating(true);
    try {
      const status =
        newProgress === 100
          ? "completed"
          : newProgress > 0
          ? "in_progress"
          : "assigned";

      const updateData: any = {
        progress: newProgress,
        status,
      };

      if (newProgress > 0 && !selectedCourse.started_at) {
        updateData.started_at = new Date().toISOString();
      }

      const isCompletingCourse = newProgress === 100 && selectedCourse.status !== "completed";
      
      if (newProgress === 100) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("user_courses")
        .update(updateData)
        .eq("id", selectedCourse.id);

      if (error) throw error;

      toast.success("Progreso actualizado");

      // Check for achievements when completing a course
      if (isCompletingCourse) {
        const completedCount = await getCompletedCoursesCount() + 1; // +1 because we just completed one
        const { unlocked } = await checkAndUnlockAchievements({
          coursesCompleted: completedCount,
        });

        if (unlocked.length > 0) {
          setUnlockedAchievements(unlocked);
          setShowAchievementNotification(true);
        }
      }

      setSelectedCourse(null);
      fetchData();
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Error al actualizar el progreso");
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityFromPercentage = (percentage: number) => {
    if (percentage < 50) return "high";
    if (percentage < 70) return "medium";
    return "low";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      default:
        return "Baja";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-accent text-accent-foreground">Completado</Badge>;
      case "in_progress":
        return <Badge className="bg-primary text-primary-foreground">En Progreso</Badge>;
      default:
        return <Badge variant="secondary">Asignado</Badge>;
    }
  };

  const totalProgress =
    userCourses.length > 0
      ? Math.round(userCourses.reduce((acc, c) => acc + c.progress, 0) / userCourses.length)
      : 0;

  const completedCourses = userCourses.filter((c) => c.status === "completed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {showAchievementNotification && unlockedAchievements.length > 0 && (
        <AchievementNotification
          achievements={unlockedAchievements}
          onClose={() => setShowAchievementNotification(false)}
        />
      )}
      <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Ruta de Aprendizaje</h1>
          <p className="text-muted-foreground">
            Plan personalizado basado en tu evaluación inicial
          </p>
        </div>
        <Button onClick={() => navigate("/assessment")}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Nueva Evaluación
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Assessment Results */}
          {assessmentResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Análisis de Brechas de Conocimiento
                </CardTitle>
                <CardDescription>
                  Basado en tu última evaluación técnica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {assessmentResults
                  .sort((a, b) => a.percentage - b.percentage)
                  .map((result) => {
                    const priority = getPriorityFromPercentage(result.percentage);
                    const gap = 100 - result.percentage;
                    return (
                      <div key={result.section} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-foreground">
                              {SECTION_NAMES[result.section] || result.section}
                            </span>
                            <Badge className={getPriorityColor(priority)}>
                              {getPriorityLabel(priority)}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {result.percentage}%
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={result.percentage} className="h-3" />
                          {gap > 0 && (
                            <div
                              className="absolute top-0 h-3 rounded-r-full bg-destructive/20"
                              style={{
                                left: `${result.percentage}%`,
                                width: `${gap}%`,
                              }}
                            />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Brecha: {gap} puntos • {result.correct}/{result.total} correctas
                        </p>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {assessmentResults.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-foreground">Sin evaluación</p>
                <p className="text-sm text-muted-foreground text-center">
                  Realiza una evaluación técnica para identificar tus brechas de conocimiento
                </p>
                <Button onClick={() => navigate("/assessment")} className="mt-4">
                  Iniciar Evaluación
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Assigned Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Mis Cursos Asignados
              </CardTitle>
              <CardDescription>
                Actualiza tu progreso en cada curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    No tienes cursos asignados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Contacta a un administrador para que te asigne cursos
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userCourses.map((uc) => (
                    <div
                      key={uc.id}
                      className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">
                              {uc.course.title}
                            </h4>
                            {getStatusBadge(uc.status)}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {uc.course.category}
                          </p>
                          {uc.course.duration_hours && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{uc.course.duration_hours}h estimadas</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCourse(uc);
                            setNewProgress(uc.progress);
                          }}
                        >
                          Actualizar Progreso
                        </Button>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium text-foreground">{uc.progress}%</span>
                        </div>
                        <Progress value={uc.progress} className="h-2" />
                      </div>
                      {uc.course.objectives && uc.course.objectives.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Objetivos:
                          </p>
                          <ul className="space-y-1">
                            {uc.course.objectives.slice(0, 3).map((obj, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-muted-foreground"
                              >
                                {uc.progress >= ((idx + 1) / uc.course.objectives!.length) * 100 ? (
                                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-accent" />
                                ) : (
                                  <div className="h-3 w-3 mt-0.5 rounded-full border border-muted-foreground/30" />
                                )}
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen de Progreso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{totalProgress}%</div>
                <p className="mt-1 text-sm text-muted-foreground">Progreso global</p>
              </div>
              <Progress value={totalProgress} className="h-2" />
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cursos asignados</span>
                  <span className="font-semibold text-foreground">{userCourses.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completados</span>
                  <span className="font-semibold text-foreground">{completedCourses}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">En progreso</span>
                  <span className="font-semibold text-foreground">
                    {userCourses.filter((c) => c.status === "in_progress").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próximos Pasos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userCourses
                .filter((c) => c.status !== "completed")
                .slice(0, 3)
                .map((course) => (
                  <div key={course.id} className="flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 border-primary/30" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">{course.course.title}</p>
                      <p className="text-muted-foreground">{course.progress}% completado</p>
                    </div>
                  </div>
                ))}
              {userCourses.filter((c) => c.status !== "completed").length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ¡Todos los cursos completados!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Update Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Progreso</DialogTitle>
            <DialogDescription>
              {selectedCourse?.course.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-primary">{newProgress}%</span>
            </div>
            <Slider
              value={[newProgress]}
              onValueChange={(value) => setNewProgress(value[0])}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCourse(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProgress} disabled={updating}>
              {updating ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
};

export default LearningPath;
