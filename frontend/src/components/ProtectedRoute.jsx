import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p className="route-loading" role="status">Loading...</p>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}