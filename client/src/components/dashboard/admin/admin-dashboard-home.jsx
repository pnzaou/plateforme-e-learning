import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import StatCard from "@/components/dashboard/stat-card";
import {
  Users, BookOpen, GraduationCap, TrendingUp, UserCheck, UserX,
  BarChart3, AlertTriangle, CheckCircle, Clock,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAdminDashboard } from "@/features/dashboard/dashboard.slice";
import AdminDashboardSkeleton from "@/components/skeletons/admin-dashboard-skeleton";
import ErrorState from "@/components/dashboard/shared/error-state";

const iconMap = {
  Users, BookOpen, GraduationCap, TrendingUp,
  UserCheck, UserX, AlertTriangle, CheckCircle,
};

function AdminDashboardHome() {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.dashboard.admin.data);
  const status = useSelector((state) => state.dashboard.admin.status);
  const error = useSelector((state) => state.dashboard.admin.error);

  useEffect(() => {
  if (status === "idle") {
    dispatch(fetchAdminDashboard());
  }
}, [dispatch, status]);

  const handleRetry = () => {
    dispatch(fetchAdminDashboard());
  };

  // Loading
  if (status === "pending" && !data.stats.length) {
    return <AdminDashboardSkeleton />;
  }

  // Error
  if (status === "failed") {
    return (
      <ErrorState
        title="Impossible de charger le tableau de bord"
        message={error || "Une erreur est survenue lors du chargement des données."}
        onRetry={handleRetry}
      />
    );
  }

  const stats = data.stats.map((s) => ({
    ...s,
    icon: iconMap[s.icon] || Users,
  }));

  const recentActivity = data.recentActivity.map((a) => ({
    ...a,
    icon: iconMap[a.icon] || BookOpen,
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">
          Administration
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de la plateforme ISI Learn.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Departments */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Départements
          </h2>
          <div className="space-y-3">
            {data.departmentStats.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun département enregistré.
              </p>
            )}
            {data.departmentStats.map((dept) => (
              <div
                key={dept.name}
                className="glass rounded-lg p-4 animate-fade-in"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{dept.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {dept.students} étudiants • {dept.courses} cours • Moy.{" "}
                      {dept.avgGrade}/20
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`border-0 ${
                      dept.successRate >= 80
                        ? "bg-success/10 text-success"
                        : dept.successRate >= 70
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {dept.successRate}% réussite
                  </Badge>
                </div>
                <Progress value={dept.successRate} className="h-1.5" />
              </div>
            ))}
          </div>

          {/* Pending approvals */}
          <h2 className="font-heading font-bold text-lg pt-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Approbations en attente
          </h2>
          <div className="space-y-2">
            {data.pendingApprovals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucune approbation en attente.
              </p>
            )}
            {data.pendingApprovals.map((item, i) => (
              <div
                key={i}
                className="glass rounded-lg p-3 flex items-center justify-between animate-fade-in"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {item.type}
                    </Badge>
                    <p className="text-sm font-medium truncate">{item.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Par {item.by} • {item.date}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 text-destructive hover:text-destructive"
                  >
                    Refuser
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs h-7 gradient-primary text-primary-foreground"
                  >
                    Approuver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass rounded-lg p-5 space-y-4 animate-fade-in">
            <h3 className="font-heading font-bold">Activité récente</h3>
            <div className="space-y-3">
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucune activité récente.
                </p>
              )}
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5 p-1.5 rounded bg-muted/50 shrink-0">
                    <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{item.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-lg p-5 space-y-4 animate-fade-in">
            <h3 className="font-heading font-bold">Résumé plateforme</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold text-primary">
                  {data.resume.moyenneGlobale}
                </p>
                <p className="text-xs text-muted-foreground">Moy. globale</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold text-success">
                  {data.resume.tauxReussite}
                </p>
                <p className="text-xs text-muted-foreground">Taux réussite</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">{data.resume.quizActifs}</p>
                <p className="text-xs text-muted-foreground">Quiz actifs</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">{data.resume.tauxPresence}</p>
                <p className="text-xs text-muted-foreground">Taux présence</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardHome;
