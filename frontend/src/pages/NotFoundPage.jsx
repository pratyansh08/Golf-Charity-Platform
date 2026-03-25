import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Page not found</h1>
        <p className="muted-text">The page you requested does not exist.</p>
        <Link className="button" to="/">
          Go home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
