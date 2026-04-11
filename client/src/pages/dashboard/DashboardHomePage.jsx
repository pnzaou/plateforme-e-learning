import React from "react";
import AdminDashboardHome from "@/components/dashboard/admin/admin-dashboard-home";
import TeacherDashboardHome from "@/components/dashboard/teacher/teacher-dashboard-home";
import { useSelector } from "react-redux";

const DashboardMap = {
  admin: AdminDashboardHome,
  enseignant: TeacherDashboardHome,
};

function DashboardHomePage() {
  const authUser = useSelector((state) => state.auth.userData);
  const Dashboard = DashboardMap[authUser.role];
  
  return (
    <>
      <Dashboard />
    </>
  );
}

export default DashboardHomePage;
