import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppHeader() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <div>
          <strong>Golf Charity Platform</strong>
          <p className="muted-text">Simple member dashboard</p>
        </div>
        <nav className="app-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/scores">Scores</NavLink>
          <NavLink to="/charities">Charity</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          {isAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
          <NavLink className="app-cta-link" to="/dashboard#subscription-section">
            Subscribe
          </NavLink>
        </nav>
        <div className="user-chip">
          <div>
            <strong>{user?.name}</strong>
            <p className="muted-text">{user?.role}</p>
          </div>
          <button className="button button-secondary" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
