import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCharities } from "../services/api";

function SignupPage() {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [charities, setCharities] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    charityId: "",
    contributionPercentage: 10,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCharities = async () => {
      try {
        const response = await getCharities();
        setCharities(response.charities);
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadCharities();
  }, []);

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
      await signup({
        ...form,
        charityId: form.charityId ? Number.parseInt(form.charityId, 10) : undefined,
        contributionPercentage: form.charityId
          ? Number.parseFloat(form.contributionPercentage)
          : undefined,
      });
      navigate("/login", {
        replace: true,
        state: {
          signupSuccess: "Account created successfully. Please log in with your email and password.",
          email: form.email,
        },
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-grid px-4 py-12">
      <motion.form
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-lg space-y-5 p-6 text-slate-100 sm:p-8"
        initial={{ opacity: 0, y: 24 }}
        onSubmit={handleSubmit}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Join The Platform</p>
          <h1 className="text-3xl font-bold">Signup</h1>
          <p className="text-sm text-slate-300">Create a member account to use the platform.</p>
        </div>

        <label className="block text-sm">
          <span className="mb-2 block text-slate-200">Name</span>
          <input
            className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-300"
            name="name"
            onChange={handleChange}
            required
            value={form.name}
          />
        </label>

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
            minLength="8"
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-2 block text-slate-200">Charity</span>
            <select
              className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-300"
              name="charityId"
              onChange={handleChange}
              value={form.charityId}
            >
              <option value="">Choose later</option>
              {charities.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-2 block text-slate-200">Contribution Percentage</span>
            <input
              className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-300 disabled:opacity-50"
              disabled={!form.charityId}
              max="100"
              min="10"
              name="contributionPercentage"
              onChange={handleChange}
              type="number"
              value={form.contributionPercentage}
            />
          </label>
        </div>

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
          {isLoading ? "Creating account..." : "Signup"}
        </motion.button>

        <p className="text-sm text-slate-300">
          Already registered?{" "}
          <Link className="font-semibold text-cyan-200 hover:text-cyan-100" to="/login">
            Login
          </Link>
        </p>
      </motion.form>
    </div>
  );
}

export default SignupPage;
