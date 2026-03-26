import { useState } from "react";
import { motion } from "framer-motion";
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
    <div className="flex min-h-screen items-center justify-center bg-hero-grid px-4 py-12">
      <motion.form
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md space-y-5 p-6 text-slate-100 sm:p-8"
        initial={{ opacity: 0, y: 24 }}
        onSubmit={handleSubmit}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Welcome Back</p>
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-sm text-slate-300">Sign in with your email and password.</p>
        </div>

        {successMessage ? (
          <p className="rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
            {successMessage}
          </p>
        ) : null}

        <label className="block text-sm">
          <span className="mb-2 block text-slate-200">Email</span>
          <input
            className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-300"
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-2 block text-slate-200">Password</span>
          <input
            className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-300"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-rose-300/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <motion.button
          className="w-full rounded-xl bg-gradient-to-r from-teal-300 to-cyan-300 px-4 py-2.5 font-semibold text-slate-950"
          disabled={isLoading}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? "Logging in..." : "Login"}
        </motion.button>

        <p className="text-sm text-slate-300">
          Need an account?{" "}
          <Link className="font-semibold text-cyan-200 hover:text-cyan-100" to="/signup">
            Create one
          </Link>
        </p>
        <p className="text-sm text-slate-400">
          Want to explore first?{" "}
          <Link className="font-semibold text-slate-200 hover:text-white" to="/">
            Go to homepage
          </Link>
        </p>
      </motion.form>
    </div>
  );
}

export default LoginPage;
