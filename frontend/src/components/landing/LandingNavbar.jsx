import { Link } from "react-router-dom";

function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link className="text-xl font-bold tracking-tight text-white sm:text-2xl" to="/">
          Fairway <span className="gradient-text">Impact</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/80 hover:text-cyan-200"
            to="/login"
          >
            Login
          </Link>
          <Link
            className="rounded-xl bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-[0_10px_28px_rgba(56,189,248,0.35)] transition hover:scale-[1.03]"
            to="/signup"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default LandingNavbar;
