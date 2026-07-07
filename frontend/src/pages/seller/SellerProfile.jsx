import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../api/profileApi';
import { getSellerProfile } from '../../api/sellerApi';
import useAuth from '../../hooks/useAuth';

export default function SellerProfilePage() {
  const { user, login } = useAuth();

  const [profile, setProfile] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ text: '', ok: true });

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', postal_code: '',
    currentPassword: '', newPassword: '',
  });

  useEffect(() => {
    Promise.all([
      getProfile().catch(() => ({ data: null })),
      getSellerProfile().catch(() => ({ data: null })),
    ]).then(([p, s]) => {
      if (p.data) {
        setProfile(p.data);
        setForm(prev => ({
          ...prev,
          name: p.data.name || '',
          email: p.data.email || '',
          phone: p.data.phone || '',
          address: p.data.address || '',
          city: p.data.city || '',
          postal_code: p.data.postal_code || '',
        }));
      }
      if (s.data) setSeller(s.data);
    }).finally(() => setLoading(false));
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Profile</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your seller account</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl h-24 animate-pulse shadow-sm border border-gray-100" />
          <div className="bg-white rounded-2xl h-64 animate-pulse shadow-sm border border-gray-100" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-xl font-extrabold text-[#F4A261] flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-base">{profile?.name}</p>
              <p className="text-sm text-gray-400">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-[#F4A261] bg-orange-50 px-2.5 py-0.5 rounded-full capitalize">
                  Seller
                </span>
                {seller && (
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    🏪 {seller.shop_name}
                  </span>
                )}
                {seller && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize
                    ${seller.status === 'approved' ? 'text-green-700 bg-green-100' : 'text-yellow-700 bg-yellow-100'}`}>
                    {seller.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Shop Info */}
          {seller && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
              <h2 className="font-bold text-gray-800 mb-1">Shop Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Shop Name</p>
                  <p className="text-sm font-semibold text-gray-700">{seller.shop_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                    ${seller.status === 'approved' ? 'text-green-700 bg-green-100' : 'text-yellow-700 bg-yellow-100'}`}>
                    {seller.status}
                  </span>
                </div>
              </div>
              {seller.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-gray-600">{seller.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
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
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-gray-800 mb-1">Address</h2>
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
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
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
          </div>

          {/* Feedback */}
          {msg.text && (
            <div className={`text-sm px-4 py-3 rounded-xl font-medium ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {msg.text}
            </div>
          )}

          {/* Save button */}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white font-semibold px-7 py-3 rounded-full hover:shadow-lg hover:shadow-orange-200/50 transition-all disabled:opacity-60 text-sm"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
}
