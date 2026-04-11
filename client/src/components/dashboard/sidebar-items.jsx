import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  UserCog,
  Building,
  ClipboardCheck,
  FileText,
  CalendarDays,
  MessageSquare,
  GraduationCap,
  Layers,
  Users2,
} from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/dashboard/nav-link";

const navByRole = {
  etudiant: [
    {
      label: "Menu principal",
      items: [
        { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
        { title: "Mes cours", url: "/courses", icon: BookOpen },
        { title: "Quiz & Évaluations", url: "/quizzes", icon: ClipboardCheck },
        { title: "Devoirs", url: "/assignments", icon: FileText },
        { title: "Progression", url: "/progress", icon: BarChart3 },
      ],
    },
  ],
  enseignant: [
    {
      label: "Enseignement",
      items: [
        {
          title: "Tableau de bord",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Mes cours",
          url: "/dashboard/teacher/courses",
          icon: BookOpen,
        },
        {
          title: "Quiz & Évaluations",
          url: "/dashboard/teacher/quizzes",
          icon: ClipboardCheck,
        },
        {
          title: "Devoirs & Corrections",
          url: "/dashboard/teacher/assignments",
          icon: FileText,
        },
        {
          title: "Mes étudiants",
          url: "/dashboard/teacher/students",
          icon: Users,
        },
      ],
    },
    {
      label: "Outils",
      items: [
        {
          title: "Emploi du temps",
          url: "/dashboard/teacher/schedule",
          icon: CalendarDays,
        },
        {
          title: "Messages",
          url: "/dashboard/teacher/messages",
          icon: MessageSquare,
        },
      ],
    },
  ],
  admin: [
    {
      label: "Tableau de bord",
      items: [
        { title: "Vue d'ensemble", url: "/dashboard", icon: LayoutDashboard },
        // {
        //   title: "Statistiques",
        //   url: "/dashboard/admin/stats",
        //   icon: BarChart3,
        // },
      ],
    },
    {
      label: "Utilisateurs",
      items: [
        { title: "Étudiants", url: "/dashboard/admin/students", icon: Users },
        {
          title: "Enseignants",
          url: "/dashboard/admin/teachers",
          icon: UserCog,
        },
      ],
    },
    {
      label: "Structure académique",
      items: [
        {
          title: "Départements",
          url: "/dashboard/admin/departments",
          icon: Building,
        },
        {
          title: "Filières",
          url: "/dashboard/admin/filieres",
          icon: GraduationCap,
        },
        { title: "Niveaux", url: "/dashboard/admin/niveaux", icon: Layers },
        { title: "Classes", url: "/dashboard/admin/classes", icon: Users2 },
      ],
    },
    {
      label: "Pédagogie",
      items: [
        { title: "Cours", url: "/dashboard/admin/courses", icon: BookOpen },
      ],
    },
    {
      label: "Administration",
      items: [
        {
          title: "Paramètres",
          url: "/dashboard/admin/settings",
          icon: Settings,
        },
      ],
    },
  ],
};

function SidebarItems({ userRole, isActive, collapsed }) {
  const groups = navByRole[userRole] ?? [];
  return (
    <SidebarContent>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}

export default SidebarItems;
