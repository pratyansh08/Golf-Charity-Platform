import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ScoreEntryPage from "./pages/ScoreEntryPage";
import CharitySelectionPage from "./pages/CharitySelectionPage";
import CharityDetailPage from "./pages/CharityDetailPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuth } from "./context/AuthContext";

function RootRedirect() {
  const { isAuthenticated } = useAuth();

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scores" element={<ScoreEntryPage />} />
        <Route path="/charities" element={<CharitySelectionPage />} />
        <Route path="/charities/:charityId" element={<CharityDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <MainLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminPanelPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
