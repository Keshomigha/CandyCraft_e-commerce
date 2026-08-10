import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { register } from '../../api/authApi';
import useAuth from '../../hooks/useAuth';

export default function Register() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    role: searchParams.get('role') === 'seller' ? 'seller' : 'buyer',
    shopName: '',
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.role === 'seller' && { shopName: form.shopName }),
      };
      const res = await register(payload);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="flex items-center gap-2 mb-6">
          <motion.span className="text-3xl" whileHover={{ rotate: [0, -15, 15, -10, 0], scale: 1.15 }} transition={{ duration: 0.5 }}>🍬</motion.span>
          <span className="font-bold text-xl">
            <span className="text-pink-500">candy</span>
            <span className="text-gray-800">craft</span>
          </span>
        </Link>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-3xl font-bold text-gray-900 mb-1"
      >
        Create Account
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.5 }}
        className="text-gray-400 mb-8"
      >
        Join CandyCraft today — it's free!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.26, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
      >
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input
              name="name" value={form.name} onChange={handle} required
              placeholder="Your full name"
              className="w-full border border-gray-200 rounded-full px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition placeholder-gray-300"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input
              name="email" value={form.email} onChange={handle} required type="email"
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-full px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition placeholder-gray-300"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                name="password" value={form.password} onChange={handle} required
                type={showPass ? 'text' : 'password'}
                placeholder="Create a strong password"
                className="w-full border border-gray-200 rounded-full px-4 py-3 pr-11 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition placeholder-gray-300"
              />
              <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88 6.59 6.59m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </motion.button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                name="confirm" value={form.confirm} onChange={handle} required
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                className="w-full border border-gray-200 rounded-full px-4 py-3 pr-11 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition placeholder-gray-300"
              />
              <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88 6.59 6.59m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </motion.button>
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">I want to</label>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setForm({ ...form, role: 'buyer' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full border-2 text-sm font-medium transition-colors ${form.role === 'buyer' ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                🛒 Buy Products
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setForm({ ...form, role: 'seller' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full border-2 text-sm font-medium transition-colors ${form.role === 'seller' ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                🏪 Sell Products
              </motion.button>
            </div>
          </div>

          {/* Shop name — seller only */}
          <AnimatePresence>
            {form.role === 'seller' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shop Name</label>
                <input
                  name="shopName" value={form.shopName} onChange={handle} required
                  placeholder="Your shop name"
                  className="w-full border border-gray-200 rounded-full px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition placeholder-gray-300"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-full bg-linear-to-r from-pink-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={loading ? 'creating' : 'idle'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="inline-block"
              >
                {loading ? 'Creating Account…' : 'Create Account'}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-gray-800 hover:text-pink-500 transition-colors">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
