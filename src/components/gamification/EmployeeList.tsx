import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Users, Hand } from "lucide-react";
import { AssignAchievementDialog } from "./AssignAchievementDialog";

interface Profile {
    id: string;
    full_name: string | null;
    department: string | null;
    position: string | null;
    total_points?: number;
}

export function EmployeeList() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const { data, error } = await supabase
                    .schema("public")
                    .from("profiles")
                    .select("id, full_name, department, position");

                if (error) throw error;
                if (error) throw error;

                // Fetch user achievements with points
                const { data: userAchievements, error: achievementsError } = await supabase
                    // @ts-ignore
                    .schema("mapper")
                    .from("user_achievements")
                    .select("user_id, achievement:achievements(points)");

                if (achievementsError) throw achievementsError;

                // Calculate points per user
                const pointsMap = new Map<string, number>();
                (userAchievements || []).forEach((ua: any) => {
                    const points = ua.achievement?.points || 0;
                    pointsMap.set(ua.user_id, (pointsMap.get(ua.user_id) || 0) + points);
                });

                // Merge points with profiles
                const profilesWithPoints = (data || []).map(profile => ({
                    ...profile,
                    total_points: pointsMap.get(profile.id) || 0
                }));

                setProfiles(profilesWithPoints);
            } catch (error) {
                console.error("Error fetching profiles:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, []);

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
            <Card>
                <CardContent className="py-8 text-center">
                    Cargando colaboradores...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Colaboradores
                </CardTitle>
                <CardDescription>
                    Lista de todos los miembros del equipo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {profiles.map((profile) => (
                        <div
                            key={profile.id}
                            onClick={() => setSelectedUser({ id: profile.id, name: profile.full_name || "Usuario" })}
                            className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group"
                        >
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {getInitials(profile.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium leading-none">
                                    {profile.full_name || "Usuario"}
                                </p>
                                {(profile.department || profile.position) && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {profile.position}
                                        {profile.position && profile.department && " • "}
                                        {profile.department}
                                    </p>
                                )}
                            </div>
                            <div className="ml-auto text-right">
                                <span className="text-sm font-bold text-primary">
                                    {profile.total_points || 0} pts
                                </span>
                            </div>
                        </div>
                    ))}
                    {profiles.length === 0 && (
                        <div className="col-span-full text-center text-muted-foreground py-8">
                            No se encontraron colaboradores.
                        </div>
                    )}
                </div>

                <AssignAchievementDialog
                    userId={selectedUser?.id || null}
                    userName={selectedUser?.name || null}
                    onClose={() => setSelectedUser(null)}
                />
            </CardContent>
        </Card >
    );
}
