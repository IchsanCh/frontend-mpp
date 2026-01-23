import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import HomeLayout from "./layouts/HomeLayout";
import Home from "./pages/Home";
import AdminLayout from "./layouts/AdminLayout";
import UnitManagement from "./pages/Unit";
import ConfigManagement from "./pages/Config";
import UserManagement from "./pages/Users";

export default function App() {
  return (
    <Routes>
      <Route
        path="/san/login"
        element={
          <PublicRoute>
            <MainLayout title="Login">
              <Login />
            </MainLayout>
          </PublicRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout title="Dashboard">
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/units"
        element={
          <ProtectedRoute>
            <AdminLayout title="Unit Management">
              <UnitManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/config"
        element={
          <ProtectedRoute>
            <AdminLayout title="Configuration">
              <ConfigManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminLayout title="User Management">
              <UserManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <HomeLayout title="SANDIGI - Sistem Antrian Digital">
            <Home />
          </HomeLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
