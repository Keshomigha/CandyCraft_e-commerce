// Single source of truth for the product category list, shared by the
// homepage category tiles, the Shop filter pills, and the seller's
// Add/Edit Product category dropdown — these used to be three separate,
// mismatched lists.
export const CATEGORIES = [
  { label: 'Candy Bouquets',   emoji: '🍬' },
  { label: 'Flower Bouquets',  emoji: '🌸' },
  { label: 'Graduation Gifts', emoji: '🎓' },
  { label: 'Gift Boxes',       emoji: '🎁' },
  { label: 'Greeting Cards',   emoji: '💌' },
  { label: 'Custom Paintings', emoji: '🎨' },
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
  if (product.category === 'Greeting Cards') return '✨ Personalized';
  if (product.category === 'Custom Paintings') return '📷 Photo Upload';
  return '✨ Customizable';
}
