import { motion } from "framer-motion";

function FadeInSection({ children, className = "", ...props }) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 28 }}
      {...props}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.25 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.section>
  );
}

export default FadeInSection;
