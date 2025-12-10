import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReportStats {
  totalUsers: number;
  totalCourses: number;
  totalAssignments: number;
  completedAssignments: number;
  inProgressAssignments: number;
  coursesByCategory: { category: string; count: number }[];
  topCourses: { title: string; assigned: number; completed: number }[];
}

const Reports = () => {
  const [stats, setStats] = useState<ReportStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    inProgressAssignments: 0,
    coursesByCategory: [],
    topCourses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Fetch courses
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .schema("mapper");

      if (coursesError) throw coursesError;

      // Fetch user courses (assignments)
      const { data: userCourses, error: userCoursesError } = await supabase
        .from("user_courses")
        .select("*")
        .schema("mapper");

      if (userCoursesError) throw userCoursesError;

      // Calculate stats
      const coursesByCategory = (courses || []).reduce((acc: { [key: string]: number }, course) => {
        acc[course.category] = (acc[course.category] || 0) + 1;
        return acc;
      }, {});

      const topCourses = (courses || []).map((course) => {
        const courseAssignments = (userCourses || []).filter((uc) => uc.course_id === course.id);
        return {
          title: course.title,
          assigned: courseAssignments.length,
          completed: courseAssignments.filter((c) => c.status === "completed").length,
        };
      }).sort((a, b) => b.assigned - a.assigned).slice(0, 5);

      setStats({
        totalUsers: usersCount || 0,
        totalCourses: courses?.length || 0,
        totalAssignments: userCourses?.length || 0,
        completedAssignments: userCourses?.filter((c) => c.status === "completed").length || 0,
        inProgressAssignments: userCourses?.filter((c) => c.status === "in_progress").length || 0,
        coursesByCategory: Object.entries(coursesByCategory).map(([category, count]) => ({
          category,
          count: count as number,
        })),
        topCourses,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate =
    stats.totalAssignments > 0
      ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
      : 0;

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
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Métricas y estadísticas de capacitación del equipo</p>
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
              <p className="text-sm text-muted-foreground">Usuarios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-accent/10 p-3">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalCourses}</p>
              <p className="text-sm text-muted-foreground">Cursos Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-warning/10 p-3">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.inProgressAssignments}</p>
              <p className="text-sm text-muted-foreground">En Progreso</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-accent/10 p-3">
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completedAssignments}</p>
              <p className="text-sm text-muted-foreground">Completados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tasa de Completación General
          </CardTitle>
          <CardDescription>Porcentaje de cursos completados sobre el total asignado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-foreground">{completionRate}%</span>
              <span className="text-sm text-muted-foreground">
                {stats.completedAssignments} de {stats.totalAssignments} cursos
              </span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Courses by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Cursos por Categoría
            </CardTitle>
            <CardDescription>Distribución de cursos activos</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.coursesByCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No hay cursos creados aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.coursesByCategory.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{item.category}</span>
                      <span className="font-medium text-muted-foreground">{item.count} cursos</span>
                    </div>
                    <Progress
                      value={(item.count / stats.totalCourses) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Cursos Más Populares
            </CardTitle>
            <CardDescription>Cursos con más asignaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No hay datos de cursos aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topCourses.map((course, index) => (
                  <div key={course.title} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{course.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {course.completed}/{course.assigned} completados
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
