import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import aboutImage from '../assets/images/aboutimage.jpg';

const VALUES = [
  {
    emoji: '🎨',
    title: 'Creativity First',
    desc: 'Every product is a unique handcrafted work of edible art made with love.',
  },
  {
    emoji: '🎓',
    title: 'Student Empowerment',
    desc: 'We give students a platform to earn income and grow their entrepreneurial skills.',
  },
  {
    emoji: '🤝',
    title: 'Community',
    desc: 'We connect talented student creators with people who appreciate handmade gifts.',
  },
];

const STATS = [
  { value: '250+', label: 'Happy Buyers' },
  { value: '40+',  label: 'Student Sellers' },
  { value: '180+', label: 'Unique Products' },
  { value: '300+', label: 'Orders Completed' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, className, custom = 0 }) {
  return (
    <motion.div
      className={className}
      custom={custom}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-b border-gray-100"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mt-3 mb-3">About CandyCraft</h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            A marketplace for student creators to make sweet gifting.
          </p>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {/* Our Story */}
        <Reveal className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Our Story</h2>
              <div className="space-y-4 text-gray-500 text-sm leading-relaxed">
                <p>
                  CandyCraft was born in 2026 when a group of university students
                  realized there was no easy way to sell their handmade candy
                  creations online. What started as a small WhatsApp group quickly
                  grew into a full marketplace connecting candy crafters with
                  customers across Sri Lanka.
                </p>
                <p>
                  Today we support over 40+ student sellers from universities across
                  the country, helping them earn income while doing what they love —
                  creating beautiful, edible art.
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 250, damping: 20 }}
              className="rounded-2xl overflow-hidden h-64 md:h-72 shadow"
            >
              <img
                src={aboutImage}
                alt="CandyCraft Story"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </Reveal>

        {/* Our Values */}
        <section>
          <Reveal>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Our Values</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-md text-center"
              >
                <motion.span
                  className="text-4xl inline-block"
                  whileHover={{ scale: 1.2, rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  {v.emoji}
                </motion.span>
                <h3 className="font-bold text-gray-800 mt-4 mb-2">{v.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats banner */}
        <Reveal className="rounded-2xl bg-linear-to-r from-pink-500 to-purple-500 py-12 px-8">
          <h2 className="text-white font-bold text-2xl text-center mb-10">CandyCraft by the Numbers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
              >
                <p className="text-4xl font-extrabold text-white">{s.value}</p>
                <p className="text-pink-100 text-sm mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal className="text-center py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Join?</h2>
          <p className="text-gray-400 text-sm mb-8">Start shopping or become a seller today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/products"
                className="px-8 py-3.5 rounded-full bg-linear-to-r from-pink-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity inline-block"
              >
                Browse Products
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register?role=seller"
                className="px-8 py-3.5 rounded-full border-2 border-pink-500 text-pink-500 font-semibold text-sm hover:bg-pink-50 transition-colors inline-block"
              >
                Become a Seller
              </Link>
            </motion.div>
          </div>
        </Reveal>

      </div>
    </div>
  );
}
