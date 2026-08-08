import { motion } from 'framer-motion';
import { fadeUp } from '../../utils/motionVariants';

export default function Reveal({ children, className, custom = 0, as = 'div', once = true, amount = 0.2, ...rest }) {
  const Component = motion[as] || motion.div;
  return (
    <Component
      className={className}
      custom={custom}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      {...rest}
    >
      {children}
    </Component>
  );
}
