import { motion } from 'framer-motion';

export default function PlatformStatsCard({ icon, value, label, color, index = 0 }) {
  return (
    <motion.div
      custom={index}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
      }}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}
