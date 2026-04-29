
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, getQuarter, getYear } from "date-fns";
import { es } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Target,
    Calendar,
    TrendingUp,
    CheckCircle2,
    MoreHorizontal,
    Pencil,
    Trash2,
    BarChart3,
    Eye,
    LayoutDashboard,
    Network,
    LineChart
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StrategicObjective {
    id: string;
    title: string;
    description: string;
    kpi_metric: string;
    kpi_target: number;
    kpi_current: number;
    kpi_unit: string;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed' | 'archived';
    department_id?: string;
    parent_id?: string | null;
}

interface Department {
    id: string;
    name: string;
}

const Objectives = () => {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [parentSearch, setParentSearch] = useState("");
    // For deletion confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("general");
    const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
    const [selectedQuarter, setSelectedQuarter] = useState<1|2|3|4>(1);

    // View Details State
    const [viewObjective, setViewObjective] = useState<StrategicObjective | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    const [currentObj, setCurrentObj] = useState<Partial<StrategicObjective>>({});

    // 1. Fetch Departments
    const { data: departments } = useQuery({
        queryKey: ["departments"],
        queryFn: async () => {
            // @ts-ignore - Table likely missing from types
            const { data, error } = await supabase.from("departments").select("id, name");
            if (error) throw error;
            return data as Department[];
        }
    });

    // 2. Fetch User Profile to get their department
    const { data: userProfile } = useQuery({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // Select all to avoid single column errors if schema differs
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) return null;
            return data;
        }
    });

    const { data: objectives, isLoading } = useQuery({
        queryKey: ["strategic-objectives"],
        queryFn: async () => {
            const { data, error } = await supabase
                .schema("mapper")
                .from("strategic_objectives")
                .select("*")
                .order("deadline", { ascending: true });

            if (error) throw error;
            return data as StrategicObjective[];
        },
    });

    // Auto-select user's department for filter
    useEffect(() => {
        if (userProfile?.department && departments && selectedDeptFilter === 'all') {
            const userDeptId = departments.find(d => d.name === userProfile.department)?.id;
            if (userDeptId) {
                setSelectedDeptFilter(userDeptId);
            }
        }
    }, [userProfile, departments]);

    const upsertMutation = useMutation({
        mutationFn: async (vars: any) => {
            // Clean up fields that might cause issues (like the joined 'department' object)
            const { department, ...cleanVars } = vars;

            if (isEditing && vars.id) {
                const { error } = await supabase
                    .schema('mapper')
                    .from('strategic_objectives')
                    .update(cleanVars)
                    .eq('id', vars.id);
                if (error) throw error;
            } else {
                const { id, ...newRecord } = cleanVars; // Remove ID if present to avoid issues on Insert
                const { error } = await supabase.schema('mapper').from('strategic_objectives').insert(newRecord);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategic-objectives'] });
            setIsCreateOpen(false);
            setIsEditing(false);
            toast.success(isEditing ? "Objetivo actualizado" : "Objetivo creado correctamente");
            resetForm();
        },
        onError: (err) => {
            toast.error("Error al guardar: " + err.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .schema('mapper')
                .from('strategic_objectives')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategic-objectives'] });
            setDeleteId(null);
            toast.success("Objetivo eliminado");
        },
        onError: (err) => {
            toast.error("Error al eliminar: " + err.message);
        }
    });

    const resetForm = () => {
        setCurrentObj({
            title: "",
            description: "",
            kpi_metric: "",
            kpi_target: 100,
            kpi_current: 0,
            kpi_unit: "%",
            deadline: new Date().toISOString().split('T')[0],
            status: "in_progress",
            department_id: ""
        });
        setIsEditing(false);
    };

    const openCreate = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEdit = (obj: StrategicObjective) => {
        setCurrentObj({
            ...obj,
            department_id: obj.department_id || "" // Ensure it has a value for controlled input
        });
        setIsEditing(true);
        setIsCreateOpen(true);
    };

    const handleSubmit = () => {
        if (!currentObj.title || !currentObj.kpi_metric) {
            toast.error("Por favor completa los campos requeridos");
            return;
        }
        upsertMutation.mutate(currentObj);
    };

    const calculateProgress = (curr: number, target: number) => {
        if (!target || target === 0) return 0;
        return Math.min(100, Math.max(0, ((curr || 0) / target) * 100));
    };

    // Check Admin Role
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
                setIsAdmin(!!data);
            }
        };
        checkAdmin();
    }, []);

    // Filter Logic
    const getFilteredObjectives = () => {
        if (!objectives) return [];

        let filtered = objectives;

        // Strict Filtering for Non-Admins
        if (!isAdmin) {
            const userDeptName = userProfile?.department;
            const userDeptId = userDeptName ? departments?.find(d => d.name === userDeptName)?.id : null;

            filtered = filtered.filter(o => {
                // Always show global objectives (no department)
                if (!o.department_id) return true;
                // Show department objectives if user matches
                if (userDeptId && o.department_id === userDeptId) return true;
                return false;
            });
        }



        // UI Filter (Dropdown)
        if (selectedDeptFilter !== 'all') {
            if (selectedDeptFilter === 'global') {
                filtered = filtered.filter(o => !o.department_id);
            } else {
                filtered = filtered.filter(o => o.department_id === selectedDeptFilter);
            }
        }

        // Return only Root Objectives (no parent) for the main grid
        return filtered.filter(o => !o.parent_id);
    };

    const filteredObjectives = getFilteredObjectives();

    const getQuarterlyData = () => {
        const data = filteredObjectives || [];

        const currentYear = new Date().getFullYear();
        const quarters = {
            1: { name: 'T1 (Ene-Mar)', total: 0, completed: 0, sumProgress: 0 },
            2: { name: 'T2 (Abr-Jun)', total: 0, completed: 0, sumProgress: 0 },
            3: { name: 'T3 (Jul-Sep)', total: 0, completed: 0, sumProgress: 0 },
            4: { name: 'T4 (Oct-Dic)', total: 0, completed: 0, sumProgress: 0 }
        };

        data.forEach(obj => {
            const date = new Date(obj.deadline);
            if (getYear(date) === currentYear) {
                const q = getQuarter(date) as 1 | 2 | 3 | 4;
                quarters[q].total += 1;
                const progress = calculateProgress(obj.kpi_current, obj.kpi_target);
                if (progress >= 100) quarters[q].completed += 1;
                quarters[q].sumProgress += progress;
            }
        });

        return Object.values(quarters).map(q => ({
            name: q.name,
            cumplimiento: q.total > 0 ? Math.round(q.sumProgress / q.total) : 0,
            objetivos: q.total
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const quarterlyData = getQuarterlyData();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Objetivos Estratégicos</h1>
                    <div className="text-muted-foreground mt-1">
                        Gestión de KPIs y Metas del Plan Anual de Capacitación
                        {userProfile?.department && <Badge variant="outline" className="ml-2">{userProfile.department}</Badge>}
                    </div>
                </div>

                <div className="flex gap-2 items-center">
                    <Select value={selectedDeptFilter} onValueChange={setSelectedDeptFilter}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Filtrar por depto..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Deptos</SelectItem>
                            <SelectItem value="global">🏢 Global (Sin Depto)</SelectItem>
                            {departments?.map(d => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Objetivo
                    </Button>
                </div>



                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    if (!open) {
                        resetForm();
                        setActiveTab("general");
                    }
                    setIsCreateOpen(open);
                }}>
                    <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
                        <div className="grid grid-cols-[250px_1fr] h-[550px]">
                            {/* Sidebar */}
                            <div className="bg-muted/30 border-r p-6 flex flex-col gap-2">
                                <DialogHeader className="mb-6 px-0">
                                    <DialogTitle>{isEditing ? "Editar Objetivo" : "Nuevo Objetivo"}</DialogTitle>
                                    <DialogDescription>Configura los detalles del KPI.</DialogDescription>
                                </DialogHeader>

                                <nav className="flex flex-col gap-1">
                                    <Button
                                        variant={activeTab === "general" ? "secondary" : "ghost"}
                                        className="justify-start"
                                        onClick={() => setActiveTab("general")}
                                    >
                                        <LayoutDashboard className="mr-2 h-4 w-4" /> General
                                    </Button>
                                    <Button
                                        variant={activeTab === "organization" ? "secondary" : "ghost"}
                                        className="justify-start"
                                        onClick={() => setActiveTab("organization")}
                                    >
                                        <Network className="mr-2 h-4 w-4" /> Organización
                                    </Button>
                                    <Button
                                        variant={activeTab === "metrics" ? "secondary" : "ghost"}
                                        className="justify-start"
                                        onClick={() => setActiveTab("metrics")}
                                    >
                                        <LineChart className="mr-2 h-4 w-4" /> Métricas
                                    </Button>
                                </nav>

                                <div className="mt-auto">
                                    <Button className="w-full" onClick={handleSubmit} disabled={upsertMutation.isPending}>
                                        {upsertMutation.isPending ? "Guardando..." : (isEditing ? "Actualizar" : "Crear")}
                                    </Button>
                                    <Button variant="ghost" className="w-full mt-2" onClick={() => setIsCreateOpen(false)}>
                                        Cancelar
                                    </Button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-6 overflow-y-auto">
                                {activeTab === "general" && (
                                    <div className="space-y-4 animate-in fade-in duration-300 slide-in-from-right-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Título del Objetivo</Label>
                                            <Input
                                                id="title"
                                                value={currentObj.title}
                                                onChange={e => setCurrentObj({ ...currentObj, title: e.target.value })}
                                                placeholder="Ej: Mejorar cobertura de seguridad"
                                                className="text-lg font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Descripción</Label>
                                            <Textarea
                                                id="description"
                                                value={currentObj.description || ''}
                                                onChange={e => setCurrentObj({ ...currentObj, description: e.target.value })}
                                                placeholder="Detalles de la estrategia..."
                                                className="min-h-[150px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="deadline">Fecha Límite</Label>
                                            <Input type="date" id="deadline" value={currentObj.deadline} onChange={e => setCurrentObj({ ...currentObj, deadline: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "organization" && (
                                    <div className="space-y-4 animate-in fade-in duration-300 slide-in-from-right-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="department">Departamento</Label>
                                            <Select
                                                value={currentObj.department_id || ""}
                                                onValueChange={v => setCurrentObj({ ...currentObj, department_id: v })}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Seleccionar Departamento" /></SelectTrigger>
                                                <SelectContent>
                                                    {departments?.map(d => (
                                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                                            <h4 className="font-semibold mb-1 flex items-center gap-2">
                                                <Network className="h-4 w-4" /> Jerarquía
                                            </h4>
                                            <p>Asignar un objetivo padre permite agrupar este KPI dentro de una estrategia mayor.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="parent">Objetivo Padre (Opcional)</Label>
                                            <Select
                                                value={currentObj.parent_id || "none"}
                                                onValueChange={v => setCurrentObj({ ...currentObj, parent_id: v === "none" ? null : v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar Padre" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin Padre (Objetivo Principal)</SelectItem>
                                                    {objectives
                                                        ?.filter(o => o.id !== currentObj.id)
                                                        .map(o => (
                                                            <SelectItem key={o.id} value={o.id}>
                                                                {o.title.substring(0, 50)}{o.title.length > 50 ? "..." : ""}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "metrics" && (
                                    <div className="space-y-4 animate-in fade-in duration-300 slide-in-from-right-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="metric">Nombre del KPI</Label>
                                                <Input id="metric" value={currentObj.kpi_metric} onChange={e => setCurrentObj({ ...currentObj, kpi_metric: e.target.value })} placeholder="Ej: % Completado" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="unit">Unidad</Label>
                                                <Select value={currentObj.kpi_unit} onValueChange={v => setCurrentObj({ ...currentObj, kpi_unit: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="%">Porcentaje (%)</SelectItem>
                                                        <SelectItem value="#">Numérico (#)</SelectItem>
                                                        <SelectItem value="$">Moneda ($)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-lg border space-y-4 mt-2">
                                            <h4 className="font-medium text-sm text-gray-700">Progreso Actual</h4>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="current" className="text-gray-600">Valor Actual</Label>
                                                    <Input
                                                        type="number"
                                                        id="current"
                                                        className="bg-white"
                                                        value={currentObj.kpi_current}
                                                        onChange={e => setCurrentObj({ ...currentObj, kpi_current: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="target" className="text-gray-600">Valor Meta (Target)</Label>
                                                    <Input
                                                        type="number"
                                                        id="target"
                                                        className="bg-white"
                                                        value={currentObj.kpi_target}
                                                        onChange={e => setCurrentObj({ ...currentObj, kpi_target: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Simulación de Progreso</span>
                                                    <span>{currentObj.kpi_current && currentObj.kpi_target ? Math.round((currentObj.kpi_current / currentObj.kpi_target) * 100) : 0}%</span>
                                                </div>
                                                <Progress value={currentObj.kpi_current && currentObj.kpi_target ? (currentObj.kpi_current / currentObj.kpi_target) * 100 : 0} className="h-2" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el objetivo estratégico.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* View Details Dialog */}
                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">{viewObjective?.title}</DialogTitle>
                            <DialogDescription>Detalles del objetivo estratégico</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground text-xs font-semibold uppercase">Descripción</Label>
                                <p className="text-sm bg-muted/30 p-3 rounded-md border">{viewObjective?.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase">Departamento</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {departments?.find(d => d.id === viewObjective?.department_id)?.name || "Sin asignar"}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase">Estado</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={viewObjective && calculateProgress(viewObjective.kpi_current, viewObjective.kpi_target) >= 100 ? "default" : "secondary"}>
                                            {viewObjective && calculateProgress(viewObjective.kpi_current, viewObjective.kpi_target) >= 100 ? "Completado" : "En Progreso"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/20 p-4 rounded-lg border space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" /> Métricas del KPI
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Métrica</p>
                                        <p className="font-medium text-sm">{viewObjective?.kpi_metric}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Actual</p>
                                        <p className="font-bold text-lg text-primary">
                                            {viewObjective?.kpi_current} <span className="text-xs font-normal text-muted-foreground">{viewObjective?.kpi_unit}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Meta</p>
                                        <p className="font-bold text-lg">
                                            {viewObjective?.kpi_target} <span className="text-xs font-normal text-muted-foreground">{viewObjective?.kpi_unit}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Progreso</span>
                                        <span className="font-medium">{viewObjective ? Math.round(calculateProgress(viewObjective.kpi_current, viewObjective.kpi_target)) : 0}%</span>
                                    </div>
                                    <Progress value={viewObjective ? calculateProgress(viewObjective.kpi_current, viewObjective.kpi_target) : 0} className="h-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase">Fecha Límite</Label>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {viewObjective?.deadline && format(new Date(viewObjective.deadline), "dd 'de' MMMM, yyyy", { locale: es })}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase">ID Sistema</Label>
                                    <p className="text-xs font-mono text-muted-foreground">{viewObjective?.id}</p>
                                </div>
                            </div>

                            {/* Sub-objectives Section */}
                            {objectives?.filter(child => child.parent_id === viewObjective?.id).length > 0 && (
                                <div className="space-y-2 pt-2 border-t">
                                    <h4 className="font-semibold text-sm">Sub-objetivos</h4>
                                    <div className="space-y-2">
                                        {objectives.filter(child => child.parent_id === viewObjective?.id).map(child => (
                                            <div key={child.id} className="flex justify-between items-center bg-muted/20 p-2 rounded border text-sm">
                                                <span>{child.title}</span>
                                                <Badge variant={calculateProgress(child.kpi_current, child.kpi_target) >= 100 ? "default" : "secondary"} className="text-[10px] h-5">
                                                    {Math.round(calculateProgress(child.kpi_current, child.kpi_target))}%
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsViewOpen(false)}>Cerrar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div >

            <Tabs defaultValue="management" className="w-full">
                <TabsList>
                    <TabsTrigger value="management">Gestión de Objetivos</TabsTrigger>
                    <TabsTrigger value="report">Reporte Trimestral</TabsTrigger>
                </TabsList>

                <TabsContent value="management" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredObjectives?.map((obj) => {
                            const progress = calculateProgress(obj.kpi_current, obj.kpi_target);
                            const isCompleted = progress >= 100;

                            return (
                                <Card key={obj.id} className="flex flex-col border-l-4 border-l-primary group relative">
                                    <div className="absolute top-2 right-2 z-10">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    setViewObjective(obj);
                                                    setIsViewOpen(true);
                                                }}>
                                                    <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEdit(obj)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => setDeleteId(obj.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start pr-8">
                                            <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {isCompleted ? "Completado" : "En Progreso"}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl pt-2 leading-tight">{obj.title}</CardTitle>
                                        <CardDescription className="line-clamp-2 min-h-[40px]">{obj.description}</CardDescription>
                                        {objectives?.filter(child => child.parent_id === obj.id).length > 0 && (
                                            <Badge variant="outline" className="mt-2 text-xs">
                                                {objectives.filter(child => child.parent_id === obj.id).length} Sub-objetivos
                                            </Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <div className="bg-muted/30 p-3 rounded-lg border border-muted">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{obj.kpi_metric}</span>
                                                <span className="text-lg font-bold text-primary">
                                                    {obj.kpi_current} <span className="text-sm font-normal text-muted-foreground">/ {obj.kpi_target} {obj.kpi_unit}</span>
                                                </span>
                                            </div>
                                            <Progress value={progress} className="h-2.5" indicatorClassName={isCompleted ? "bg-green-600" : ""} />
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>Vence: {format(new Date(obj.deadline), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-2 border-t bg-muted/5 flex justify-between">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-muted-foreground hover:text-primary px-2 -ml-2"
                                            onClick={() => {
                                                setViewObjective(obj);
                                                setIsViewOpen(true);
                                            }}
                                        >
                                            <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver Detalle
                                        </Button>
                                        <div className="flex items-center gap-1 text-xs font-medium">
                                            {isCompleted ? (
                                                <><CheckCircle2 className="h-3 w-3 text-green-600" /> Meta Alcanzada</>
                                            ) : (
                                                <><TrendingUp className="h-3 w-3 text-primary" /> {Math.round(progress)}% Logrado</>
                                            )}
                                        </div>
                                    </CardFooter>
                                </Card>
                            )
                        })}

                        {filteredObjectives?.length === 0 && (
                            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                                <Target className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                                <h3 className="text-lg font-medium">No hay objetivos definidos</h3>
                                <p className="text-gray-500 mb-4">
                                    {userProfile?.department
                                        ? `No hay objetivos para el departamento ${userProfile.department}.`
                                        : "Comienza creando el primer KPI estratégico para este año."}
                                </p>
                                <Button variant="outline" onClick={openCreate}>Crear Objetivo</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="report" className="space-y-6 mt-6">
                    {(() => {
                        const currentYear = new Date().getFullYear();

                        const quarterObjectives = (filteredObjectives || []).filter(obj => {
                            const d = new Date(obj.deadline);
                            return getYear(d) === currentYear && getQuarter(d) === selectedQuarter;
                        });

                        const totalObjs = quarterObjectives.length;
                        const completedObjs = quarterObjectives.filter(o => calculateProgress(o.kpi_current, o.kpi_target) >= 100).length;
                        const inProgressObjs = quarterObjectives.filter(o => {
                            const p = calculateProgress(o.kpi_current, o.kpi_target);
                            return p > 0 && p < 100;
                        }).length;
                        const notStartedObjs = quarterObjectives.filter(o => calculateProgress(o.kpi_current, o.kpi_target) === 0).length;
                        const avgProgress = totalObjs > 0
                            ? Math.round(quarterObjectives.reduce((acc, o) => acc + calculateProgress(o.kpi_current, o.kpi_target), 0) / totalObjs)
                            : 0;

                        const quarterNames: Record<number, string> = { 1: "T1 (Ene - Mar)", 2: "T2 (Abr - Jun)", 3: "T3 (Jul - Sep)", 4: "T4 (Oct - Dic)" };

                        return (
                            <>
                                {/* Quarter selector */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold">Reporte de Indicadores - {quarterNames[selectedQuarter]} {currentYear}</h2>
                                        <p className="text-muted-foreground text-sm">KPIs y estado de cumplimiento del trimestre</p>
                                    </div>
                                    <Select value={String(selectedQuarter)} onValueChange={(v) => setSelectedQuarter(Number(v) as 1|2|3|4)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">T1 (Ene - Mar)</SelectItem>
                                            <SelectItem value="2">T2 (Abr - Jun)</SelectItem>
                                            <SelectItem value="3">T3 (Jul - Sep)</SelectItem>
                                            <SelectItem value="4">T4 (Oct - Dic)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Summary cards */}
                                <div className="grid gap-4 md:grid-cols-5">
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-3xl font-bold text-primary">{totalObjs}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Total Objetivos</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-3xl font-bold text-green-500">{completedObjs}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Completados</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-3xl font-bold text-yellow-500">{inProgressObjs}</p>
                                            <p className="text-xs text-muted-foreground mt-1">En Progreso</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-3xl font-bold text-red-500">{notStartedObjs}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Sin Iniciar</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-3xl font-bold">{avgProgress}%</p>
                                            <p className="text-xs text-muted-foreground mt-1">Cumplimiento Prom.</p>
                                            <Progress value={avgProgress} className="h-2 mt-2" />
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                            Cumplimiento Anual por Trimestre
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={quarterlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis domain={[0, 100]} unit="%" />
                                                <Tooltip formatter={(value: number) => [`${value}%`, 'Cumplimiento']} />
                                                <Bar dataKey="cumplimiento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Detailed KPI table */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Target className="h-5 w-5 text-primary" />
                                            Detalle de KPIs - {quarterNames[selectedQuarter]}
                                        </CardTitle>
                                        <CardDescription>Indicadores individuales con progreso y estado</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {quarterObjectives.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <Target className="mb-4 h-12 w-12 text-muted-foreground/50" />
                                                <p className="font-medium">No hay objetivos para este trimestre</p>
                                                <p className="text-sm text-muted-foreground">Crea objetivos con fecha límite en {quarterNames[selectedQuarter]}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {quarterObjectives
                                                    .sort((a, b) => calculateProgress(a.kpi_current, a.kpi_target) - calculateProgress(b.kpi_current, b.kpi_target))
                                                    .map((obj) => {
                                                        const progress = calculateProgress(obj.kpi_current, obj.kpi_target);
                                                        const isCompleted = progress >= 100;
                                                        const deptName = departments?.find(d => d.id === obj.department_id)?.name;
                                                        const daysLeft = Math.ceil((new Date(obj.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                                        const isOverdue = daysLeft < 0 && !isCompleted;

                                                        return (
                                                            <div key={obj.id} className={`rounded-lg border p-4 space-y-3 ${isOverdue ? "border-red-300 bg-red-50/50" : isCompleted ? "border-green-300 bg-green-50/50" : ""}`}>
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <h4 className="font-semibold text-foreground">{obj.title}</h4>
                                                                            {deptName && <Badge variant="outline" className="text-xs">{deptName}</Badge>}
                                                                            {isOverdue && <Badge variant="destructive" className="text-xs">Vencido</Badge>}
                                                                            {isCompleted && <Badge className="bg-green-600 text-xs">Completado</Badge>}
                                                                        </div>
                                                                        {obj.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{obj.description}</p>}
                                                                    </div>
                                                                    <div className="text-right shrink-0">
                                                                        <p className={`text-2xl font-bold ${isCompleted ? "text-green-500" : progress > 0 ? "text-primary" : "text-red-500"}`}>
                                                                            {Math.round(progress)}%
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <Progress value={progress} className="h-2.5" />

                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                                    <div className="bg-muted/30 rounded-md p-2">
                                                                        <p className="text-xs text-muted-foreground">KPI</p>
                                                                        <p className="font-medium">{obj.kpi_metric}</p>
                                                                    </div>
                                                                    <div className="bg-muted/30 rounded-md p-2">
                                                                        <p className="text-xs text-muted-foreground">Actual / Meta</p>
                                                                        <p className="font-medium">{obj.kpi_current} / {obj.kpi_target} {obj.kpi_unit}</p>
                                                                    </div>
                                                                    <div className="bg-muted/30 rounded-md p-2">
                                                                        <p className="text-xs text-muted-foreground">Fecha Límite</p>
                                                                        <p className="font-medium">{format(new Date(obj.deadline), "dd MMM yyyy", { locale: es })}</p>
                                                                    </div>
                                                                    <div className="bg-muted/30 rounded-md p-2">
                                                                        <p className="text-xs text-muted-foreground">Días Restantes</p>
                                                                        <p className={`font-medium ${isOverdue ? "text-red-500" : daysLeft <= 15 ? "text-yellow-500" : ""}`}>
                                                                            {isCompleted ? "✓ Cumplido" : isOverdue ? `${Math.abs(daysLeft)} días vencido` : `${daysLeft} días`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        );
                    })()}
                </TabsContent>
            </Tabs>
        </div >
    );
};

export default Objectives;
