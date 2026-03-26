import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FadeInSection from "../components/FadeInSection";

const features = [
  {
    title: "Smart Monthly Draws",
    description: "Automated draw periods with publish controls, winner tracking, and rollover handling.",
    icon: "🎯",
  },
  {
    title: "Golf Score Engine",
    description: "Track latest 5 scores, lock participation to active subscribers, and keep data audit-ready.",
    icon: "⛳",
  },
  {
    title: "Charity-First Model",
    description: "Members select a cause and contribution percentage while still competing for prizes.",
    icon: "🤝",
  },
];

const flow = [
  "Create your account and choose a charity.",
  "Activate monthly or yearly membership.",
  "Submit your golf scores and join the draw.",
  "Winners upload proof, admins verify, payouts close the loop.",
];

function HomePage() {
  return (
    <div className="min-h-screen bg-hero-grid">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link className="text-lg font-semibold tracking-tight text-white sm:text-xl" to="/">
            Fairway<span className="gradient-text">Impact</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-300/60 hover:text-cyan-200"
              to="/login"
            >
              Login
            </Link>
            <Link
              className="rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow transition hover:scale-[1.02]"
              to="/signup"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-20 pt-14 sm:px-6">
        <FadeInSection className="glass-card overflow-hidden px-6 py-12 sm:px-10 sm:py-16">
          <div className="max-w-3xl space-y-6">
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              className="inline-block rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-medium tracking-[0.2em] text-cyan-200"
              transition={{ duration: 2.8, repeat: Infinity }}
            >
              GOLF CHARITY SUBSCRIPTION PLATFORM
            </motion.p>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
              Play with purpose.
              <span className="gradient-text block">Win together, give bigger.</span>
            </h1>
            <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
              A premium monthly golf draw platform where members compete, communities benefit, and
              charity impact scales with every subscription.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-xl bg-gradient-to-r from-teal-300 to-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.03]"
                to="/signup"
              >
                Subscribe Now
              </Link>
              <Link
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/60 hover:text-cyan-200"
                to="/login"
              >
                Existing Member Login
              </Link>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Why Members Love It</h2>
            <p className="mt-2 text-slate-300">Built for engagement, fairness, and real outcomes.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <motion.article
                key={feature.title}
                className="glass-card p-6"
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ y: -6, scale: 1.01 }}
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </FadeInSection>

        <FadeInSection className="glass-card px-6 py-10 sm:px-10">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">How It Works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {flow.map((step, index) => (
              <motion.div
                key={step}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <p className="text-sm font-semibold text-cyan-200">Step {index + 1}</p>
                <p className="mt-1 text-slate-200">{step}</p>
              </motion.div>
            ))}
          </div>
        </FadeInSection>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} FairwayImpact. Designed for premium charity-driven play.</p>
          <div className="flex gap-4">
            <Link className="transition hover:text-cyan-200" to="/login">
              Login
            </Link>
            <Link className="transition hover:text-cyan-200" to="/signup">
              Join
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
