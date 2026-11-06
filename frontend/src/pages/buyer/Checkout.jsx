import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CircleCheck, CreditCard, MapPin, Package, ShoppingCart } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getCart } from '../../api/cartApi';
import { checkout } from '../../api/orderApi';
import { PAYMENT_METHODS, PAYMENT_LABELS, SHIPPING_FEE, formatLKR } from '../../utils/constants';

const STEPS = [
  { label: 'Delivery Address', icon: MapPin },
  { label: 'Payment Method', icon: CreditCard },
  { label: 'Confirmation', icon: Package },
];

const EMPTY_ADDRESS = { firstName: '', lastName: '', phone: '', address: '', city: '', postalCode: '' };

const inputClass =
  'w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 placeholder-gray-300';

function itemTotal(item) {
  const fee = item.customization?.fee ? Number(item.customization.fee) : 0;
  return Number(item.price) * item.quantity + fee;
}

function loadSavedAddress(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
}

function validate(a) {
  const errors = {};
  if (!a.firstName.trim()) errors.firstName = 'Required';
  if (!a.lastName.trim()) errors.lastName = 'Required';
  if (!a.phone.trim()) errors.phone = 'Required';
  else if (!/^\+?[\d\s-]{9,15}$/.test(a.phone.trim())) errors.phone = 'Enter a valid phone number';
  if (!a.address.trim()) errors.address = 'Required';
  if (!a.city.trim()) errors.city = 'Required';
  if (a.postalCode.trim() && !/^\d{5}$/.test(a.postalCode.trim())) errors.postalCode = 'Must be 5 digits';
  return errors;
}

