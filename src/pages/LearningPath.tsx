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
  Award,
  Briefcase,
  Users,
  MessageSquare,
  Star,
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

interface Position {
  id: string;
  title: string;
  department: string;
  level: number;
  requirements: any; // JSONB
}

interface Feedback360 {
  id: string;
  relationship: 'peer' | 'manager' | 'subordinate';
  content: string;
  rating: number;
  created_at: string;
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

const SECTION_IMPORTANCE: Record<string, 'high' | 'medium' | 'low'> = {
  security: 'high',
  sql: 'high',
  devops: 'high',
  git: 'high',
  patterns: 'medium',
  frontend: 'medium',
  networks: 'medium',
  ai: 'medium',
  teamwork: 'low',
};

const SECTION_URGENCY: Record<string, 'high' | 'medium' | 'low'> = {
  devops: 'high',    // "Operar hoy"
  git: 'high',       // Fundamental
  sql: 'high',       // Fundamental
  networks: 'medium',
  frontend: 'medium',
  security: 'medium', // Important but often comes after basics
  patterns: 'low',
  ai: 'low',         // Advanced
  teamwork: 'low',
};

const SECTION_DIFFICULTY: Record<string, 'high' | 'medium' | 'low'> = {
  ai: 'high',
  security: 'high',
  devops: 'medium',
  patterns: 'medium',
  networks: 'medium',
  sql: 'medium',
  frontend: 'medium',
  git: 'low',
  teamwork: 'low',
};

const PREREQUISITES: Record<string, string[]> = {
  ai: ['sql', 'patterns'], // Logic + Data
  security: ['networks', 'devops'],
  patterns: ['git'], // Code management
  devops: ['git', 'networks'],
  frontend: ['git'],
  // sql, git, networks are foundations
};

const SMART_OBJECTIVES: Record<string, string> = {
  devops: "Desplegar una aplicación containerizada usando Docker y un pipeline básico de CI/CD en 3 meses.",
  git: "Gestionar el flujo de trabajo de un equipo usando GitFlow, resolviendo conflictos y usando ramas de feature/hotfix.",
  sql: "Diseñar y optimizar un esquema de base de datos relacional normalizado y escribir consultas complejas con JOINs y agregaciones.",
  security: "Implementar autenticación segura (OAuth/JWT) y protección contra OWASP Top 10 en una aplicación web.",
  patterns: "Refactorizar un módulo legacy aplicando 3 patrones de diseño (Singleton, Factory, Observer) para mejorar mantenibilidad.",
  frontend: "Crear una SPA reactiva y accesible que consuma APIs REST, manejando estado global y navegación.",
  networks: "Configurar y asegurar una red virtual básica, entendiendo DNS, HTTP/S y Firewalls.",
  ai: "Entrenar y desplegar un modelo básico de ML o integrar una API de LLM para una tarea específica de negocio.",
  teamwork: "Liderar una Code Review efectiva y documentar una decisión técnica arquitectónica (ADR).",
};

const IMPORTANCE_WEIGHTS = { high: 3, medium: 2, low: 1 };
const URGENCY_WEIGHTS = { high: 3, medium: 2, low: 1 };
const DIFFICULTY_WEIGHTS = { high: 3, medium: 2, low: 1 }; // Higher difficulty = Lower priority score usually? Or just info.

// Helper Component for RoadmapCard (Hoisted)
const RoadmapCard = ({ item }: { item: any }) => {
  const urgencyColor = item.urgency === 'high' ? 'text-destructive' : item.urgency === 'medium' ? 'text-warning' : 'text-muted-foreground';
  const difficultyLabel = item.difficulty === 'high' ? 'Difícil' : item.difficulty === 'medium' ? 'Medio' : 'Fácil';

  return (
    <div className="rounded-md border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm line-clamp-1" title={SECTION_NAMES[item.section]}>
          {SECTION_NAMES[item.section]}
        </h4>
        <Badge variant="outline" className="text-[10px] h-5">
          {100 - item.percentage}% Brecha
        </Badge>
      </div>

      {/* Metrics Row */}
      <div className="flex gap-2 text-xs mb-3">
        <span className={`flex items-center gap-1 font-medium ${urgencyColor}`}>
          <AlertCircle className="w-3 h-3" /> {item.urgency === 'high' ? 'Urgente' : item.urgency === 'medium' ? 'Necesario' : 'Opcional'}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" /> {difficultyLabel}
        </span>
      </div>

      {/* SMART Goal */}
      <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground italic border-l-2 border-primary/50 relative">
        <span className="font-semibold not-italic block mb-0.5 text-[10px] uppercase text-primary">Objetivo:</span>
        "{item.smartGoal}"
      </div>

      {/* Dependencies */}
      {item.prerequisites.length > 0 && (
        <div className="mt-2 pt-2 border-t flex flex-wrap gap-1">
          <span className="text-[10px] text-muted-foreground mr-1">Requiere:</span>
          {item.prerequisites.map((p: string) => (
            <Badge key={p} variant="secondary" className="text-[10px] h-4 px-1">
              {SECTION_NAMES[p]?.split(' ')[0]}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};



const LearningPath = () => {
  const navigate = useNavigate();
  // ... existing hooks ...
  const { user } = useAuth();
  const { checkAndUnlockAchievements } = useAchievements();
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<UserCourse | null>(null);
  const [newProgress, setNewProgress] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);

  const [showAchievementNotification, setShowAchievementNotification] = useState(false);

  // New State for Career Pathing & Feedback
  const [positions, setPositions] = useState<Position[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback360[]>([]);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [nextPosition, setNextPosition] = useState<Position | null>(null);

  // ... useEffect and fetchData ...
  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      if (!user) return;

      // Fetch user courses
      const { data: coursesData, error: coursesError } = await supabase
        .schema("mapper")
        .from("user_courses")
        .select("*, courses!fk_user_courses_courses(*)")
        .eq("user_id", user.id);

      if (coursesError) throw coursesError;

      const mappedCourses: UserCourse[] = (coursesData || []).map((item: any) => ({
        ...item,
        course: item.courses
      }));

      setUserCourses(mappedCourses);

      // Fetch latest assessment
      const { data: assessment, error: assessmentError } = await supabase
        .schema("mapper")
        .from("assessments")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assessmentError) throw assessmentError;

      if (assessment && assessment.results) {
        const results: AssessmentResult[] = Object.entries(assessment.results).map(([section, data]: [string, any]) => ({
          section,
          correct: data.correct,
          total: data.total,
          percentage: data.percentage
        }));
        setAssessmentResults(results);
      }

      // Calculate Profile based on Average Score
      const totalScore = assessment?.results
        ? Object.values(assessment.results).reduce((acc: number, curr: any) => acc + curr.percentage, 0)
        : 0;
      const sectionCount = assessment?.results ? Object.keys(assessment.results).length : 1;
      const averageScore = totalScore / sectionCount;

      let calculatedLevel = 1;
      let calculatedTitle = "Desarrollador Junior";

      if (averageScore >= 85) {
        calculatedLevel = 3;
        calculatedTitle = "Desarrollador Senior";
      } else if (averageScore >= 50) {
        calculatedLevel = 2;
        calculatedTitle = "Desarrollador Mid-Level";
      }

      // Fetch Positions via Requirements (Separate fetches to avoid join error)
      console.log("Fetching position requirements...");

      // 1. Fetch Requirements
      const { data: requirementsData, error: reqError } = await supabase
        .schema("mapper")
        .from("position_requirements")
        .select(`
            level,
            requirements,
            position_id
        `)
        .order("level", { ascending: true });

      if (reqError) {
        console.error("Error fetching requirements:", reqError);
      }

      // 2. Fetch Positions Details
      const { data: positionsData } = await supabase
        .from("positions")
        .select("id, name, department_id");

      if (requirementsData && requirementsData.length > 0) {
        // Transform joined data to flat Position structure
        const mappedPositions = requirementsData.map((r: any) => {
          const positionParams = positionsData?.find(p => p.id === r.position_id);
          return {
            id: r.position_id,
            title: positionParams?.name || "Posición Desconocida",
            department: 'Tecnología', // Could map department_id if needed, keeping hardcoded for now as per original
            level: r.level,
            requirements: r.requirements
          }
        });

        setPositions(mappedPositions);
        console.log("Mapped Positions:", mappedPositions);

        // Find position matching calculated level
        const current = mappedPositions.find((p: any) => p.level === calculatedLevel) ||
          mappedPositions[0];

        setCurrentPosition(current);

        // Target is ALWAYS Senior (Level 3)
        const seniorPosition = mappedPositions.find((p: any) => p.level === 3);
        setNextPosition(seniorPosition || null);

      } else {
        // Fallback logic
        console.warn("No positions found in DB (requirements joined), using calculated fallback");
        setCurrentPosition({
          id: 'fallback-current',
          title: calculatedTitle,
          department: 'Tecnología',
          level: calculatedLevel,
          requirements: {}
        });
        setNextPosition({
          id: 'fallback-next',
          title: 'Desarrollador Senior',
          department: 'Tecnología',
          level: 3,
          requirements: {}
        });
      }

      // Fetch 360 Feedback (Mapper Schema)
      const { data: feedbackData } = await supabase
        .schema("mapper")
        .from("feedback_360")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (feedbackData) {
        setFeedbacks(feedbackData);
      }
    } catch (error) {
      console.error("Error fetching learning path data:", error);
      toast.error("Error al cargar la ruta de aprendizaje");
    } finally {
      setLoading(false);
    }
  };

  // ... existing handlers ...
  const handleUpdateProgress = async () => {
    if (!selectedCourse || !user) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .schema("mapper")
        .from("user_courses")
        .update({
          progress: newProgress,
          status: newProgress === 100 ? 'completed' : 'in_progress',
          completed_at: newProgress === 100 ? new Date().toISOString() : null
        })
        .eq("id", selectedCourse.id);

      if (error) throw error;

      toast.success("Progreso actualizado");

      if (newProgress === 100) {
        // Get total completed courses count
        const { count } = await supabase
          .schema("mapper")
          .from("user_courses")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed");

        const unlocked = await checkAndUnlockAchievements({
          coursesCompleted: count || 0,
        });

        if (unlocked && unlocked.length > 0) {
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

  const calculateAdvancedScore = (section: string, percentage: number) => {
    const importance = SECTION_IMPORTANCE[section] || 'medium';
    const urgency = SECTION_URGENCY[section] || 'medium';
    const difficulty = SECTION_DIFFICULTY[section] || 'medium';

    const gap = 100 - percentage;
    const gapScore = gap / 10; // 0-10

    // Check if this section is a prerequisite for others
    let prerequisiteScore = 0;
    Object.values(PREREQUISITES).forEach(deps => {
      if (deps.includes(section)) prerequisiteScore += 1;
    });

    // Score Formula:
    // (Urgency * 2) + (Gap * 1.5) + (Impact * 1) + (Prereq * 2) - (Difficulty * 0.5)
    const score =
      (URGENCY_WEIGHTS[urgency] * 2.0) +
      (gapScore * 1.5) +
      (IMPORTANCE_WEIGHTS[importance] * 1.0) +
      (prerequisiteScore * 2.0) -
      (DIFFICULTY_WEIGHTS[difficulty] * 0.5);

    return score;
  };

  const getPhase = (result: any) => {
    const urgency = SECTION_URGENCY[result.section] || 'medium';
    const hasPrereqs = (PREREQUISITES[result.section] || []).length > 0;
    const isFoundation = !hasPrereqs; // No prereqs = Foundation

    // Phase 1: High Urgency OR Foundations (that have a gap)
    if (urgency === 'high' || (isFoundation && result.percentage < 70)) {
      return 1;
    }

    // Phase 3: Low Urgency AND High Difficulty (Advanced)
    if (urgency === 'low' && SECTION_DIFFICULTY[result.section] === 'high') {
      return 3;
    }

    // Phase 2: Everything else (Expansion)
    return 2;
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

  // Prepare Data for Roadmap
  const enrichedResults = assessmentResults.map(r => ({
    ...r,
    score: calculateAdvancedScore(r.section, r.percentage),
    phase: 0, // placeholder
    urgency: SECTION_URGENCY[r.section] || 'medium',
    difficulty: SECTION_DIFFICULTY[r.section] || 'medium',
    prerequisites: PREREQUISITES[r.section] || [],
    smartGoal: SMART_OBJECTIVES[r.section]
  }));

  // Assign Phases
  enrichedResults.forEach(r => {
    r.phase = getPhase(r);
  });

  const phases = {
    1: enrichedResults.filter(r => r.phase === 1).sort((a, b) => b.score - a.score),
    2: enrichedResults.filter(r => r.phase === 2).sort((a, b) => b.score - a.score),
    3: enrichedResults.filter(r => r.phase === 3).sort((a, b) => b.score - a.score),
  };

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
              Plan estratégico de capacitación basado en evaluación y rol
            </p>
          </div>
          <Button onClick={() => navigate("/assessment")}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Nueva Evaluación
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-1"> {/* Changed to 1 column for full width */}
          <div className="lg:col-span-1 space-y-6"> {/* Main content now spans 1 column */}
            {/* Career Path & Feedback Section */}
            {(currentPosition || feedbacks.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Career Ladder */}
                <Card className="border-l-4 border-l-primary/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" /> Mi Trayectoria Profesional
                    </CardTitle>
                    <CardDescription>
                      Ruta de crecimiento en el departamento {currentPosition?.department}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative border-l-2 border-muted pl-4 ml-2 space-y-6 my-2">
                      {/* Current Position */}
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background ring-4 ring-primary/20"></span>
                        <h4 className="font-semibold text-sm text-primary">Perfil Calculado (vía Evaluación)</h4>
                        <p className="font-bold">{currentPosition?.title}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">Nivel {currentPosition?.level}</Badge>
                          {assessmentResults.length > 0 && (
                            <Badge variant="secondary" className="text-[10px]">
                              Promedio: {Math.round(assessmentResults.reduce((a, b) => a + b.percentage, 0) / assessmentResults.length)}%
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Next Step */}
                      {nextPosition ? (
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-muted-foreground/30 border-2 border-background"></span>
                          <h4 className="font-semibold text-sm text-muted-foreground">Objetivo: Senior</h4>
                          <p className="font-bold text-foreground">{nextPosition.title}</p>
                          <div className="mt-2 bg-muted/50 p-2 rounded text-xs">
                            <span className="font-semibold block mb-1">Brechas para Senior:</span>
                            {/* Calculated Gaps for Senior */}
                            <div className="flex flex-col gap-1 mt-1">
                              {assessmentResults
                                .filter(r => r.percentage < 85) // Gap if < 85% (Senior threshold)
                                .sort((a, b) => a.percentage - b.percentage)
                                .slice(0, 3)
                                .map(gap => (
                                  <div key={gap.section} className="flex justify-between items-center">
                                    <span className="capitalize">{SECTION_NAMES[gap.section]?.split(' ')[0]}</span>
                                    <Badge variant="destructive" className="text-[10px] h-4">
                                      falta {85 - gap.percentage}%
                                    </Badge>
                                  </div>
                                ))}
                              {assessmentResults.every(r => r.percentage >= 85) && (
                                <span className="text-green-600 font-medium">¡Listo para Senior!</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-yellow-500 border-2 border-background"></span>
                          <p className="font-bold text-foreground">¡Cima Alcanzada!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 360 Feedback */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" /> Feedback 360°
                    </CardTitle>
                    <CardDescription>
                      Retroalimentación reciente de tu equipo y manager
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {feedbacks.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Aún no has recibido feedback 360.</p>
                      </div>
                    ) : (
                      feedbacks.slice(0, 3).map(fb => (
                        <div key={fb.id} className="bg-muted/30 p-3 rounded-md text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold capitalize text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                              {fb.relationship}
                            </span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < fb.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                              ))}
                            </div>
                          </div>
                          <p className="italic text-muted-foreground">"{fb.content}"</p>
                          <p className="text-[10px] text-right mt-1 opacity-50">
                            {new Date(fb.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                    {feedbacks.length > 0 && (
                      <Button variant="ghost" size="sm" className="w-full text-xs text-purple-600 hover:text-purple-700">
                        Ver todo el historial
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Strategic Roadmap */}
            {assessmentResults.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold">Hoja de Ruta Estratégica</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Phase 1 */}
                  <Card className="border-l-4 border-l-destructive bg-secondary/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold text-destructive uppercase tracking-wide flex items-center gap-2">
                        <Clock className="w-4 h-4" /> FASE 1: Cimientos Críticos
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Prioridad Inmediata (0-3 Meses)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {phases[1].length === 0 && <p className="text-sm text-muted-foreground">¡Sin brechas críticas!</p>}
                      {phases[1].map(item => (
                        <RoadmapCard key={item.section} item={item} />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Phase 2 */}
                  <Card className="border-l-4 border-l-warning bg-secondary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold text-warning uppercase tracking-wide flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> FASE 2: Expansión
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Crecimiento Estructural (3-6 Meses)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {phases[2].length === 0 && <p className="text-sm text-muted-foreground">...</p>}
                      {phases[2].map(item => (
                        <RoadmapCard key={item.section} item={item} />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Phase 3 */}
                  <Card className="border-l-4 border-l-primary bg-background">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-2">
                        <Award className="w-4 h-4" /> FASE 3: Maestría
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Especialización Avanzada (+6 Meses)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {phases[3].length === 0 && <p className="text-sm text-muted-foreground">...</p>}
                      {phases[3].map(item => (
                        <RoadmapCard key={item.section} item={item} />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
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
