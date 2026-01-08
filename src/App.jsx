import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

export default function App() {
  return (
    <Routes>
      {/* Login (public tapi dicegat kalau sudah auth) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <MainLayout title="Login">
              <Login />
            </MainLayout>
          </PublicRoute>
        }
      />

      {/* Dashboard (protected) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout title="Dashboard">
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Root */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
