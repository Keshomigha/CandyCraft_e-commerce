import { motion } from 'framer-motion';
import logo from '../../assets/images/logo.png';

// The brand mark, sized identically everywhere it appears (navbar, footer,
// auth pages, dashboard sidebars) via the same className prop the old
// gradient-badge glyph used.
export default function LogoMark({ className = 'w-9 h-9' }) {
  return (
    <motion.img
      src={logo}
      alt="CandyCraft"
      whileHover={{ rotate: [0, -10, 10, -6, 0], scale: 1.08 }}
      transition={{ duration: 0.5 }}
      className={`${className} rounded-xl object-cover shadow-sm shadow-pink-200/60 flex-shrink-0`}
    />
  );
}
