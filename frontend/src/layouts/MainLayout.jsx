import { Outlet } from "react-router-dom";
import AppHeader from "../components/AppHeader";

function MainLayout() {
  return (
    <div className="min-h-screen bg-hero-grid">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
