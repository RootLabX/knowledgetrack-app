import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Star, Target, Zap, Award, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Achievement {
    id: string;
    name: string;
    points: number;
    category: string;
    icon: string;
}

interface AssignAchievementDialogProps {
    userId: string | null;
    userName: string | null;
    onClose: () => void;
}

export function AssignAchievementDialog({ userId, userName, onClose }: AssignAchievementDialogProps) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [selectedAchievement, setSelectedAchievement] = useState<string>("");
    const [assignmentNote, setAssignmentNote] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                // Fetch all achievements
                const { data: allAchievements, error: achievementsError } = await supabase
                    // @ts-ignore
                    .schema("mapper")
                    .from("achievements")
                    .select("id, name, points, category, icon");

                if (achievementsError) throw achievementsError;

                // Fetch already assigned achievements for this user
                const { data: userAchievements, error: userAchievementsError } = await supabase
                    // @ts-ignore
                    .schema("mapper")
                    .from("user_achievements")
                    .select("achievement_id")
                    .eq("user_id", userId);

                if (userAchievementsError) throw userAchievementsError;

                // Filter out assigned achievements
                const assignedIds = new Set((userAchievements || []).map((ua: any) => ua.achievement_id));
                const availableAchievements = (allAchievements || []).filter(a => !assignedIds.has(a.id));

                setAchievements(availableAchievements);
            } catch (error) {
                console.error("Error fetching achievements:", error);
            }
        };

        if (userId) {
            fetchAchievements();
        }
    }, [userId]);

    const handleAssign = async () => {
        if (!userId || !selectedAchievement) return;

        setLoading(true);
        try {
            const { error } = await supabase
                // @ts-ignore
                .schema("mapper")
                .from("user_achievements")
                .insert({
                    user_id: userId,
                    achievement_id: selectedAchievement,
                    assignment_note: assignmentNote
                });

            if (error) {
                if (error.code === "23505") {
                    toast.error("El usuario ya tiene este logro");
                } else {
                    throw error;
                }
                return;
            }

            toast.success(`Logro asignado a ${userName}`);
            onClose();
            setSelectedAchievement("");
            setAssignmentNote("");
        } catch (error) {
            console.error("Error assigning achievement:", error);
            toast.error("Error al asignar el logro");
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "star": return <Star className="h-5 w-5" />;
            case "target": return <Target className="h-5 w-5" />;
            case "zap": return <Zap className="h-5 w-5" />;
            case "award": return <Award className="h-5 w-5" />;
            case "crown": return <Crown className="h-5 w-5" />;
            default: return <Trophy className="h-5 w-5" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "milestone": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
            case "performance": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
            case "innovation": return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
            case "teamwork": return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
            default: return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
        }
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            milestone: "Hito",
            performance: "Desempeño",
            innovation: "Innovación",
            teamwork: "Trabajo en Equipo"
        };
        return labels[category] || category;
    };

    return (
        <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Asignar Logro</DialogTitle>
                    <DialogDescription>
                        Selecciona un logro para asignar a <span className="font-semibold text-foreground">{userName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {achievements.map((achievement) => (
                        <div
                            key={achievement.id}
                            onClick={() => setSelectedAchievement(achievement.id)}
                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${selectedAchievement === achievement.id
                                ? "border-primary bg-primary/10 ring-1 ring-primary"
                                : "hover:bg-muted"
                                }`}
                        >
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${selectedAchievement === achievement.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                }`}>
                                {getIcon(achievement.icon)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium leading-none">{achievement.name}</p>
                                    <Badge variant="secondary" className={`text-[10px] px-1 py-0 ${getCategoryColor(achievement.category)}`}>
                                        {getCategoryLabel(achievement.category)}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{achievement.points} pts</p>
                            </div>
                        </div>
                    ))}
                    {achievements.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">No hay logros disponibles</div>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="note">Nota / Descripción (Opcional)</Label>
                    <Textarea
                        id="note"
                        placeholder="Agrega un motivo o felicitación..."
                        value={assignmentNote}
                        onChange={(e) => setAssignmentNote(e.target.value)}
                        className="resize-none"
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleAssign} disabled={loading || !selectedAchievement}>
                        {loading ? "Asignando..." : "Asignar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
