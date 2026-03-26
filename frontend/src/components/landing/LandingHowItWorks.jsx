import { motion } from "framer-motion";
import FadeInSection from "../FadeInSection";

const steps = [
  "Create your account and set your charity preference.",
  "Activate membership and submit your golf scores.",
  "Join monthly draws and track outcomes transparently.",
];

function LandingHowItWorks() {
  return (
    <FadeInSection className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 lg:px-10" id="how-it-works">
      <div className="glass-card rounded-3xl p-7 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200/90">Process</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">How It Works</h2>
        <p className="mt-3 max-w-2xl text-slate-300 sm:text-lg">
          Three simple actions, one clean experience.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step}
              className="rounded-2xl border border-white/10 bg-slate-900/50 p-5"
              initial={{ opacity: 0, y: 16 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs font-semibold tracking-[0.18em] text-red-200">STEP {index + 1}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">{step}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </FadeInSection>
  );
}

export default LandingHowItWorks;
