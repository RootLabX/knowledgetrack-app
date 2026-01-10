import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { AssignAchievementDialog } from "./AssignAchievementDialog";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
    id: string;
    full_name: string | null;
    department: string | null;
    position: string | null;
    total_points?: number;
}

export function EmployeeList() {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "points">("points");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

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

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy, sortOrder]);

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const filteredProfiles = profiles
        .filter(profile =>
            (profile.full_name || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "name") {
                const nameA = a.full_name || "";
                const nameB = b.full_name || "";
                return sortOrder === "asc"
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            } else {
                const pointsA = a.total_points || 0;
                const pointsB = b.total_points || 0;
                return sortOrder === "asc"
                    ? pointsA - pointsB
                    : pointsB - pointsA;
            }
        });

    const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
    const paginatedProfiles = filteredProfiles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar colaborador..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={sortBy}
                            onValueChange={(value: "name" | "points") => setSortBy(value)}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="points">Puntos</SelectItem>
                                <SelectItem value="name">Nombre</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                            title={sortOrder === "asc" ? "Ascendente" : "Descendente"}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedProfiles.map((profile) => (
                        <div
                            key={profile.id}
                            onClick={() => isAdmin && setSelectedUser({ id: profile.id, name: profile.full_name || "Usuario" })}
                            className={`flex items-center gap-4 rounded-lg border p-4 transition-colors relative group ${isAdmin ? "hover:bg-muted/50 cursor-pointer" : "opacity-100"
                                }`}
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
                    {filteredProfiles.length === 0 && (
                        <div className="col-span-full text-center text-muted-foreground py-8">
                            No se encontraron colaboradores.
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 mt-6">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <AssignAchievementDialog
                    userId={selectedUser?.id || null}
                    userName={selectedUser?.name || null}
                    onClose={() => setSelectedUser(null)}
                />
            </CardContent>
        </Card >
    );
}
