import { Outlet } from "react-router-dom";
import AppHeader from "../components/AppHeader";

function MainLayout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="container app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
