import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  GraduationCap,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  AlertTriangle,
  Award,
  LineChart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProgressTrendsChart, ScoreDistributionChart, SectionPerformanceChart } from "@/components/dashboard/ProgressTrendsChart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface TeamMemberDetail {
  id: string;
  user_id: string;
  full_name: string | null;
  department: string | null;
  position: string | null;
  courses_assigned: number;
  courses_completed: number;
  courses_in_progress: number;
  avg_progress: number;
  assessment_completed: boolean;
  assessment_score: number | null;
  assessment_total: number | null;
  knowledge_gaps: string[];
}

interface AssessmentSection {
  section: string;
  total: number;
  correct: number;
  avgScore: number;
}

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  assessmentsCompleted: number;
  avgAssessmentScore: number;
  teamMembers: TeamMemberDetail[];
  sectionStats: AssessmentSection[];
  courseProgress: { title: string; assigned: number; completed: number; avgProgress: number }[];
}

const SECTION_NAMES: { [key: string]: string } = {
  git: "Git y Control de Versiones",
  sql: "Bases de Datos SQL",
  patterns: "Patrones de Diseño",
  ai: "Inteligencia Artificial",
  devops: "Infraestructura y DevOps",
  networks: "Internet y Redes",
  frontend: "Frontend y Navegadores",
  security: "Protocolos y Seguridad",
  teamwork: "Trabajo en Equipo",
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    inProgressAssignments: 0,
    assessmentsCompleted: 0,
    avgAssessmentScore: 0,
    teamMembers: [],
    sectionStats: [],
    courseProgress: [],
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAndFetch();
  }, [user]);

  const checkAdminAndFetch = async () => {
    if (!user) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      toast.error("Acceso denegado. Solo administradores.");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, department, position");

      // Fetch courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, category")
        .eq("is_active", true);

      // Fetch user courses with progress
      const { data: userCourses } = await supabase
        .from("user_courses")
        .select("user_id, course_id, status, progress");

      // Fetch assessments
      const { data: assessments } = await supabase
        .from("assessments")
        .select("user_id, status, correct_answers, total_questions, results");

      // Fetch assessment responses for section analysis
      const { data: responses } = await supabase
        .from("assessment_responses")
        .select("assessment_id, section, is_correct");

      // Calculate section stats across all users
      const sectionMap: { [key: string]: { total: number; correct: number } } = {};
      (responses || []).forEach((r) => {
        if (!sectionMap[r.section]) {
          sectionMap[r.section] = { total: 0, correct: 0 };
        }
        sectionMap[r.section].total += 1;
        if (r.is_correct) sectionMap[r.section].correct += 1;
      });

      const sectionStats: AssessmentSection[] = Object.entries(sectionMap)
        .map(([section, data]) => ({
          section,
          total: data.total,
          correct: data.correct,
          avgScore: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        }))
        .sort((a, b) => a.avgScore - b.avgScore);

      // Build team member details
      const teamMembers: TeamMemberDetail[] = (profiles || []).map((profile) => {
        const memberCourses = (userCourses || []).filter((c) => c.user_id === profile.user_id);
        const memberAssessment = (assessments || []).find(
          (a) => a.user_id === profile.user_id && a.status === "completed"
        );

        // Parse results to find knowledge gaps
        let knowledgeGaps: string[] = [];
        if (memberAssessment?.results) {
          const results = memberAssessment.results as { [key: string]: { correct: number; total: number } };
          knowledgeGaps = Object.entries(results)
            .filter(([, data]) => data.total > 0 && (data.correct / data.total) < 0.6)
            .map(([section]) => section);
        }

        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          department: profile.department,
          position: profile.position,
          courses_assigned: memberCourses.length,
          courses_completed: memberCourses.filter((c) => c.status === "completed").length,
          courses_in_progress: memberCourses.filter((c) => c.status === "in_progress").length,
          avg_progress:
            memberCourses.length > 0
              ? Math.round(memberCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / memberCourses.length)
              : 0,
          assessment_completed: memberAssessment?.status === "completed",
          assessment_score: memberAssessment?.correct_answers || null,
          assessment_total: memberAssessment?.total_questions || null,
          knowledge_gaps: knowledgeGaps,
        };
      });

      // Calculate course progress
      const courseProgress = (courses || []).map((course) => {
        const courseAssignments = (userCourses || []).filter((uc) => uc.course_id === course.id);
        return {
          title: course.title,
          assigned: courseAssignments.length,
          completed: courseAssignments.filter((c) => c.status === "completed").length,
          avgProgress:
            courseAssignments.length > 0
              ? Math.round(
                  courseAssignments.reduce((acc, c) => acc + (c.progress || 0), 0) /
                    courseAssignments.length
                )
              : 0,
        };
      });

      // Calculate assessment stats
      const completedAssessments = (assessments || []).filter((a) => a.status === "completed");
      const avgScore =
        completedAssessments.length > 0
          ? Math.round(
              completedAssessments.reduce(
                (acc, a) => acc + ((a.correct_answers || 0) / (a.total_questions || 1)) * 100,
                0
              ) / completedAssessments.length
            )
          : 0;

      setStats({
        totalUsers: profiles?.length || 0,
        totalCourses: courses?.length || 0,
        totalAssignments: userCourses?.length || 0,
        completedAssignments: userCourses?.filter((c) => c.status === "completed").length || 0,
        inProgressAssignments: userCourses?.filter((c) => c.status === "in_progress").length || 0,
        assessmentsCompleted: completedAssessments.length,
        avgAssessmentScore: avgScore,
        teamMembers,
        sectionStats,
        courseProgress,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error al cargar datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Generate trend data for charts (simulated based on current data)
  const generateTrendData = (members: TeamMemberDetail[]) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const baseAssessments = Math.max(1, stats.assessmentsCompleted);
    const baseCourses = Math.max(1, stats.completedAssignments);
    
    return months.map((month, index) => {
      const factor = (index + 1) / 6;
      return {
        date: month,
        assessments: Math.round(baseAssessments * factor),
        coursesCompleted: Math.round(baseCourses * factor),
        avgScore: Math.round(stats.avgAssessmentScore * (0.7 + factor * 0.3)),
      };
    });
  };

  const generateScoreDistribution = (members: TeamMemberDetail[]) => {
    const ranges = [
      { range: '0-20%', min: 0, max: 20, count: 0 },
      { range: '21-40%', min: 21, max: 40, count: 0 },
      { range: '41-60%', min: 41, max: 60, count: 0 },
      { range: '61-80%', min: 61, max: 80, count: 0 },
      { range: '81-100%', min: 81, max: 100, count: 0 },
    ];

    members.forEach(member => {
      if (member.assessment_completed && member.assessment_score !== null && member.assessment_total) {
        const score = (member.assessment_score / member.assessment_total) * 100;
        const range = ranges.find(r => score >= r.min && score <= r.max);
        if (range) range.count++;
      }
    });

    return ranges.map(r => ({ range: r.range, count: r.count }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const completionRate =
    stats.totalAssignments > 0
      ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard de Administrador</h1>
        <p className="text-muted-foreground">
          Métricas detalladas del progreso y rendimiento del equipo
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
              <p className="text-sm text-muted-foreground">Miembros del Equipo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-accent/10 p-3">
              <Brain className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.assessmentsCompleted}</p>
              <p className="text-sm text-muted-foreground">Evaluaciones Completadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${getScoreColor(stats.avgAssessmentScore)}`}>
                {stats.avgAssessmentScore}%
              </p>
              <p className="text-sm text-muted-foreground">Puntaje Promedio</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-accent/10 p-3">
              <GraduationCap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
              <p className="text-sm text-muted-foreground">Tasa de Completación</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ProgressTrendsChart 
          data={generateTrendData(stats.teamMembers)} 
        />
        <ScoreDistributionChart 
          data={generateScoreDistribution(stats.teamMembers)} 
        />
      </div>

      <SectionPerformanceChart 
        data={stats.sectionStats.map(s => ({
          section: SECTION_NAMES[s.section] || s.section,
          avgScore: s.avgScore
        }))}
      />

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="assessments" className="gap-2">
            <Brain className="h-4 w-4" />
            Evaluaciones
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Cursos
          </TabsTrigger>
        </TabsList>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progreso Individual del Equipo</CardTitle>
              <CardDescription>
                Detalle del avance de cada miembro en cursos y evaluaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-center">Cursos</TableHead>
                    <TableHead className="text-center">Progreso Avg</TableHead>
                    <TableHead className="text-center">Evaluación</TableHead>
                    <TableHead>Brechas de Conocimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.full_name || "Sin nombre"}</p>
                            <p className="text-xs text-muted-foreground">{member.position || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.department || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-medium text-green-500">{member.courses_completed}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{member.courses_assigned}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={member.avg_progress} className="h-2 w-16" />
                          <span className="text-sm text-muted-foreground">{member.avg_progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {member.assessment_completed ? (
                          <Badge
                            variant="outline"
                            className={getScoreColor(
                              ((member.assessment_score || 0) / (member.assessment_total || 1)) * 100
                            )}
                          >
                            {member.assessment_score}/{member.assessment_total}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {member.knowledge_gaps.length > 0 ? (
                            member.knowledge_gaps.slice(0, 3).map((gap) => (
                              <Badge key={gap} variant="destructive" className="text-xs">
                                {SECTION_NAMES[gap] || gap}
                              </Badge>
                            ))
                          ) : member.assessment_completed ? (
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Sin brechas
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  Áreas con Mayor Brecha
                </CardTitle>
                <CardDescription>Secciones donde el equipo necesita más capacitación</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.sectionStats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Brain className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No hay datos de evaluaciones aún
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.sectionStats.slice(0, 5).map((section) => (
                      <div key={section.section} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {section.avgScore < 60 && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                            <span className="text-foreground">
                              {SECTION_NAMES[section.section] || section.section}
                            </span>
                          </div>
                          <span className={`font-medium ${getScoreColor(section.avgScore)}`}>
                            {section.avgScore}%
                          </span>
                        </div>
                        <Progress
                          value={section.avgScore}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Áreas de Fortaleza
                </CardTitle>
                <CardDescription>Secciones donde el equipo tiene mejor desempeño</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.sectionStats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Award className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No hay datos de evaluaciones aún
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...stats.sectionStats].reverse().slice(0, 5).map((section) => (
                      <div key={section.section} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {section.avgScore >= 80 && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-foreground">
                              {SECTION_NAMES[section.section] || section.section}
                            </span>
                          </div>
                          <span className={`font-medium ${getScoreColor(section.avgScore)}`}>
                            {section.avgScore}%
                          </span>
                        </div>
                        <Progress
                          value={section.avgScore}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Resumen de Evaluaciones por Sección
              </CardTitle>
              <CardDescription>
                Rendimiento promedio del equipo en cada área de conocimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.sectionStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Brain className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aún no hay evaluaciones completadas
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {stats.sectionStats.map((section) => (
                    <div
                      key={section.section}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {SECTION_NAMES[section.section] || section.section}
                        </span>
                        <span className={`text-lg font-bold ${getScoreColor(section.avgScore)}`}>
                          {section.avgScore}%
                        </span>
                      </div>
                      <Progress value={section.avgScore} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {section.correct} correctas de {section.total} respuestas
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-primary/10 p-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCourses}</p>
                  <p className="text-sm text-muted-foreground">Cursos Activos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-accent/10 p-3">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.inProgressAssignments}</p>
                  <p className="text-sm text-muted-foreground">En Progreso</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.completedAssignments}</p>
                  <p className="text-sm text-muted-foreground">Completados</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progreso por Curso</CardTitle>
              <CardDescription>Estado de avance de cada curso asignado</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.courseProgress.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No hay cursos creados aún</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead className="text-center">Asignados</TableHead>
                      <TableHead className="text-center">Completados</TableHead>
                      <TableHead>Progreso Promedio</TableHead>
                      <TableHead className="text-center">Tasa de Éxito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.courseProgress.map((course) => {
                      const successRate =
                        course.assigned > 0
                          ? Math.round((course.completed / course.assigned) * 100)
                          : 0;
                      return (
                        <TableRow key={course.title}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell className="text-center">{course.assigned}</TableCell>
                          <TableCell className="text-center">{course.completed}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={course.avgProgress} className="h-2 w-24" />
                              <span className="text-sm text-muted-foreground">
                                {course.avgProgress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={successRate >= 80 ? "default" : successRate >= 50 ? "secondary" : "destructive"}
                            >
                              {successRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
