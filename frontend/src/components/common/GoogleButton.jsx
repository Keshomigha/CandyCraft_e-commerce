import { motion } from 'framer-motion';

export default function GoogleButton({ onClick, loading, label = 'Continue with Google' }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3.5 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.43 3.58v2.98h3.93c2.3-2.12 3.62-5.24 3.62-8.8z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.93-2.98c-1.09.73-2.48 1.16-4 1.16-3.08 0-5.69-2.08-6.62-4.87H1.32v3.07C3.29 21.3 7.31 24 12 24z" />
          <path fill="#FBBC05" d="M5.38 14.38A7.2 7.2 0 0 1 5 12c0-.83.14-1.63.38-2.38V6.55H1.32A11.97 11.97 0 0 0 0 12c0 1.94.46 3.77 1.32 5.45l4.06-3.07z" />
          <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.29 2.7 1.32 6.55l4.06 3.07C6.31 6.85 8.92 4.77 12 4.77z" />
        </svg>
      )}
      {loading ? 'Connecting…' : label}
    </motion.button>
  );
}
