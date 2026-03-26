import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FadeInSection from "../components/FadeInSection";

const features = [
  {
    id: "01",
    title: "Smart Monthly Draws",
    description:
      "Automated draw periods with publish controls, winner tracking, and transparent rollover handling.",
  },
  {
    id: "02",
    title: "Golf Score Engine",
    description:
      "Track latest 5 scores, lock participation to active subscribers, and keep entries audit-ready.",
  },
  {
    id: "03",
    title: "Charity-First Model",
    description: "Members select a cause and contribution percentage while still competing for prizes.",
  },
];

const flow = [
  "Create your account and choose a charity.",
  "Activate monthly or yearly membership.",
  "Submit your golf scores and join the draw.",
  "Winners upload proof, admins verify, and payouts close the loop.",
];

function HomePage() {
  return (
    <div className="home-shell">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link className="text-xl font-semibold tracking-tight text-white sm:text-2xl" to="/">
            Fairway <span className="gradient-text">Impact</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-xl border border-white/25 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/70 hover:text-cyan-200"
              to="/login"
            >
              Login
            </Link>
            <Link
              className="rounded-xl bg-gradient-to-r from-teal-300 via-cyan-300 to-blue-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:scale-[1.03]"
              to="/signup"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 pb-24 pt-14 sm:px-6 sm:pt-20">
        <FadeInSection className="glass-card relative overflow-hidden px-6 py-12 sm:px-12 sm:py-16">
          <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-24 left-24 h-56 w-56 rounded-full bg-teal-300/15 blur-3xl" />

          <div className="relative max-w-3xl space-y-7">
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              className="inline-block rounded-full border border-cyan-300/45 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-cyan-100"
              transition={{ duration: 2.8, repeat: Infinity }}
            >
              GOLF CHARITY SUBSCRIPTION PLATFORM
            </motion.p>

            <h1 className="section-heading text-4xl font-black text-white sm:text-6xl">
              Play with purpose.
              <span className="gradient-text block">Win together, give bigger.</span>
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-slate-200 sm:text-xl">
              A premium monthly golf draw platform where members compete, communities benefit, and
              charity impact scales with every subscription.
            </p>

            <div className="flex flex-wrap gap-4 pt-1">
              <Link
                className="rounded-xl bg-gradient-to-r from-teal-300 via-cyan-300 to-blue-300 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_12px_30px_rgba(45,212,191,0.3)] transition hover:-translate-y-0.5 hover:scale-[1.02]"
                to="/signup"
              >
                Subscribe Now
              </Link>
              <Link
                className="rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/70 hover:bg-white/5 hover:text-cyan-200"
                to="/login"
              >
                Existing Member Login
              </Link>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection>
          <div className="mb-8">
            <h2 className="section-heading text-3xl font-bold text-white sm:text-4xl">Why Members Love It</h2>
            <p className="mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
              Built for engagement, fairness, and real outcomes with a premium product experience.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <motion.article
                key={feature.title}
                className="glass-card p-7"
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ y: -8, scale: 1.015 }}
              >
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300/15 text-sm font-bold text-cyan-200">
                  {feature.id}
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </FadeInSection>

        <FadeInSection className="glass-card px-6 py-10 sm:px-10 sm:py-12">
          <h2 className="section-heading text-3xl font-bold text-white sm:text-4xl">How It Works</h2>
          <p className="mt-3 max-w-2xl text-slate-300">A simple journey from signup to impact.</p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {flow.map((step, index) => (
              <motion.div
                key={step}
                className="rounded-2xl border border-white/10 bg-slate-900/45 p-5"
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, x: 0 }}
              >
                <p className="text-sm font-semibold tracking-wide text-cyan-200">STEP {index + 1}</p>
                <p className="mt-2 text-base leading-relaxed text-slate-200">{step}</p>
              </motion.div>
            ))}
          </div>
        </FadeInSection>

        <div className="soft-divider" />
      </main>

      <footer className="bg-slate-950/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Fairway Impact. Premium charity-driven golf experience.</p>
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
