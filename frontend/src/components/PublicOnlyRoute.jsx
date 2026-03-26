import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isInitializing, isAdmin } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Loading session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate replace to={isAdmin ? "/admin" : "/dashboard"} />;
  }

  return children;
}

export default PublicOnlyRoute;
