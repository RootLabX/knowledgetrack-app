import {
  Award,
  BarChart3,
  ChartBar,
  BookOpen,
  Brain,
  GraduationCap,
  Home,
  LayoutDashboard,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";


const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Evaluaciones", url: "/assessment", icon: Brain },
  { title: "Objetivos", url: "/objectives", icon: Target },
  { title: "Cursos", url: "/courses", icon: BookOpen },
  { title: "Planificación", url: "/planning", icon: Target },
  { title: "Ruta de Aprendizaje", url: "/learning-path", icon: GraduationCap },
  { title: "Logros", url: "/achievements", icon: Award },
];

const managementItems = [
  { title: "Equipo", url: "/team", icon: Users },
  { title: "Reportes", url: "/reports", icon: BarChart3 },
  { title: "Analítica Avanzada", url: "/analytics", icon: ChartBar },
  { title: "Admin Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Configuración", url: "/settings", icon: Settings },
];

export function AppSidebar() {

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">TechSkills</span>
            <span className="text-xs text-muted-foreground">Plataforma de Capacitación Pandatech</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>


    </Sidebar>
  );
}
