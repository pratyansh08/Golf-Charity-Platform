import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function LandingHero() {
  return (
    <section className="relative h-screen min-h-[680px] overflow-hidden">
      <div className="netflix-hero-overlay absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(239,68,68,0.26),transparent_28%),radial-gradient(circle_at_85%_65%,rgba(147,51,234,0.22),transparent_30%),radial-gradient(circle_at_20%_90%,rgba(255,255,255,0.08),transparent_34%)]" />

      <div className="relative mx-auto grid h-full w-full max-w-7xl items-center gap-10 px-5 pb-12 pt-24 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-10">
        <motion.div
          className="z-10 max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="mb-5 inline-flex rounded-full border border-red-300/35 bg-red-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-red-200">
            Golf Charity Platform
          </p>

          <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white sm:text-6xl xl:text-7xl">
            One swing.
            <span className="gradient-text block drop-shadow-[0_0_26px_rgba(239,68,68,0.45)]">
              One draw.
            </span>
            <span className="block text-slate-200">Real impact.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Experience a cinematic, premium draw platform where subscriptions power transparent
            prizes and measurable charity outcomes.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <motion.div transition={{ type: "spring", stiffness: 260, damping: 20 }} whileHover={{ scale: 1.03 }}>
              <Link
                className="inline-flex rounded-lg bg-red-600 px-7 py-3 text-sm font-bold text-white shadow-[0_14px_32px_rgba(220,38,38,0.45)] hover:bg-red-500"
                to="/signup"
              >
                Get Started
              </Link>
            </motion.div>

            <motion.a
              className="inline-flex rounded-lg border border-white/25 px-7 py-3 text-sm font-semibold text-slate-100 transition hover:border-red-300/70 hover:text-white"
              href="#features"
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.03 }}
            >
              View Demo
            </motion.a>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -12, 0] }}
          className="relative z-10 mx-auto h-[340px] w-full max-w-[520px] lg:h-[430px]"
          transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-[38%_62%_54%_46%/43%_40%_60%_57%] bg-gradient-to-br from-red-500/45 via-rose-500/35 to-violet-500/25 blur-[1px]" />
          <div className="absolute inset-[14%] rounded-[60%_40%_35%_65%/45%_65%_35%_55%] border border-white/15 bg-black/35 backdrop-blur-xl" />
          <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-red-400/30 blur-3xl" />
          <div className="absolute bottom-2 right-5 h-28 w-28 rounded-full bg-fuchsia-400/25 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}

export default LandingHero;
