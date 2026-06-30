import { useState } from 'react';
import contactImage from '../assets/images/Contactimage.jpg';

export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-400 text-sm">We'd love to hear from you. Send us a message</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Left — Get In Touch */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-7">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Get In Touch</h2>
              <ul className="space-y-5">
                {/* Email */}
                <li className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <p className="text-sm font-medium text-gray-700">hello@candycraft.lk</p>
                  </div>
                </li>
                {/* Phone */}
                <li className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498A1 1 0 0 1 21 15.72V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                    <p className="text-sm font-medium text-gray-700">+94 77 123 4567</p>
                  </div>
                </li>
                {/* Location */}
                <li className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Location</p>
                    <p className="text-sm font-medium text-gray-700">Colombo, Sri Lanka</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden shadow-sm h-48">
              <img src={contactImage} alt="CandyCraft" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Right — Send a Message */}
          <div className="bg-white rounded-2xl shadow-sm p-7">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Send a Message</h2>

            {sent ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <span className="text-5xl mb-4">🍬</span>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Message Sent!</h3>
                <p className="text-gray-400 text-sm">Thanks for reaching out. We'll get back to you shortly.</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-6 text-sm text-pink-500 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input
                    name="name" value={form.name} onChange={handle} required
                    placeholder="Your name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition placeholder-gray-300"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <input
                    name="email" value={form.email} onChange={handle} required type="email"
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition placeholder-gray-300"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                  <input
                    name="subject" value={form.subject} onChange={handle} required
                    placeholder="How can we help?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition placeholder-gray-300"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                  <textarea
                    name="message" value={form.message} onChange={handle} required rows={4}
                    placeholder="Tell us more..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition placeholder-gray-300 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-linear-to-r from-pink-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
                >
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
