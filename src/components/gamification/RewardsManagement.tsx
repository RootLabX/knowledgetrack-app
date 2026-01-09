import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Medal, Save, Plus, Trash2 } from "lucide-react";

interface Reward {
    id?: string;
    rank: number;
    reward: string;
}

interface RewardsManagementProps {
    onUpdate?: () => void;
}

export const RewardsManagement = ({ onUpdate }: RewardsManagementProps) => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            const { data, error } = await supabase
                // @ts-ignore
                .schema("mapper")
                .from("quarterly_rewards")
                .select("*")
                .order("rank");

            if (error) throw error;
            setRewards(data || []);
            setDeletedIds([]);
        } catch (error) {
            console.error("Error fetching rewards:", error);
            toast.error("Error al cargar los premios");
        } finally {
            setLoading(false);
        }
    };

    const handleRewardChange = (index: number, field: keyof Reward, value: string | number) => {
        const newRewards = [...rewards];
        newRewards[index] = { ...newRewards[index], [field]: value };
        setRewards(newRewards);
    };

    const handleAddReward = () => {
        const nextRank = rewards.length > 0 ? Math.max(...rewards.map(r => r.rank)) + 1 : 1;
        setRewards([...rewards, { rank: nextRank, reward: "" }]);
    };

    const handleDeleteReward = (index: number) => {
        const rewardToDelete = rewards[index];
        if (rewardToDelete.id) {
            setDeletedIds([...deletedIds, rewardToDelete.id]);
        }
        const newRewards = rewards.filter((_, i) => i !== index);
        setRewards(newRewards);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Delete removed rewards
            if (deletedIds.length > 0) {
                const { error: deleteError } = await supabase
                    // @ts-ignore
                    .schema("mapper")
                    .from("quarterly_rewards")
                    .delete()
                    .in("id", deletedIds);

                if (deleteError) throw deleteError;
            }

            // Upsert current rewards
            for (const reward of rewards) {
                const { error } = await supabase
                    // @ts-ignore
                    .schema("mapper")
                    .from("quarterly_rewards")
                    .upsert({
                        ...(reward.id ? { id: reward.id } : {}),
                        rank: Number(reward.rank),
                        reward: reward.reward,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
            }

            toast.success("Premios actualizados exitosamente");
            await fetchRewards(); // Refresh to get IDs for new items
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error updating rewards:", error);
            toast.error("Error al guardar los premios");
        } finally {
            setSaving(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
            case 2: return <Medal className="h-5 w-5 text-gray-400" />;
            case 3: return <Medal className="h-5 w-5 text-amber-600" />;
            default: return <span className="h-5 w-5 flex items-center justify-center font-bold text-muted-foreground">#{rank}</span>;
        }
    };

    const getRankTitle = (rank: number) => {
        switch (rank) {
            case 1: return "Top 1 (Oro)";
            case 2: return "Top 2 (Plata)";
            case 3: return "Top 3 (Bronce)";
            default: return `Top ${rank}`;
        }
    };

    if (loading) return <div>Cargando premios...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Premios Trimestrales
                </CardTitle>
                <CardDescription>
                    Administra los premios para los empleados destacados.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {rewards.map((reward, index) => (
                    <div key={index} className="grid sm:grid-cols-[100px_1fr_auto] gap-2 items-end">
                        <div className="grid gap-2">
                            <Label>Posición</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={reward.rank}
                                    onChange={(e) => handleRewardChange(index, "rank", Number(e.target.value))}
                                    className="pl-8"
                                />
                                <div className="absolute left-2.5 top-2.5">
                                    {getRankIcon(reward.rank)}
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Premio</Label>
                            <Input
                                value={reward.reward}
                                onChange={(e) => handleRewardChange(index, "reward", e.target.value)}
                                placeholder="Descripción del premio"
                            />
                        </div>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteReward(index)}
                            title="Eliminar premio"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-2 pt-4 justify-between">
                    <Button variant="outline" onClick={handleAddReward} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Premio
                    </Button>

                    <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                        {saving ? (
                            <>Guardando...</>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
