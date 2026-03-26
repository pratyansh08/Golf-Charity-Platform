import { motion } from "framer-motion";
import FadeInSection from "../FadeInSection";

const steps = [
  "Sign up and configure your preferred charity contribution.",
  "Activate your membership and submit your golf score entries.",
  "Join monthly draws and track participation from your dashboard.",
  "Winners upload proof, admins verify, and payouts are finalized.",
];

function LandingHowItWorks() {
  return (
    <FadeInSection className="glass-card rounded-3xl p-6 sm:p-10">
      <h2 className="text-3xl font-bold text-white sm:text-4xl">How It Works</h2>
      <p className="mt-3 max-w-2xl text-slate-300">
        A simple, transparent flow designed for trust and long-term engagement.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <motion.div
            key={step}
            className="rounded-2xl border border-white/10 bg-slate-900/45 p-5"
            initial={{ opacity: 0, x: index % 2 === 0 ? -16 : 16 }}
            transition={{ delay: index * 0.08, duration: 0.45 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <p className="text-xs font-semibold tracking-[0.18em] text-cyan-200">STEP {index + 1}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">{step}</p>
          </motion.div>
        ))}
      </div>
    </FadeInSection>
  );
}

export default LandingHowItWorks;
