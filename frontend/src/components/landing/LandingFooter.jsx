import { Link } from "react-router-dom";

function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Fairway Impact. Built for premium charity-driven play.</p>
        <div className="flex items-center gap-4">
          <Link className="transition hover:text-cyan-200" to="/login">
            Login
          </Link>
          <Link className="transition hover:text-cyan-200" to="/signup">
            Get Started
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
