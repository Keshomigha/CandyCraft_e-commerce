import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CATEGORY_LABELS,
  GENERIC_OPTIONS,
  GREETING_CARD_OPTIONS,
  PAINTING_OPTIONS,
  PAINTING_SIZES,
} from '../../utils/categories';

function ToggleSwitch({ checked, onChange }) {
  return (
    <span className="relative inline-flex items-center">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <span className="w-11 h-6 bg-gray-200 peer-checked:bg-[#F4A261] rounded-full transition-colors" />
      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
    </span>
  );
}

function OptionCheckbox({ checked, onChange, label }) {
  return (
    <label
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors
        ${checked ? 'border-[#F4A261] bg-orange-50 text-gray-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-[#F4A261]" />
      {label}
    </label>
  );
}

export default function ProductForm({ initial = {}, onSubmit, saving }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    description: initial.description || '',
    price: initial.price || '',
    stock: initial.stock ?? '',
    category: initial.category || '',
  });
  const [customizable, setCustomizable] = useState(Boolean(initial.customizable));
  const [customizationOptions, setCustomizationOptions] = useState(
    Array.isArray(initial.customization_options) ? initial.customization_options : []
  );
  const [customizationFee, setCustomizationFee] = useState(initial.customization_fee || '');
  const [customizationSettings, setCustomizationSettings] = useState(
    initial.customization_settings && typeof initial.customization_settings === 'object'
      ? initial.customization_settings
      : {}
  );

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(
    initial.image_url ? `${import.meta.env.VITE_API_URL}${initial.image_url}` : null
  );
  const fileRef = useRef();

  const isGreetingCard = form.category === 'Greeting Cards';
  const isPainting = form.category === 'Custom Paintings';
  const isGenericCategory = !isGreetingCard && !isPainting;

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value;
    const wasGreetingCard = form.category === 'Greeting Cards';
    const wasPainting = form.category === 'Custom Paintings';
    const willBeGreetingCard = nextCategory === 'Greeting Cards';
    const willBePainting = nextCategory === 'Custom Paintings';

    // Reset customization state when switching between category "modes" so
    // stale option keys from one category type don't leak into another.
    if (wasGreetingCard !== willBeGreetingCard || wasPainting !== willBePainting) {
      setCustomizationOptions([]);
      setCustomizationSettings({});
      if (!willBeGreetingCard && !willBePainting) setCustomizable(false);
    }

    setForm({ ...form, category: nextCategory });
  };

  const toggleOption = (key) => {
    setCustomizationOptions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const updateSetting = (key, value) => setCustomizationSettings((prev) => ({ ...prev, [key]: value }));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isCustomizable = isGreetingCard || isPainting || customizable;

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('stock', form.stock);
    fd.append('category', form.category);
    fd.append('customizable', isCustomizable);
    fd.append('customizationOptions', JSON.stringify(isCustomizable ? customizationOptions : []));
    fd.append('customizationFee', isCustomizable ? (customizationFee || 0) : 0);
    fd.append('customizationSettings', JSON.stringify(isCustomizable ? customizationSettings : {}));
    if (imageFile) fd.append('image', imageFile);
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image Upload */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <h2 className="font-bold text-gray-800 mb-4">Product Image</h2>
        <div className="flex items-start gap-5">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => fileRef.current?.click()}
            className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#F4A261] hover:bg-orange-50/30 transition-colors overflow-hidden flex-shrink-0"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-contain p-1" />
            ) : (
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-[10px] text-gray-400">Click to upload</p>
              </div>
            )}
          </motion.div>
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
      </motion.div>

      {/* Product Details */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
      >
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
              name="category" value={form.category} onChange={handleCategoryChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition text-gray-700 bg-white"
            >
              <option value="">Select category</option>
              {CATEGORY_LABELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Greeting Card Options */}
      {isGreetingCard && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <span className="font-bold text-gray-800 block">💌 Greeting Card Options</span>
          <span className="text-xs text-gray-400">Choose what buyers can personalize on this card</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 mb-5">
            {GREETING_CARD_OPTIONS.map(({ key, label }) => (
              <OptionCheckbox
                key={key}
                checked={customizationOptions.includes(key)}
                onChange={() => toggleOption(key)}
                label={label}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Maximum Message Length</label>
              <input
                type="number" min="0" step="1"
                value={customizationSettings.maxMessageLength || ''}
                onChange={(e) => updateSetting('maxMessageLength', e.target.value)}
                placeholder="e.g. 200 characters"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
              />
              <p className="text-xs text-gray-400 mt-1">Optional — leave blank for no limit.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Additional Personalization Fee (LKR)</label>
              <input
                type="number" min="0" step="0.01"
                value={customizationFee}
                onChange={(e) => setCustomizationFee(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
              />
              <p className="text-xs text-gray-400 mt-1">Optional — added to the order total.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Custom Painting Options */}
      {isPainting && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <span className="font-bold text-gray-800 block">🎨 Custom Painting Options</span>
          <span className="text-xs text-gray-400">Choose how buyers can personalize this painting</span>

          <div className="mt-4 mb-4">
            <OptionCheckbox
              checked={customizationOptions.includes('photoUpload')}
              onChange={() => toggleOption('photoUpload')}
              label={PAINTING_OPTIONS[0].label}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Number of Photos Allowed</label>
              <input
                type="number" min="1" step="1"
                value={customizationSettings.numPhotosAllowed || ''}
                onChange={(e) => updateSetting('numPhotosAllowed', e.target.value)}
                placeholder="e.g. 1"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Painting Size <span className="font-normal text-gray-400">(optional)</span></label>
              <select
                value={customizationSettings.paintingSize || ''}
                onChange={(e) => updateSetting('paintingSize', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition bg-white text-gray-700"
              >
                <option value="">No default</option>
                {PAINTING_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-5 px-3.5 py-3 rounded-xl border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Frame Available</span>
            <ToggleSwitch
              checked={customizationOptions.includes('frameAvailable')}
              onChange={() => toggleOption('frameAvailable')}
            />
          </div>

          <div className="max-w-xs">
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Additional Customization Fee (LKR)</label>
            <input
              type="number" min="0" step="0.01"
              value={customizationFee}
              onChange={(e) => setCustomizationFee(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
            />
            <p className="text-xs text-gray-400 mt-1">Optional — added to the order total.</p>
          </div>
        </motion.div>
      )}

      {/* Custom Orders (generic categories) */}
      {isGenericCategory && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <label className="flex items-center justify-between cursor-pointer">
            <span>
              <span className="font-bold text-gray-800 block">Custom Orders</span>
              <span className="text-xs text-gray-400">Let buyers personalize this product before ordering</span>
            </span>
            <ToggleSwitch checked={customizable} onChange={(e) => setCustomizable(e.target.checked)} />
          </label>
          <p className="text-sm font-semibold text-gray-500 mt-2">
            {customizable ? '✓ Accept Custom Orders' : 'Standard listing — no customization'}
          </p>

          <AnimatePresence initial={false}>
            {customizable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Customization Options</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                    {GENERIC_OPTIONS.map(({ key, label }) => (
                      <OptionCheckbox
                        key={key}
                        checked={customizationOptions.includes(key)}
                        onChange={() => toggleOption(key)}
                        label={label}
                      />
                    ))}
                  </div>

                  <div className="max-w-xs">
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Additional Customization Fee (LKR)</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={customizationFee}
                      onChange={(e) => setCustomizationFee(e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition placeholder-gray-300"
                    />
                    <p className="text-xs text-gray-400 mt-1">Optional — added to the order total when a buyer customizes this item.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Submit */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex items-center gap-3"
      >
        <motion.button
          whileHover={{ scale: saving ? 1 : 1.03 }}
          whileTap={{ scale: saving ? 1 : 0.97 }}
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white font-semibold px-7 py-3 rounded-full hover:shadow-lg hover:shadow-orange-200/50 transition-all disabled:opacity-60 text-sm"
        >
          {saving ? 'Saving…' : initial.id ? 'Update Product' : 'Create Product'}
        </motion.button>
      </motion.div>
    </form>
  );
}
