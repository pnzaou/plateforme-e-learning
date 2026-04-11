import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/auth.slice";
import dashboardReducer from "@/features/dashboard/dashboard.slice";
import userReducer from "@/features/user/users.slice";
import departementsReducer from "@/features/academique/departements.slice";
import filieresReducer from "@/features/academique/filieres.slice";
import niveauxReducer from "@/features/academique/niveaux.slice";
import classesReducer from "@/features/academique/classes.slice";
import modulesReducer from "@/features/modules/modules.slice";
import chapitresReducer from "@/features/chapitres/chapitres.slice";
import contenusReducer from "@/features/contenus/contenus.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    users: userReducer,
    departements: departementsReducer,
    filieres: filieresReducer,
    niveaux: niveauxReducer,
    classes: classesReducer,
    modules: modulesReducer,
    chapitres: chapitresReducer,
    contenus: contenusReducer,
  },
});
