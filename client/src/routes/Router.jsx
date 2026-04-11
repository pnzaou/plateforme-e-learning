import { Route, BrowserRouter as Router, Routes } from "react-router"
import PublicRoute from "@/components/auth/public-route"
import LoginPage from "@/pages/auth/LoginPage"
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/layouts/dashboard-layout"
import DashboardHomePage from "@/pages/dashboard/DashboardHomePage"
import GestionTeachersPage from "@/pages/dashboard/admin/GestionTeachersPage"
import GestionDepartementPage from "@/pages/dashboard/admin/GestionDepartementPage"
import GestionFilieresPage from "@/pages/dashboard/admin/GestionFilieresPage"
import GestionNiveauxPage from "@/pages/dashboard/admin/GestionNiveauxPage"
import GestionClassesPage from "@/pages/dashboard/admin/GestionClassesPage"
import GestionStudentsPageAdmin from "@/pages/dashboard/admin/GestionStudentsPage"
import StudentDetail from "@/components/dashboard/shared/student-detail"
import GestionStudentsPageTeacher from "@/pages/dashboard/teacher/GestionStudentsPage"
import GestionCoursesPageAdmin from "@/pages/dashboard/admin/GestionCoursesPage"
import GestionCoursesPageTeacher from "@/pages/dashboard/teacher/GestionCoursesPage"
import CourseDetail from "@/pages/dashboard/shared/CourseDetail"
import ChapitreContents from "@/pages/dashboard/shared/ChapitreContents"
import NotFound from "@/pages/NotFound"

const AppRouter = () => {
  return (
    <Router>
        <Routes>
            {/* ROUTES AUTH */}
            <Route path="/login" element={<PublicRoute><LoginPage/></PublicRoute>}/>
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage/></PublicRoute>}/>
            <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage/></PublicRoute>}/>

            {/* ROUTES DASHBAORD */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout/></ProtectedRoute>}>
              <Route index element={<DashboardHomePage/>}/>
              <Route
                path="/dashboard/chapitres/:chapitreId/contenus"
                element={<ChapitreContents />}
              />


              {/* DASHBOARD ADMIN */}
              <Route path="admin/teachers" element={<GestionTeachersPage/>}/>
              <Route path="admin/departments" element={<GestionDepartementPage/>}/>
              <Route path="admin/filieres" element={<GestionFilieresPage/>}/>
              <Route path="admin/niveaux" element={<GestionNiveauxPage/>}/>
              <Route path="admin/classes" element={<GestionClassesPage/>}/>
              <Route path="admin/students" element={<GestionStudentsPageAdmin />} />
              <Route path="admin/students/:id" element={<StudentDetail />} />
              <Route path="admin/courses" element={<GestionCoursesPageAdmin />} />
              <Route path="admin/courses/:id" element={<CourseDetail />} />


              {/* DASHBAORD TEACHER */}
              <Route path="teacher/students" element={<GestionStudentsPageTeacher />} />
              <Route path="teacher/students/:id" element={<StudentDetail />} />
              <Route path="teacher/courses" element={<GestionCoursesPageTeacher />} />
              <Route path="teacher/courses/:id" element={<CourseDetail />} />
            </Route>


            <Route path="*" element={<NotFound/>}/>
        </Routes>
    </Router>
  )
}

export default AppRouter
