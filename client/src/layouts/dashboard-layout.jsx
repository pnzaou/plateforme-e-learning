import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router"
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSelector } from "react-redux";
import ChangeDefaultPasswordDialog from "@/components/auth/change-default-password";

function DashboardLayout() {
  const authUser = useSelector((state) => state.auth.userData);
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 gap-4 glass">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-9 w-64 bg-muted/50 border-border/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              </button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {authUser?.prenom[0]+authUser?.nom[0]}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{authUser?.prenom + " " + authUser?.nom[0]}.</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6"><Outlet/></main>
          <ChangeDefaultPasswordDialog />
        </div>
      </div>
    </SidebarProvider>
  )
}

export default DashboardLayout