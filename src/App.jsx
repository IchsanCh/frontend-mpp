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
import ServiceManagement from "./pages/Service";
import UnitPage from "./pages/AmbilAntrian";
import DisplayAntrian from "./pages/Antrian";
import AntrianLayout from "./layouts/AntrianLayout";
import AudioManagement from "./pages/Audio";
import CallerMenu from "./pages/CallerMenu";
import CallerService from "./pages/CallerServices";
import ReportManagement from "./pages/Report";
import UnitDashboard from "./pages/UnitDashboard";
import { authService } from "./services/api";
import NotFound from "./pages/NotFound";
import UnitReportManagement from "./pages/UnitReports";
import FAQManagement from "./pages/FAQ";

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
              {authService.getUser()?.role === "super_user" ? (
                <Dashboard />
              ) : (
                <UnitDashboard />
              )}
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
        path="/admin/services"
        element={
          <ProtectedRoute>
            <AdminLayout title="Service Management">
              <ServiceManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/antrian"
        element={
          <ProtectedRoute>
            <AntrianLayout title="Ambil Antrian">
              <UnitPage />
            </AntrianLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audio"
        element={
          <ProtectedRoute>
            <AdminLayout title="Management Audio">
              <AudioManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute>
            <AdminLayout title="Laporan Analitik">
              <ReportManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/faq"
        element={
          <ProtectedRoute>
            <AdminLayout title="Management FAQ">
              <FAQManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/caller"
        element={
          <ProtectedRoute>
            <AdminLayout title="Management Caller">
              <CallerMenu />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports/unit"
        element={
          <ProtectedRoute>
            <AdminLayout title="Laporan Analitik Unit">
              <UnitReportManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/caller/services/:serviceId"
        element={
          <ProtectedRoute>
            <AdminLayout title="Caller Service">
              <CallerService />
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
      <Route
        path="/antrian"
        element={
          <AntrianLayout title="Cek Nomor Antrian">
            <DisplayAntrian />
          </AntrianLayout>
        }
      />
      <Route path="*" Component={NotFound} />
    </Routes>
  );
}
