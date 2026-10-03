import { motion } from 'framer-motion';

// Shown briefly while a lazy-loaded route's code downloads. Matches the
// theme (eyebrow styling, ink/signal colors) instead of a generic spinner,
// so even a loading state feels like part of the site rather than a
// framework default.
export default function RouteLoader() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
      <motion.p
        className="eyebrow"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
      >
        Loading
      </motion.p>
    </div>
  );
}
