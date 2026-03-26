import { Link } from "react-router-dom";

function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/45 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Link className="text-xl font-bold tracking-tight text-white sm:text-2xl" to="/">
          FAIRWAY<span className="text-red-500">FLIX</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-red-300/70 hover:text-white"
            to="/login"
          >
            Login
          </Link>
          <Link
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[0_10px_26px_rgba(220,38,38,0.4)] transition hover:scale-[1.03] hover:bg-red-500"
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
