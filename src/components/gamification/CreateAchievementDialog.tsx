import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trophy, Star, Zap, Target, Book, Award, Crown, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface CreateAchievementDialogProps {
    onAchievementCreated: () => void;
    achievementToEdit?: any;
}

export function CreateAchievementDialog({ onAchievementCreated, achievementToEdit }: CreateAchievementDialogProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) return;
            const { data } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", user.id)
                .eq("role", "admin")
                .maybeSingle();

            setIsAdmin(!!data);
        };
        checkAdmin();
    }, [user]);


    const [formData, setFormData] = useState({
        name: achievementToEdit?.name || "",
        description: achievementToEdit?.description || "",
        points: achievementToEdit?.points || 10,
        category: achievementToEdit?.category || "milestone",
        icon: achievementToEdit?.icon || "award",
        criteria_type: achievementToEdit?.criteria_type || "manual",
        criteria_value: achievementToEdit?.criteria_value || 1
    });

    useEffect(() => {
        if (open && achievementToEdit) {
            setFormData({
                name: achievementToEdit.name,
                description: achievementToEdit.description,
                points: achievementToEdit.points,
                category: achievementToEdit.category,
                icon: achievementToEdit.icon,
                criteria_type: achievementToEdit.criteria_type,
                criteria_value: achievementToEdit.criteria_value
            });
        }
    }, [achievementToEdit, open]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.description) {
            toast.error("Por favor completa los campos requeridos");
            return;
        }

        setLoading(true);
        try {
            console.log("Submitting form data:", formData);
            let error;
            if (achievementToEdit) {
                console.log("Updating achievement:", achievementToEdit.id);
                const { data, error: updateError } = await supabase
                    // @ts-ignore
                    .schema("mapper")
                    .from("achievements")
                    .update({
                        ...formData,
                        points: Number(formData.points),
                        criteria_value: Number(formData.criteria_value)
                    })
                    .eq("id", achievementToEdit.id)
                    .select();

                console.log("Update result:", { data, updateError });
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    // @ts-ignore
                    .schema("mapper")
                    .from("achievements")
                    .insert({
                        ...formData,
                        points: Number(formData.points),
                        criteria_value: Number(formData.criteria_value)
                    });
                error = insertError;
            }


            if (error) throw error;

            toast.success(achievementToEdit ? "Logro actualizado exitosamente" : "Logro creado exitosamente");
            setOpen(false);
            onAchievementCreated();
            if (!achievementToEdit) {
                setFormData({
                    name: "",
                    description: "",
                    points: 10,
                    category: "milestone",
                    icon: "award",
                    criteria_type: "manual",
                    criteria_value: 1
                });
            }
        } catch (error) {
            console.error("Error creating achievement:", error);
            toast.error("Error al crear el logro");
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "star": return <Star className="h-4 w-4" />;
            case "target": return <Target className="h-4 w-4" />;
            case "zap": return <Zap className="h-4 w-4" />;
            case "book": return <Book className="h-4 w-4" />;
            case "crown": return <Crown className="h-4 w-4" />;
            default: return <Award className="h-4 w-4" />;
        }
    };

    if (!isAdmin) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2" variant={achievementToEdit ? "outline" : "default"} size={achievementToEdit ? "icon" : "default"}>
                    {achievementToEdit ? <Pencil className="h-4 w-4" /> : <><Plus className="h-4 w-4" /> Nuevo Logro</>}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{achievementToEdit ? "Editar Logro" : "Crear Nuevo Logro"}</DialogTitle>
                    <DialogDescription>
                        {achievementToEdit ? "Modifica los detalles del logro existente." : "Define los detalles del nuevo logro para el sistema de gamificación."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Primeros Pasos"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe qué debe hacer el usuario..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="points">Puntos</Label>
                            <Input
                                id="points"
                                type="number"
                                min="0" // Prevent negative input in UI
                                value={formData.points}
                                onChange={(e) => setFormData({ ...formData, points: Math.max(0, Number(e.target.value)) })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="milestone">Hito</SelectItem>
                                    <SelectItem value="course">Curso</SelectItem>
                                    <SelectItem value="participation">Participación</SelectItem>
                                    <SelectItem value="streak">Racha</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="criteria_type">Tipo de Criterio</Label>
                            <Select
                                value={formData.criteria_type}
                                onValueChange={(value) => setFormData({ ...formData, criteria_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="courses_completed">Cursos Completados</SelectItem>
                                    <SelectItem value="score_achieved">Puntaje Alcanzado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="criteria_value">Valor Meta</Label>
                            <Input
                                id="criteria_value"
                                type="number"
                                min="0" // Prevent negative input in UI
                                value={formData.criteria_value}
                                onChange={(e) => setFormData({ ...formData, criteria_value: Math.max(0, Number(e.target.value)) })}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="icon">Icono</Label>
                        <Select
                            value={formData.icon}
                            onValueChange={(value) => setFormData({ ...formData, icon: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="award">
                                    <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4" />
                                        <span>Trofeo</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="star">
                                    <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4" />
                                        <span>Estrella</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="zap">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4" />
                                        <span>Rayo</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="target">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        <span>Objetivo</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="book">
                                    <div className="flex items-center gap-2">
                                        <Book className="h-4 w-4" />
                                        <span>Libro</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="crown">
                                    <div className="flex items-center gap-2">
                                        <Crown className="h-4 w-4" />
                                        <span>Corona</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? (achievementToEdit ? "Actualizando..." : "Creando...") : (achievementToEdit ? "Actualizar Logro" : "Crear Logro")}
                </Button>
            </DialogContent>
        </Dialog>
    );

}
