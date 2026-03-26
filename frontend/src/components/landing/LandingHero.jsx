import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function LandingHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 px-6 py-14 shadow-[0_25px_80px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:px-12 sm:py-20">
      <div className="absolute -left-24 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -right-20 -top-14 h-56 w-56 rounded-full bg-indigo-400/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-fuchsia-400/15 blur-3xl" />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.p
          animate={{ opacity: [0.65, 1, 0.65] }}
          className="mx-auto mb-6 inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-cyan-100"
          transition={{ duration: 3, repeat: Infinity }}
        >
          MODERN GOLF CHARITY SUBSCRIPTION PLATFORM
        </motion.p>

        <motion.h1
          className="text-4xl font-black leading-tight text-white sm:text-6xl"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.6 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Build impact with every
          <span className="gradient-text block drop-shadow-[0_0_35px_rgba(56,189,248,0.45)]">
            draw, score, and subscription.
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-xl"
          initial={{ opacity: 0, y: 18 }}
          transition={{ delay: 0.08, duration: 0.6 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          Premium member experience for monthly golf draws, transparent winner verification, and
          charity-first participation.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          transition={{ delay: 0.14, duration: 0.55 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <motion.div transition={{ type: "spring", stiffness: 260, damping: 20 }} whileHover={{ scale: 1.03 }}>
            <Link
              className="inline-flex rounded-xl bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_12px_35px_rgba(56,189,248,0.35)]"
              to="/signup"
            >
              Get Started
            </Link>
          </motion.div>

          <motion.a
            className="inline-flex rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/80 hover:bg-white/5 hover:text-cyan-200"
            href="#features"
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.03 }}
          >
            View Demo
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

export default LandingHero;
