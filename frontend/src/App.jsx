import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ScoreEntryPage from "./pages/ScoreEntryPage";
import CharitySelectionPage from "./pages/CharitySelectionPage";
import CharityDetailPage from "./pages/CharityDetailPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const location = useLocation();

  const pageTransition = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.3, ease: "easeOut" },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...pageTransition}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <SignupPage />
              </PublicOnlyRoute>
            }
          />
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
          <Route path="*" element={<Navigate replace to="/" />} />
          <Route path="/not-found" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default App;
