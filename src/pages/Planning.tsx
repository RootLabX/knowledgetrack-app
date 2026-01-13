import { useEffect, useState } from "react";
import { ArrowRight, Calendar as CalendarIcon, MoreHorizontal, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { usePlanning } from "@/hooks/usePlanning";
import { CreatePlanningDialog } from "@/components/planning/CreatePlanningDialog";
import { supabase } from "@/integrations/supabase/client";

interface Department {
  id: string;
  name: string;
}

const statusLabelMap: Record<string, string> = {
  in_progress: "En progreso",
  planned: "Planificada",
  completed: "Completada",
};

const statusBadgeClasses: Record<string, string> = {
  in_progress: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100",
  planned: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100",
  completed: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100",
};

const Planning = () => {
  const { objectives, progressMap, loading, createPlanning } = usePlanning();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Check Admin Role
      const { data: { user } } = await supabase.auth.getUser();
      let adminRole = false;
      if (user) {
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
        adminRole = !!data;
        setIsAdmin(adminRole);
      }

      // Fetch Departments
      const { data: depts } = await supabase.from("departments").select("id, name");
      let currentDepts: Department[] = [];
      if (depts) {
        setDepartments(depts);
        currentDepts = depts;
      }

      // Fetch User Profile
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("department")
          .eq("id", user.id)
          .single();

        if (profile?.department) {
          setUserDepartment(profile.department);

          // Auto-select user's department for filter
          const userDeptId = currentDepts.find(d => d.name === profile.department)?.id;
          if (userDeptId) {
            setSelectedDeptFilter(userDeptId);
          }
        }
      }
    };
    fetchData();
  }, []);

  const getFilteredObjectives = () => {
    let filtered = objectives;

    // Strict Filtering for Non-Admins
    if (!isAdmin) {
      const userDeptId = userDepartment ? departments.find(d => d.name === userDepartment)?.id : null;
      filtered = filtered.filter(obj => {
        if (!obj.department_id) return true; // Global
        if (userDeptId && obj.department_id === userDeptId) return true; // User Dept
        return false;
      });
    }

    // UI Filter
    if (selectedDeptFilter !== 'all') {
      if (selectedDeptFilter === 'global') {
        filtered = filtered.filter(obj => !obj.department_id);
      } else {
        filtered = filtered.filter(obj => obj.department_id === selectedDeptFilter);
      }
    }

    return filtered;
  };

  const filteredObjectives = getFilteredObjectives();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900" id="planningHeader">
            Planificación
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">
              Gestiona tus ciclos de objetivos y capacitaciones
            </p>
            {userDepartment && <Badge variant="outline">{userDepartment}</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-[200px]">
            <Select value={selectedDeptFilter} onValueChange={setSelectedDeptFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Filtrar por depto..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Deptos</SelectItem>
                <SelectItem value="global">🏢 Global (Sin Depto)</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CreatePlanningDialog onCreate={createPlanning} departments={departments} />
        </div>
      </div>

      {/* Content Grid */}
      {filteredObjectives.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-300 mb-4">
            <Plus className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No hay planificaciones</h3>
          <p className="text-gray-500 mt-1 mb-4">
            {userDepartment
              ? `No hay planificaciones para el departamento ${userDepartment}.`
              : "Comienza creando tu primera planificación anual o trimestral."}
          </p>
          <CreatePlanningDialog onCreate={createPlanning} departments={departments} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="planningGrid">
          {filteredObjectives.map((objective) => {
            const statusKey = objective.status ?? "in_progress";
            const statusLabel = statusLabelMap[statusKey] ?? "En progreso";
            const statusClasses =
              statusBadgeClasses[statusKey] ?? statusBadgeClasses["in_progress"];
            const progress = progressMap[objective.id] ?? 0;

            return (
              <Card
                key={objective.id}
                onClick={() => navigate(`/planning/${objective.id}`)}
                className="
                  group 
                  hover:shadow-md 
                  transition-all 
                  duration-200 
                  border-gray-200 
                  bg-white 
                  cursor-pointer
                  hover:bg-gray-50
                  active:scale-[0.99]
                "
                id={`planCard-${objective.id}`}
                data-status={objective.status}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className={statusClasses}>
                      {statusLabel}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600"
                          // para que el menú no dispare el onClick del Card
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        // idem: evitar que el click en el menú navegue
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardTitle className="text-xl font-semibold text-gray-900 mt-3 line-clamp-1">
                    {objective.title}
                  </CardTitle>

                  {objective.start_date && (
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                      <span>
                        {format(new Date(objective.start_date), "dd/MM/yyyy", { locale: es })}
                        {objective.end_date &&
                          ` – ${format(new Date(objective.end_date), "dd/MM/yyyy", {
                            locale: es,
                          })}`}
                      </span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="text-sm text-gray-600 line-clamp-2 h-10 mb-4">
                    {objective.description || "Sin descripción disponible."}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>Progreso</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-gray-100" />
                  </div>

                  <div className="mt-3 flex justify-end">
                    <ArrowRight
                      className="
                        h-4 w-4 
                        text-gray-300 
                        opacity-0 
                        group-hover:opacity-100 
                        transition-all 
                        group-hover:translate-x-1
                      "
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Planning;

