import { motion } from "framer-motion";
import FadeInSection from "../FadeInSection";

const features = [
  {
    title: "Smart Membership",
    description: "Monthly and yearly plans with clear status, renewals, and controlled access.",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Draw Automation",
    description: "Score-based participation with accurate 3/4/5 match evaluation and result publishing.",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 3v18M3 12h18" strokeLinecap="round" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    title: "Charity + Trust",
    description: "Proof verification, payout visibility, and contribution-driven gameplay in one system.",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 21s-6-4.2-9-8.6C.9 9.5 2.2 5 6.5 5c2.1 0 3.3 1.1 4.2 2.3C11.6 6.1 12.8 5 14.9 5 19.2 5 20.5 9.5 18 12.4 15 16.8 12 21 12 21Z" />
      </svg>
    ),
  },
];

function LandingFeatures() {
  return (
    <FadeInSection className="mx-auto w-full max-w-7xl space-y-9 px-5 py-24 sm:px-8 lg:px-10" id="features">
      <div className="text-left sm:text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200/90">Highlights</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">What Makes It Powerful</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300 sm:text-lg">
          Everything you need for a premium subscription + draw product experience.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature, index) => (
          <motion.article
            key={feature.title}
            className="glass-card rounded-2xl p-7"
            initial={{ opacity: 0, y: 18 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.015 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-400/25 via-rose-400/20 to-violet-400/20 text-red-100">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-white sm:text-xl">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-red-200/80">
              0{index + 1}
            </p>
          </motion.article>
        ))}
      </div>
    </FadeInSection>
  );
}

export default LandingFeatures;
