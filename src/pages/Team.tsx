import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Brain, Plus, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  full_name: string | null;
  department: string | null;
  position: string | null;
  role: string;
  courses_assigned: number;
  courses_completed: number;
  is_assessment_enabled: boolean;
}

interface Course {
  id: string;
  title: string;
  category: string;
}

const Team = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  useEffect(() => {
    fetchTeamData();
    checkAdminRole();
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    setIsAdmin(!!data);
  };

  const fetchTeamData = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, department, position, is_assessment_enabled");

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch user courses
      const { data: userCourses, error: userCoursesError } = await supabase
        .schema("mapper")
        .from("user_courses")
        .select("user_id, status");

      if (userCoursesError) throw userCoursesError;

      const members: TeamMember[] = profiles.map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        const userCoursesData = userCourses?.filter((c) => c.user_id === profile.id) || [];

        return {
          id: profile.id,
          full_name: profile.full_name,
          department: profile.department,
          position: profile.position,
          role: userRole?.role || "user",
          courses_assigned: userCoursesData.length,
          courses_completed: userCoursesData.filter((c) => c.status === "completed").length,
          is_assessment_enabled: profile.is_assessment_enabled || false,
        };
      });

      setTeamMembers(members);

      // Fetch courses for assignment
      const { data: coursesData } = await supabase
        .schema("mapper")
        .from("courses")
        .select("id, title, category")
        .eq("is_active", true);

      setCourses(coursesData || []);
    } catch (error) {
      console.error("Error fetching team data:", error);
      toast.error("Error al cargar el equipo");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourse = async () => {
    if (!selectedMember || !selectedCourse) return;

    try {
      const { error } = await supabase
        .schema("mapper")
        .from("user_courses")
        .insert({
          user_id: selectedMember.id,
          course_id: selectedCourse,
          status: 'assigned',
          progress: 0,
          assigned_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success("Curso asignado correctamente");
      setAssignDialogOpen(false);
      setSelectedCourse("");
      fetchTeamData();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Este curso ya está asignado a este usuario");
      } else {
        console.error("Error assigning course:", error);
        toast.error("Error al asignar el curso");
      }
    }
  };

  const toggleAssessment = async (memberId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_assessment_enabled: !currentValue })
        .eq("id", memberId);

      if (error) throw error;

      setTeamMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, is_assessment_enabled: !currentValue } : m
        )
      );
      toast.success(!currentValue ? "Evaluación habilitada" : "Evaluación deshabilitada");
    } catch (error) {
      console.error("Error toggling assessment:", error);
      toast.error("Error al cambiar el estado de la evaluación");
    }
  };

  const departments = Array.from(
    new Set(teamMembers.map((m) => m.department).filter(Boolean))
  ).sort() as string[];

  const filteredMembers = departmentFilter === "all"
    ? teamMembers
    : teamMembers.filter((m) => m.department === departmentFilter);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
          <p className="text-muted-foreground">Gestiona los miembros del equipo y sus cursos asignados</p>
        </div>
        {isAdmin && (
          <Button disabled>
            <UserPlus className="mr-2 h-4 w-4" />
            Invitar Miembro
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
              <p className="text-sm text-muted-foreground">Total Miembros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-accent/10 p-3">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {teamMembers.reduce((acc, m) => acc + m.courses_assigned, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Cursos Asignados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-warning/10 p-3">
              <BookOpen className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {teamMembers.reduce((acc, m) => acc + m.courses_completed, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Cursos Completados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Miembros del Equipo</CardTitle>
            <CardDescription className="mt-1">Lista de todos los miembros y su progreso</CardDescription>
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {departmentFilter === "all" ? "No hay miembros en el equipo" : "No hay miembros en este departamento"}
              </p>
              <p className="text-sm text-muted-foreground">
                {departmentFilter === "all"
                  ? "Los usuarios aparecerán aquí cuando se registren"
                  : "Prueba con otro departamento"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {member.full_name || "Sin nombre"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.position || "Sin cargo"} • {member.department || "Sin departamento"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                      {member.role === "admin" ? "Admin" : "Usuario"}
                    </Badge>
                    <div className="w-32">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progreso</span>
                        <span>
                          {member.courses_completed}/{member.courses_assigned}
                        </span>
                      </div>
                      <Progress
                        value={
                          member.courses_assigned > 0
                            ? (member.courses_completed / member.courses_assigned) * 100
                            : 0
                        }
                        className="mt-1 h-2"
                      />
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2" title={member.is_assessment_enabled ? "Evaluación habilitada" : "Evaluación deshabilitada"}>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={member.is_assessment_enabled}
                          onCheckedChange={() => toggleAssessment(member.id, member.is_assessment_enabled)}
                        />
                      </div>
                    )}
                    {isAdmin && (
                      <Dialog open={assignDialogOpen && selectedMember?.id === member.id} onOpenChange={(open) => {
                        setAssignDialogOpen(open);
                        if (open) setSelectedMember(member);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="mr-1 h-4 w-4" />
                            Asignar Curso
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Asignar Curso</DialogTitle>
                            <DialogDescription>
                              Selecciona un curso para asignar a {member.full_name || "este usuario"}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un curso" />
                              </SelectTrigger>
                              <SelectContent>
                                {courses.map((course) => (
                                  <SelectItem key={course.id} value={course.id}>
                                    {course.title} ({course.category})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {courses.length === 0 && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                No hay cursos disponibles. Crea uno primero.
                              </p>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleAssignCourse} disabled={!selectedCourse}>
                              Asignar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
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

export default Team;
