import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F0EB] text-center px-4">
      <p className="text-6xl mb-4">🍬</p>
      <h1 className="text-4xl font-extrabold text-gray-800 mb-2">404</h1>
      <p className="text-gray-500 mb-6">Oops! This page doesn't exist.</p>
      <Link to="/" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-full transition-colors">
        Go Home
      </Link>
    </div>
  );
}
