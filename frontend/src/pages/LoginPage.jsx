import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
  });
  const [error, setError] = useState("");
  const successMessage = location.state?.signupSuccess || "";

  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await login(form);
      navigate(response.user.role === "admin" ? "/admin" : from, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Login</h1>
        <p className="muted-text">Sign in with your email and password.</p>
        {successMessage ? <p className="form-success">{successMessage}</p> : null}

        <label className="field">
          <span>Email</span>
          <input name="email" onChange={handleChange} required type="email" value={form.email} />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="button" disabled={isLoading} type="submit">
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <p className="muted-text">
          Need an account? <Link to="/signup">Create one</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