function Stepper({ step }) {
  return (
    <div className="flex items-start mb-8">
      {STEPS.map(({ label, icon: Icon }, i) => {
        const done = i < step;
        const active = i === step;
        const reached = done || active;
        const StepIcon = done ? CircleCheck : Icon;
        return (
          <div key={label} className={`flex items-start ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center gap-2 w-24 sm:w-32 flex-shrink-0">
              <motion.div
                animate={{ scale: active ? 1.05 : 1 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  reached ? 'bg-gradient-to-br from-[#F4A261] to-[#E76F51] text-white shadow-md shadow-orange-200' : 'bg-[#F0EAE4] text-gray-500'
                }`}
              >
                <StepIcon className="w-5 h-5" />
              </motion.div>
              <span className={`text-xs sm:text-sm font-semibold text-center ${reached ? 'text-[#F4A261]' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mt-6 rounded-full bg-gray-200 overflow-hidden">
                <motion.div
                  className="h-full bg-[#F4A261]"
                  initial={false}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-semibold text-gray-800 mb-2">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-500 mt-1">{error}</span>}
    </label>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.01 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-200/60 disabled:opacity-60"
      {...props}
    >
      {children}
    </motion.button>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 h-14 rounded-2xl border border-gray-200 bg-white text-gray-800 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const addressKey = `checkout-address:${user?.id ?? 'anon'}`;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState(() => {
    const saved = loadSavedAddress(addressKey);
    if (saved) return { ...EMPTY_ADDRESS, ...saved };
    const [firstName = '', ...rest] = (user?.name || '').split(' ');
    return { ...EMPTY_ADDRESS, firstName, lastName: rest.join(' ') };
  });
  const [errors, setErrors] = useState({});
  const [payment, setPayment] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    getCart()
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const subtotal = items.reduce((sum, i) => sum + itemTotal(i), 0);
  const total = subtotal + SHIPPING_FEE;
  const stockProblem = items.some((i) => i.quantity > i.stock);

  const setField = (key) => (e) => {
    setAddress((a) => ({ ...a, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const goToPayment = (e) => {
    e.preventDefault();
    const errs = validate(address);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try { localStorage.setItem(addressKey, JSON.stringify(address)); } catch { /* ignore */ }
    setStep(1);
  };

  const fullName = `${address.firstName.trim()} ${address.lastName.trim()}`.trim();
  const addressLine = [address.address.trim(), [address.city.trim(), address.postalCode.trim()].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');

  const placeOrder = async () => {
    setSubmitError('');
    setPlacing(true);
    try {
      const res = await checkout({
        shippingAddress: addressLine,
        contactName: fullName,
        contactPhone: address.phone.trim(),
        paymentMethod: payment,
      });
      navigate(`/buyer/orders/${res.data.id}`, { state: { justPlaced: true } });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not place your order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="w-8 h-8 border-2 border-gray-200 border-t-[#F4A261] rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
        <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
        <p className="text-gray-700 font-semibold">Your cart is empty</p>
        <Link to="/products" className="mt-3 inline-block text-sm font-semibold text-[#E76F51] hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  const selectedPayment = PAYMENT_METHODS.find((m) => m.value === payment);

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-800">Checkout</h1>
      <p className="text-gray-500 mt-1 mb-8">Complete your order in 3 easy steps</p>

      <Stepper step={step} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.form
                key="address"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                onSubmit={goToPayment}
                noValidate
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Delivery Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                  <Field label="First Name" error={errors.firstName}>
                    <input className={inputClass} value={address.firstName} onChange={setField('firstName')} autoComplete="given-name" />
                  </Field>
                  <Field label="Last Name" error={errors.lastName}>
                    <input className={inputClass} value={address.lastName} onChange={setField('lastName')} autoComplete="family-name" />
                  </Field>
                  <Field label="Phone Number" error={errors.phone} className="sm:col-span-2">
                    <input className={inputClass} value={address.phone} onChange={setField('phone')} placeholder="+94 77 123 4567" type="tel" autoComplete="tel" />
                  </Field>
                  <Field label="Address" error={errors.address} className="sm:col-span-2">
                    <input className={inputClass} value={address.address} onChange={setField('address')} placeholder="123 Galle Road, Colombo 3" autoComplete="street-address" />
                  </Field>
                  <Field label="City" error={errors.city}>
                    <input className={inputClass} value={address.city} onChange={setField('city')} placeholder="Colombo" autoComplete="address-level2" />
                  </Field>
                  <Field label="Postal Code" error={errors.postalCode}>
                    <input className={inputClass} value={address.postalCode} onChange={setField('postalCode')} placeholder="00300" inputMode="numeric" autoComplete="postal-code" />
                  </Field>
                </div>
                <div className="flex mt-8">
                  <PrimaryButton type="submit">
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </PrimaryButton>
                </div>
              </motion.form>
            )}

            {step === 1 && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Method</h2>
                <div role="radiogroup" aria-label="Payment method" className="space-y-4">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    const selected = payment === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={m.disabled}
                        onClick={() => setPayment(m.value)}
                        className={`w-full text-left rounded-2xl border-2 px-5 py-4 transition-colors flex items-center gap-4
                          ${selected ? 'border-[#F4A261] bg-orange-50/40' : 'border-gray-200 hover:border-gray-300'}
                          ${m.disabled ? 'opacity-60 cursor-not-allowed hover:border-gray-200' : ''}`}
                      >
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.color}`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2 font-semibold text-gray-800">
                            {m.label}
                            {m.note && (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {m.note}
                              </span>
                            )}
                          </span>
                          {selected && m.description && (
                            <span className="block text-xs text-gray-500 mt-1">{m.description}</span>
                          )}
                        </span>
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-[#F4A261]' : 'border-gray-300'}`}>
                          {selected && <span className="w-2.5 h-2.5 rounded-full bg-[#F4A261]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-8">
                  <BackButton onClick={() => setStep(0)} />
                  <PrimaryButton type="button" onClick={() => setStep(2)}>
                    Review Order <ArrowRight className="w-4 h-4" />
                  </PrimaryButton>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Review Your Order</h2>

                <div className="rounded-2xl bg-[#F5F0EB] px-5 py-4 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-500">Delivering to</p>
                    <button type="button" onClick={() => setStep(0)} className="text-xs font-semibold text-[#E76F51] hover:underline">Edit</button>
                  </div>
                  <p className="font-semibold text-gray-800">{fullName} · {address.phone.trim()}</p>
                  <p className="text-sm text-gray-500">{addressLine}</p>
                </div>

                <div className="rounded-2xl bg-[#F5F0EB] px-5 py-4 mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-500">Payment</p>
                    <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-[#E76F51] hover:underline">Edit</button>
                  </div>
                  <p className="font-semibold text-gray-800 flex items-center gap-2">
                    {selectedPayment && <selectedPayment.icon className="w-4 h-4 text-gray-600" />}
                    {PAYMENT_LABELS[payment]}
                  </p>
                </div>

                <div className="space-y-2 mb-3">
                  {items.map((i) => (
                    <div key={i.product_id} className="flex items-center justify-between text-sm gap-4">
                      <span className="text-gray-500 truncate">{i.name} × {i.quantity}</span>
                      <span className="font-semibold text-gray-800 whitespace-nowrap">{formatLKR(itemTotal(i))}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                  <span className="font-bold text-gray-800">Total (incl. shipping)</span>
                  <span className="text-lg font-extrabold text-[#F4A261]">{formatLKR(total)}</span>
                </div>

                {stockProblem && (
                  <p className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
                    Some items exceed available stock. <Link to="/buyer/cart" className="font-semibold underline">Update your cart</Link> to continue.
                  </p>
                )}
                {submitError && (
                  <p className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">{submitError}</p>
                )}

                <div className="flex gap-4 mt-6">
                  <BackButton onClick={() => setStep(1)} />
                  <PrimaryButton type="button" onClick={placeOrder} disabled={placing || stockProblem}>
                    {placing ? 'Placing Order…' : <>Place Order <CircleCheck className="w-4 h-4" /></>}
                  </PrimaryButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cart summary */}
        <aside className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Cart Summary</h2>
          <div className="space-y-2.5 pb-4 border-b border-gray-200">
            {items.map((i) => (
              <div key={i.product_id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500 truncate">{i.name}{i.quantity > 1 ? ` × ${i.quantity}` : ''}</span>
                <span className="text-gray-800 whitespace-nowrap">{formatLKR(itemTotal(i))}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2.5 py-4 border-b border-gray-200 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="text-gray-800">{formatLKR(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="text-gray-800">{formatLKR(SHIPPING_FEE)}</span></div>
          </div>
          <div className="flex justify-between pt-4">
            <span className="font-bold text-gray-800">Total</span>
            <span className="font-extrabold text-[#F4A261]">{formatLKR(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
