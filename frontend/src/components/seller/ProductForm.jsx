import { useState, useRef } from 'react';

const CATEGORIES = [
  'Bouquets', 'Boxes', 'Baskets', 'Cakes', 'Custom', 'Chocolates',
  'Gummy', 'Lollipops', 'Gift Sets', 'Other',
];

export default function ProductForm({ initial = {}, onSubmit, saving }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    description: initial.description || '',
    price: initial.price || '',
    stock: initial.stock ?? '',
    category: initial.category || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(
    initial.image_url ? `${import.meta.env.VITE_API_URL}${initial.image_url}` : null
  );
  const fileRef = useRef();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('stock', form.stock);
    fd.append('category', form.category);
    if (imageFile) fd.append('image', imageFile);
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image Upload */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4">Product Image</h2>
        <div className="flex items-start gap-5">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#F4A261] hover:bg-orange-50/30 transition-colors overflow-hidden flex-shrink-0"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-[10px] text-gray-400">Click to upload</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          <div className="text-xs text-gray-400 pt-2">
            <p>Upload a product image.</p>
            <p className="mt-1">JPEG, PNG, WebP, or GIF. Max 5MB.</p>
            {preview && (
              <button
                type="button"
                onClick={() => { setImageFile(null); setPreview(null); fileRef.current.value = ''; }}
                className="text-red-500 font-medium mt-2 hover:underline"
              >
                Remove image
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-800 mb-1">Product Details</h2>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">Product Name *</label>
          <input
            name="name" value={form.name} onChange={handle} required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
            placeholder="e.g. Rainbow Candy Bouquet"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">Description</label>
          <textarea
            name="description" value={form.description} onChange={handle} rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300 resize-none"
            placeholder="Describe your product..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Price (LKR) *</label>
            <input
              name="price" value={form.price} onChange={handle} required type="number" min="0" step="0.01"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
              placeholder="1500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Stock Quantity</label>
            <input
              name="stock" value={form.stock} onChange={handle} type="number" min="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
              placeholder="50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Category</label>
            <select
              name="category" value={form.category} onChange={handle}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition text-gray-700 bg-white"
            >
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white font-semibold px-7 py-3 rounded-full hover:shadow-lg hover:shadow-orange-200/50 transition-all disabled:opacity-60 text-sm"
        >
          {saving ? 'Saving…' : initial.id ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
