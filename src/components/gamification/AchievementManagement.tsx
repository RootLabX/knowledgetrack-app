import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreateAchievementDialog } from "./CreateAchievementDialog";
import { RewardsManagement } from "./RewardsManagement";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,

} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trophy, Star, Zap, Target, Book, Award, Crown } from "lucide-react";
import { toast } from "sonner";

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    criteria_type: string;
    criteria_value: number;
}

interface AchievementManagementProps {
    onUpdate?: () => void;
}

export function AchievementManagement({ onUpdate }: AchievementManagementProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            // Use generic any to bypass strict table typing
            const { data, error } = await (supabase as any)
                .schema("mapper")
                .from("achievements")
                .select("*")
                .order("points", { ascending: true });
            if (error) throw error;
            setAchievements((data as Achievement[]) || []);
        } catch (error) {
            console.error("Error fetching achievements:", error);
            toast.error("Error al cargar logros");
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "star": return <Star className="h-4 w-4 text-yellow-500" />;
            case "target": return <Target className="h-4 w-4 text-red-500" />;
            case "zap": return <Zap className="h-4 w-4 text-blue-500" />;
            case "book": return <Book className="h-4 w-4 text-green-500" />;
            case "crown": return <Crown className="h-4 w-4 text-purple-500" />;
            default: return <Award className="h-4 w-4 text-orange-500" />;
        }
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            milestone: "Hito",
            course: "Curso",
            participation: "Participación",
            streak: "Racha"
        };
        return labels[category] || category;
    };
    const handleAchievementUpdate = () => {
        fetchAchievements();
        if (onUpdate) onUpdate();
    };
    useEffect(() => {
        fetchAchievements();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Administración</h2>
                <p className="text-sm text-muted-foreground">Gestiona los premios y logros del sistema.</p>
            </div>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="rewards">
                    <AccordionTrigger className="text-lg font-medium">Premios Trimestrales</AccordionTrigger>
                    <AccordionContent>
                        <div className="pt-4">
                            <RewardsManagement onUpdate={onUpdate} />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="achievements">
                    <AccordionTrigger className="text-lg font-medium">Gestión de Logros</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-4">
                            <div className="flex justify-end">
                                <CreateAchievementDialog onAchievementCreated={handleAchievementUpdate} />
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">Icono</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Puntos</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Criterio</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    Cargando...
                                                </TableCell>
                                            </TableRow>
                                        ) : achievements.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    No hay logros creados.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            achievements.map((achievement) => (
                                                <TableRow key={achievement.id}>
                                                    <TableCell>{getIcon(achievement.icon)}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{achievement.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{achievement.description}</div>
                                                    </TableCell>
                                                    <TableCell>{achievement.points}</TableCell>
                                                    <TableCell className="capitalize">{getCategoryLabel(achievement.category)}</TableCell>
                                                    <TableCell className="text-xs">
                                                        {achievement.criteria_type} ({achievement.criteria_value})
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <CreateAchievementDialog
                                                            onAchievementCreated={handleAchievementUpdate}
                                                            achievementToEdit={achievement}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
