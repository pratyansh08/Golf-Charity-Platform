import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppHeader() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? "bg-cyan-300/20 text-cyan-200" : "text-slate-200 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-[180px]">
          <strong className="text-slate-100">
            Fairway<span className="gradient-text">Impact</span>
          </strong>
          <p className="text-xs text-slate-400">Member dashboard</p>
        </div>
        <nav className="flex flex-1 flex-wrap items-center gap-1">
          <NavLink className={navLinkClass} to="/dashboard">
            Dashboard
          </NavLink>
          <NavLink className={navLinkClass} to="/scores">
            Scores
          </NavLink>
          <NavLink className={navLinkClass} to="/charities">
            Charity
          </NavLink>
          <NavLink className={navLinkClass} to="/profile">
            Profile
          </NavLink>
          {isAdmin ? (
            <NavLink className={navLinkClass} to="/admin">
              Admin
            </NavLink>
          ) : null}
          <NavLink
            className="rounded-lg bg-gradient-to-r from-teal-300 to-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            to="/dashboard#subscription-section"
          >
            Subscribe
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-right">
            <strong className="block text-sm text-slate-100">{user?.name}</strong>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
          <button
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-slate-100 transition hover:border-cyan-300/60 hover:text-cyan-200"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
