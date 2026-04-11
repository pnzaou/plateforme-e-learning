import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import StatCard from "@/components/dashboard/stat-card";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchTeacherDashboard } from "@/features/dashboard/dashboard.slice";
import TeacherDashboardSkeleton from "@/components/skeletons/teacher-dashboard-skeleton";
import ErrorState from "@/components/dashboard/shared/error-state";

const iconMap = {
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
};

function TeacherDashboardHome() {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.dashboard.teacher.data);
  const status = useSelector((state) => state.dashboard.teacher.status);
  const error = useSelector((state) => state.dashboard.teacher.error);
  const authUser = useSelector((state) => state.auth.userData);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchTeacherDashboard());
    }
  }, [dispatch, status]);

  if (status === "pending" && !data.stats.length) {
    return <TeacherDashboardSkeleton />;
  }

  const handleRetry = () => {
    dispatch(fetchTeacherDashboard());
  }

  if (status === "failed") {
    return (
      <ErrorState
        title="Impossible de charger votre tableau de bord"
        message={error || "Une erreur est survenue."}
        onRetry={handleRetry}
      />
    );
  }

  const stats = data.stats.map((s) => ({
    ...s,
    icon: iconMap[s.icon] || BookOpen,
  }));

  const nom = authUser?.nom || "";

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">
          Bonjour, Prof. {nom} 👨‍🏫
        </h1>
        <p className="text-muted-foreground mt-1">
          Voici un aperçu de vos cours et activités.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-heading font-bold text-lg">Mes cours</h2>
          <div className="space-y-3">
            {data.myCourses.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun cours pour le moment.
              </p>
            )}
            {data.myCourses.map((course) => (
              <div
                key={course.id}
                className="glass rounded-lg p-4 space-y-3 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{course.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {course.students} étudiants • Moy. {course.avgGrade}/20
                    </p>
                  </div>
                  {course.pendingAssignments > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-warning/10 text-warning border-0"
                    >
                      {course.pendingAssignments} à corriger
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={course.progress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {course.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent submissions */}
          <h2 className="font-heading font-bold text-lg pt-2">
            Soumissions récentes
          </h2>
          <div className="space-y-2">
            {data.recentSubmissions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucune soumission récente.
              </p>
            )}
            {data.recentSubmissions.map((sub, i) => (
              <div
                key={i}
                className="glass rounded-lg p-3 flex items-center justify-between animate-fade-in"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {sub.student
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {sub.student}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {sub.assignment} • {sub.course}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {sub.date}
                  </span>
                  {sub.status === "pending" ? (
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      Corriger
                    </Button>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-success/10 text-success border-0 text-xs"
                    >
                      Corrigé
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass rounded-lg p-5 space-y-4 animate-fade-in">
            <h3 className="font-heading font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Emploi du temps
            </h3>
            <div className="space-y-3">
              {data.upcomingClasses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun cours prévu.
                </p>
              )}
              {data.upcomingClasses.map((cls, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {cls.day}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{cls.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {cls.time}
                    </p>
                    <p className="text-xs text-muted-foreground">{cls.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-lg p-5 space-y-4 animate-fade-in">
            <h3 className="font-heading font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Statistiques rapides
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold text-primary">
                  {data.resume.moyenneGenerale}
                </p>
                <p className="text-xs text-muted-foreground">Moy. générale</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold text-success">
                  {data.resume.tauxPresence}
                </p>
                <p className="text-xs text-muted-foreground">Taux présence</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">
                  {data.resume.leconsPubliees}
                </p>
                <p className="text-xs text-muted-foreground">Leçons publiées</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-lg font-bold">{data.resume.tauxReussite}</p>
                <p className="text-xs text-muted-foreground">Taux réussite</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboardHome;
