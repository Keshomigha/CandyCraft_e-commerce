import { Banknote, CreditCard, Landmark } from 'lucide-react';

// Flat delivery charge in LKR. The backend applies the same value
// (backend/models/orderModel.js) — this copy is for display only.
export const SHIPPING_FEE = 250;

export const PAYMENT_METHODS = [
  {
    value: 'card',
    label: 'Credit / Debit Card',
    icon: CreditCard,
    color: 'text-blue-600 bg-blue-50',
    disabled: true,
    note: 'Coming soon',
  },
  {
    value: 'bank_transfer',
    label: 'Bank Transfer',
    icon: Landmark,
    color: 'text-purple-600 bg-purple-50',
    description: 'Transfer the total after placing your order. Your order is processed once the payment is confirmed.',
  },
  {
    value: 'cod',
    label: 'Cash on Delivery',
    icon: Banknote,
    color: 'text-green-600 bg-green-50',
    description: 'Pay in cash when your order arrives.',
  },
];

export const PAYMENT_LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.value, m.label]));

export function formatLKR(value) {
  return `LKR ${Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;
}

// "Rose Bouquet" / "Rose Bouquet + 2 more", falling back to the order number
// when item names aren't available.
export function orderTitle(order) {
  const names = order?.item_names || [];
  if (names.length === 0) return `Order #${order?.id}`;
  return names.length === 1 ? names[0] : `${names[0]} + ${names.length - 1} more`;
}
