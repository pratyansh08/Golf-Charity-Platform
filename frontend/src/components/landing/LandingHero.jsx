import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function LandingHero() {
  return (
    <section className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:pb-20 lg:pt-20">
        <motion.div
          className="relative z-10 max-w-2xl space-y-7"
          initial={{ opacity: 0, y: 26 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="inline-flex items-center rounded-full border border-fuchsia-300/40 bg-fuchsia-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
            Golf Charity Platform
          </p>

          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl xl:text-7xl">
            Premium draws.
            <span className="gradient-text block drop-shadow-[0_0_30px_rgba(168,85,247,0.45)]">
              Real community impact.
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            A bold, modern membership experience for golf score submissions, monthly prize draws,
            and transparent charity contribution.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <motion.div transition={{ type: "spring", stiffness: 260, damping: 20 }} whileHover={{ scale: 1.03 }}>
              <Link
                className="inline-flex rounded-xl bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_12px_32px_rgba(99,102,241,0.4)]"
                to="/signup"
              >
                Get Started
              </Link>
            </motion.div>

            <motion.a
              className="inline-flex rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/80 hover:text-cyan-200"
              href="#how-it-works"
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.03 }}
            >
              Learn More
            </motion.a>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -10, 0] }}
          className="relative z-10 mx-auto h-[360px] w-full max-w-[520px] lg:h-[470px]"
          transition={{ duration: 7, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-[45%_55%_40%_60%/55%_45%_55%_45%] bg-gradient-to-br from-fuchsia-500/60 via-violet-500/45 to-cyan-500/45 blur-[2px]" />
          <div className="absolute inset-[12%] rounded-[60%_40%_55%_45%/45%_55%_45%_55%] border border-white/20 bg-slate-900/30 backdrop-blur-2xl" />
          <div className="absolute -left-10 top-6 h-28 w-28 rounded-full bg-cyan-400/35 blur-3xl" />
          <div className="absolute -bottom-8 right-0 h-32 w-32 rounded-full bg-fuchsia-400/35 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}

export default LandingHero;
