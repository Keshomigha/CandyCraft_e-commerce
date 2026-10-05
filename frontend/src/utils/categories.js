import { Camera, Candy, Flower2, Gift, GraduationCap, Mail, Palette, Sparkles } from 'lucide-react';

// Single source of truth for the product category list, shared by the
// homepage category tiles, the Shop filter pills, and the seller's
// Add/Edit Product category dropdown — these used to be three separate,
// mismatched lists.
export const CATEGORIES = [
  { label: 'Candy Bouquets',   icon: Candy },
  { label: 'Flower Bouquets',  icon: Flower2 },
  { label: 'Graduation Gifts', icon: GraduationCap },
  { label: 'Gift Boxes',       icon: Gift },
  { label: 'Greeting Cards',   icon: Mail },
  { label: 'Custom Paintings', icon: Palette },
];

export const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);

// Generic customization toggles — used for every category except the two
// with their own dedicated customization UI below.
export const GENERIC_OPTIONS = [
  { key: 'recipientName', label: 'Recipient Name' },
  { key: 'giftMessage', label: 'Gift Message' },
  { key: 'themeColor', label: 'Color Theme' },
  { key: 'giftWrapping', label: 'Gift Wrapping' },
  { key: 'greetingCard', label: 'Greeting Card' },
];

export const GREETING_CARD_OPTIONS = [
  { key: 'customName', label: 'Allow Custom Name' },
  { key: 'customMessage', label: 'Allow Custom Message' },
];

export const PAINTING_OPTIONS = [
  { key: 'photoUpload', label: 'Allow Photo Upload' },
  { key: 'frameAvailable', label: 'Frame Available' },
];

export const PAINTING_SIZES = ['Small', 'Medium', 'Large', 'Extra Large'];
export const THEME_COLORS = ['Pink', 'Red', 'Purple', 'Blue', 'Yellow', 'Green', 'White', 'Rainbow Mix'];

export function getCustomizableBadge(product) {
  if (!product?.customizable) return null;
  if (product.category === 'Greeting Cards') return { label: 'Personalized', icon: Sparkles };
  if (product.category === 'Custom Paintings') return { label: 'Photo Upload', icon: Camera };
  return { label: 'Customizable', icon: Sparkles };
}
