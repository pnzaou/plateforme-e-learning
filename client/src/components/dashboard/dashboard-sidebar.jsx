import {
  LogOut,
  GraduationCap,
} from "lucide-react";
import { useLocation } from "react-router";
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import SidebarItems from "./sidebar-items";
import { useSelector } from "react-redux";

const roleMap = {
  admin: "Admin",
  chef_departement: "Chef de département",
  enseignant: "Enseignant",
  etudiant: "Étudiant",
};

const DashboardSidebar = () => {
  const authUser = useSelector((state) => state.auth.userData);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-heading font-bold text-sidebar-accent-foreground">
                ISI Learn
              </h2>
              <p className="text-xs text-sidebar-foreground">
                {roleMap[authUser?.role]}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarItems userRole={authUser?.role} isActive={isActive} collapsed={collapsed} />

      <SidebarFooter className="p-3">
        <SidebarMenu>
          {!collapsed && (
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {authUser?.prenom[0].toUpperCase() +
                    authUser?.nom[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {authUser?.prenom + " " + authUser?.nom[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {roleMap[authUser?.role]}
                  </p>
                </div>
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-muted-foreground hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Déconnexion</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
