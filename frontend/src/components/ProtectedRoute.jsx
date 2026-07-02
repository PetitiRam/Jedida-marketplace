import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // wait until auth is loaded (important for refresh)
  if (loading) return null;

  // not logged in → redirect
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // logged in → allow access
  return children;
}
