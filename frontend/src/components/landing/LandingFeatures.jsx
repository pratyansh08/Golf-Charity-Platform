import { motion } from "framer-motion";
import FadeInSection from "../FadeInSection";

const features = [
  {
    title: "Subscription Intelligence",
    description: "Monthly and yearly plans with clean activation, status tracking, and renewal behavior.",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Score + Draw Engine",
    description: "Store latest five scores, run draw logic, and evaluate exact 3/4/5 match outcomes.",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 3v18M3 12h18" strokeLinecap="round" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    title: "Winner Verification",
    description: "Proof submission and admin review flow to ensure payout transparency and trust.",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Charity Impact Layer",
    description: "Members choose causes and contribution percentages while engaging in premium gameplay.",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 21s-6-4.2-9-8.6C.9 9.5 2.2 5 6.5 5c2.1 0 3.3 1.1 4.2 2.3C11.6 6.1 12.8 5 14.9 5 19.2 5 20.5 9.5 18 12.4 15 16.8 12 21 12 21Z" />
      </svg>
    ),
  },
];

function LandingFeatures() {
  return (
    <FadeInSection className="space-y-8" id="features">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Product Highlights</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Structured, scalable modules designed like a real SaaS experience.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => (
          <motion.article
            key={feature.title}
            className="glass-card rounded-2xl p-6"
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
            whileHover={{ y: -8, scale: 1.015 }}
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300/30 to-indigo-300/30 text-cyan-100">
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
          </motion.article>
        ))}
      </div>
    </FadeInSection>
  );
}

export default LandingFeatures;
