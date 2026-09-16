import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfile, updateProfile } from '../../api/profileApi';
import useAuth from '../../hooks/useAuth';
import ProfileAvatarUpload from '../../components/common/ProfileAvatarUpload';

const cardFade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Profile() {
  const { user, login } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ text: '', ok: true });

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', postal_code: '',
    currentPassword: '', newPassword: '',
  });

  useEffect(() => {
    getProfile()
      .then(r => {
        setProfile(r.data);
        setForm(prev => ({
          ...prev,
          name: r.data.name || '',
          email: r.data.email || '',
          phone: r.data.phone || '',
          address: r.data.address || '',
          city: r.data.city || '',
          postal_code: r.data.postal_code || '',
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', ok: true });
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postal_code: form.postal_code,
        ...(form.newPassword && {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      };
      const res = await updateProfile(payload);
      setProfile(res.data.user);
      // Update auth context name/email
      const token = localStorage.getItem('token');
      login(token, { ...user, name: res.data.user.name, email: res.data.user.email });
      setMsg({ text: 'Profile updated successfully!', ok: true });
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to save changes.', ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({ text: '', ok: true }), 4000);
    }
  };

  const initials = profile?.name?.slice(0, 2).toUpperCase() || '??';

  const handlePhotoUploaded = (updatedUser) => {
    setProfile(updatedUser);
    const token = localStorage.getItem('token');
    login(token, { ...user, profile_image: updatedUser.profile_image });
    setMsg({ text: 'Profile photo updated!', ok: true });
    setTimeout(() => setMsg({ text: '', ok: true }), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-gray-800">My Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account information</p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl h-24 animate-pulse shadow-sm border border-gray-100" />
          <div className="bg-white rounded-2xl h-64 animate-pulse shadow-sm border border-gray-100" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Profile card */}
          <motion.div custom={0} variants={cardFade} initial="hidden" animate="visible" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-5">
            <ProfileAvatarUpload
              imageUrl={profile?.profile_image ? `${import.meta.env.VITE_API_URL}${profile.profile_image}` : null}
              initials={initials}
              onUploaded={handlePhotoUploaded}
              onError={(text) => { setMsg({ text, ok: false }); setTimeout(() => setMsg({ text: '', ok: true }), 4000); }}
            />
            <div>
              <p className="font-bold text-gray-800 text-base">{profile?.name}</p>
              <p className="text-sm text-gray-400">{profile?.email}</p>
              <span className="text-xs font-semibold text-[#F4A261] bg-orange-50 px-2.5 py-0.5 rounded-full capitalize mt-1 inline-block">
                {profile?.role}
              </span>
            </div>
          </motion.div>

          {/* Personal Info */}
          <motion.div custom={1} variants={cardFade} initial="hidden" animate="visible" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-800 mb-1">Personal Information</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Full Name</label>
              <input
                name="name" value={form.name} onChange={handle} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
                placeholder="Your full name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
                <input
                  name="email" value={form.email} onChange={handle} required type="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Phone</label>
                <input
                  name="phone" value={form.phone} onChange={handle} type="tel"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
                  placeholder="+94 77 123 4567"
                />
              </div>
            </div>
          </motion.div>

          {/* Default Address */}
          <motion.div custom={2} variants={cardFade} initial="hidden" animate="visible" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-800 mb-1">Default Address</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Address</label>
              <input
                name="address" value={form.address} onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">City</label>
                <input
                  name="city" value={form.city} onChange={handle}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
                  placeholder="Colombo"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Postal Code</label>
                <input
                  name="postal_code" value={form.postal_code} onChange={handle}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
                  placeholder="00300"
                />
              </div>
            </div>
          </motion.div>

          {/* Change Password */}
          <motion.div custom={3} variants={cardFade} initial="hidden" animate="visible" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-800 mb-1">Change Password</h2>
            <p className="text-xs text-gray-400 -mt-2">Leave blank to keep your current password.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Current Password</label>
                <input
                  name="currentPassword" value={form.currentPassword} onChange={handle} type="password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">New Password</label>
                <input
                  name="newPassword" value={form.newPassword} onChange={handle} type="password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </motion.div>

          {/* Feedback */}
          <AnimatePresence>
            {msg.text && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`text-sm px-4 py-3 rounded-xl font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {msg.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save button */}
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#F4A261] hover:bg-[#E76F51] text-white font-semibold px-7 py-3 rounded-full transition-colors disabled:opacity-60 shadow-sm"
          >
            <span className="text-base">🔒</span>
            {saving ? 'Saving…' : 'Save Changes'}
          </motion.button>
        </form>
      )}
    </div>
  );
}
