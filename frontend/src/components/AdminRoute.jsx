import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isInitializing } = useAuth();

  if (isInitializing) {
    return <div className="page-status">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}

export default AdminRoute;
