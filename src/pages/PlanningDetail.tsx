import { useMemo } from "react";
// 1. Asegúrate de importar Link desde react-router-dom
import { useNavigate, useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CalendarRange,
  Target,
  MoreHorizontal,
  // ArrowRight, // Ya no necesitamos ArrowRight
} from "lucide-react";

// ... (Resto de imports se mantienen igual: UI components, Hooks, etc.) ...
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlanningDetail } from "@/hooks/usePlanningDetail";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createSprint, updateSprint, deleteSprint } from "@/lib/planningApi";
import { CreateSprintDialog } from "@/components/planning/CreateSprintDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";

// ... (Mapas de estado y colores se mantienen igual) ...
const statusLabelMap: Record<string, string> = {
  in_progress: "En progreso",
  planned: "Planificada",
  completed: "Completada",
};

const statusBadgeClasses: Record<string, string> = {
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  planned: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusBorderClasses: Record<string, string> = {
  in_progress: "bg-blue-500",
  planned: "bg-amber-500",
  completed: "bg-emerald-500",
};

const PlanningDetail = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { plan, loading, refetch } = usePlanningDetail(planId);

  const computedStatus = useMemo(() => {
    if (!plan || !plan.planning_sprints) return plan?.status || "planned";

    const allTasks = plan.planning_sprints.flatMap(s => s.planning_tasks || []);

    // Si no hay tareas, asumimos Planificada
    if (allTasks.length === 0) return "planned";

    const allDone = allTasks.every(t => t.status === 'done');
    if (allDone) return "completed";

    const allTodo = allTasks.every(t => t.status === 'todo');
    if (allTodo) return "planned";

    return "in_progress";
  }, [plan]);

  const statusKey = computedStatus;
  const statusLabel = statusLabelMap[statusKey] ?? "En progreso";
  const badgeClass = statusBadgeClasses[statusKey] ?? statusBadgeClasses.in_progress;

  const dateRange = useMemo(() => {
    if (!plan?.start_date) return null;
    const start = format(new Date(plan.start_date), "dd/MM/yyyy", { locale: es });
    const end = plan.end_date
      ? format(new Date(plan.end_date), "dd/MM/yyyy", { locale: es })
      : null;
    return end ? `${start} – ${end}` : start;
  }, [plan?.start_date, plan?.end_date]);

  const stats = useMemo(() => {
    if (!plan?.planning_sprints) return { completedTasks: 0, totalTasks: 0, progress: 0 };

    const allTasks = plan.planning_sprints.flatMap(s => s.planning_tasks || []);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'done').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { completedTasks, totalTasks, progress };
  }, [plan]);

  // ... (handleCreateSprint se mantiene igual) ...
  const handleCreateSprint = async (formData: any) => {
    // ... tu lógica existente ...
    if (!planId || !user) return;
    try {
      await createSprint({
        planning_id: planId,
        title: formData.title,
        goal: formData.goal,
        start_date: formData.start_date || new Date().toISOString(),
        end_date: formData.end_date || new Date().toISOString(),
        created_by: user.id,
      });
      toast({ title: "Sprint creado", description: `El sprint "${formData.title}" se ha añadido correctamente.` });
      if (refetch) refetch(); else navigate(0);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo crear el sprint.", variant: "destructive" });
    }
  };

  const handleUpdateSprint = async (sprintId: string, formData: any) => {
    try {
      await updateSprint(sprintId, {
        title: formData.title,
        goal: formData.goal,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      toast({ title: "Sprint actualizado", description: "Los cambios se han guardado correctamente." });
      if (refetch) refetch(); else navigate(0);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo actualizar el sprint.", variant: "destructive" });
    }
  };

  const handleDeleteSprint = async (sprintId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Navigation
    e.stopPropagation();

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se eliminará el sprint y todas sus tareas. Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteSprint(sprintId);
        Swal.fire('¡Eliminado!', 'El sprint ha sido eliminado.', 'success');
        if (refetch) refetch(); else navigate(0);
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudo eliminar el sprint.", variant: "destructive" });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/planning")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <div className="text-sm text-gray-600">Planificación no encontrada.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate("/planning")} className="pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Planificaciones
        </Button>
      </div>

      {/* Header Principal */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{plan.title}</h1>
              <Badge variant="outline" className={`${badgeClass} font-medium`}>{statusLabel}</Badge>
            </div>
            {dateRange && (
              <div className="flex items-center text-sm text-gray-500 font-medium">
                <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                <span>{dateRange}</span>
              </div>
            )}
          </div>
          <CreateSprintDialog onCreate={handleCreateSprint} />
        </div>
        {plan.description && (
          <>
            <div className="h-px bg-gray-100 my-2" />
            <p className="text-gray-600 max-w-4xl text-sm leading-relaxed">{plan.description}</p>
          </>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Sprints Totales</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{plan.planning_sprints?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Iteraciones planificadas</p>
          </CardContent>
        </Card>
        {/* ... (Otras cards de estadísticas se mantienen igual) ... */}
        <Card className="shadow-sm border-gray-200 bg-gray-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Objetivos Completados</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.completedTasks} <span className="text-sm text-gray-400 font-normal">/ {stats.totalTasks}</span></div>
            <p className="text-xs text-muted-foreground mt-1">Tareas completadas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200 bg-gray-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Progreso General</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.progress === 100 ? 'text-emerald-600' : 'text-gray-900'}`}>{stats.progress}%</div>
            <p className="text-xs text-muted-foreground mt-1">Calculado por tareas</p>
          </CardContent>
        </Card>
      </div>

      {/* Sprints List - AHORA CLICKABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Cronograma de Sprints</h2>
        </div>

        {plan.planning_sprints && plan.planning_sprints.length > 0 ? (
          <div className="grid gap-4">
            {plan.planning_sprints
              .sort((a, b) => new Date(a.start_date || '').getTime() - new Date(b.start_date || '').getTime())
              .map((sprint) => {
                // Lógica de estado dinámico basada en TAREAS
                const getSprintStatus = () => {
                  const tasks = sprint.planning_tasks || [];
                  if (tasks.length === 0) return "planned"; // Por defecto si no hay tareas

                  const allDone = tasks.every(t => t.status === 'done');
                  if (allDone) return "completed";

                  const allTodo = tasks.every(t => t.status === 'todo');
                  if (allTodo) return "planned";

                  // Si hay mezcla o alguna en in_progress
                  return "in_progress";
                };

                const computedStatus = getSprintStatus();

                return (
                  <Link
                    key={sprint.id}
                    to={`/planning/sprint/${sprint.id}`}
                    className="group relative block overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md hover:border-gray-300 hover:scale-[1.005] cursor-pointer"
                  >
                    {/* Franja de color lateral */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusBorderClasses[computedStatus] || 'bg-gray-300'}`} />

                    <div className="flex flex-col sm:flex-row sm:items-center p-5 pl-7 gap-5">
                      {/* Bloque 1: Info Principal */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-primary transition-colors">
                            {sprint.title}
                          </h3>
                          <Badge variant="secondary" className={`text-xs capitalize font-normal ${statusBadgeClasses[computedStatus]}`}>
                            {statusLabelMap[computedStatus] || computedStatus}
                          </Badge>
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarRange className="mr-2 h-3.5 w-3.5 text-gray-400" />
                          <span>
                            {sprint.start_date ? format(new Date(sprint.start_date), "d MMM yyyy", { locale: es }) : "Sin fecha"}
                            {" - "}
                            {sprint.end_date ? format(new Date(sprint.end_date), "d MMM yyyy", { locale: es }) : "Sin fecha"}
                          </span>
                        </div>
                      </div>

                      {/* Bloque 2: Objetivo */}
                      {sprint.goal && (
                        <div className="hidden md:block flex-[1.5] border-l pl-5 py-1">
                          <div className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                            <p className="text-sm text-gray-600 line-clamp-2 italic">
                              "{sprint.goal}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Dropdown de Acciones */}
                      <div className="flex items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <CreateSprintDialog
                              mode="edit"
                              initialData={{
                                id: sprint.id,
                                title: sprint.title,
                                goal: sprint.goal,
                                start_date: sprint.start_date,
                                end_date: sprint.end_date
                              }}
                              onCreate={(data) => handleUpdateSprint(sprint.id, data)}
                              trigger={
                                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                  Editar
                                </div>
                              }
                            />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={(e) => handleDeleteSprint(sprint.id, e as any)}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Flecha indicadora (Opcional, para dar feedback visual de "ir") */}
                      <div className="hidden sm:flex items-center justify-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-200">
                        <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                      </div>

                    </div>
                  </Link>
                );
              })}
          </div>
        ) : (
          /* Empty State se mantiene igual */
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
            {/* ... contenido del empty state ... */}
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <CalendarRange className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No hay sprints definidos</h3>
            <p className="text-gray-500 max-w-sm mt-1 mb-6">
              Divide tu planificación en periodos cortos (Sprints) para gestionar mejor las tareas y objetivos.
            </p>
            <CreateSprintDialog
              onCreate={handleCreateSprint}
              triggerLabel="Crear mi primer Sprint"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningDetail;