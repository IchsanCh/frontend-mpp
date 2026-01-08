import { Navigate } from "react-router-dom";
import { authService } from "../services/api";

export default function PublicRoute({ children }) {
  if (authService.isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
