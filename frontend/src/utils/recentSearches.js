const KEY = 'candycraft_recent_searches';
const MAX = 6;

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term) {
  const trimmed = (term || '').trim();
  if (!trimmed) return getRecentSearches();
  try {
    const existing = getRecentSearches().filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
    const next = [trimmed, ...existing].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getRecentSearches();
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
