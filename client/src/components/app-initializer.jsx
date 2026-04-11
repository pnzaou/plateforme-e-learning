import { fetchMe } from "@/features/auth/auth.slice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GraduationCap } from "lucide-react";

function AppInitializer({ children }) {
  const status = useSelector((state) => state.auth.status);
  const dispatch = useDispatch();

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMe());
    }
  }, [status, dispatch]);

  if (status === "idle" || status === "pending") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background">
        <div className="relative flex items-center justify-center">
          {/* Cercle animé autour du logo */}
          <div className="absolute h-20 w-20 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          {/* Logo */}
          <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <span className="text-base font-semibold text-white animate-pulse">
          ISI Learn
        </span>
      </div>
    );
  }

  return <>{children}</>;
}

export default AppInitializer;
