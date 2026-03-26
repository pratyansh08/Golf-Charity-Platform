import { Link } from "react-router-dom";

function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/35 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Link className="text-xl font-bold tracking-tight text-white sm:text-2xl" to="/">
          Fairway<span className="gradient-text">Impact</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-fuchsia-300/80 hover:text-fuchsia-200"
            to="/login"
          >
            Login
          </Link>
          <Link
            className="rounded-xl bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-[0_10px_28px_rgba(168,85,247,0.35)] transition hover:scale-[1.03]"
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
