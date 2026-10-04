import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}