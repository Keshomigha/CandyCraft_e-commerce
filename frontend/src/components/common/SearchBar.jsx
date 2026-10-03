import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSearchSuggestions } from '../../api/productApi';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../../utils/recentSearches';
import useMediaQuery from '../../hooks/useMediaQuery';

const PLACEHOLDER = 'Search products, shops, and categories';

function SearchIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function speechRecognitionSupported() {
  return typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
}

export default function SearchBar({ variant = 'bar', className = '' }) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ products: [], shops: [], categories: [], popularSearches: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [recent, setRecent] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [listening, setListening] = useState(false);

  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const recognitionRef = useRef(null);
  const [rect, setRect] = useState(null);

  const canVoice = speechRecognitionSupported();

  const updateRect = useCallback(() => {
    if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    // The icon variant's trigger animates its own width (40px -> 260px) after
    // `open` flips true, so a one-off measurement here captures the anchor
    // mid-animation and mis-positions the dropdown. A ResizeObserver keeps
    // `rect` in sync for the full duration of that width transition.
    let observer;
    if (typeof ResizeObserver !== 'undefined' && anchorRef.current) {
      observer = new ResizeObserver(updateRect);
      observer.observe(anchorRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      observer?.disconnect();
    };
  }, [open, updateRect]);

  const fetchSuggestions = useCallback((q) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(false);
    getSearchSuggestions(q, controller.signal)
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const openPanel = () => {
    setOpen(true);
    setRecent(getRecentSearches());
    fetchSuggestions(query);
  };

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  // Close on an outside click/tap. A full-viewport backdrop div would sit on
  // top of the (non-portaled) trigger in the stacking order and swallow
  // clicks meant for it, so this listens on the document instead and only
  // closes when the click lands outside both the trigger and the panel.
  useEffect(() => {
    if (!open || isMobile) return;
    const handlePointerDown = (e) => {
      if (anchorRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMobile]);

  const runSearch = (term) => {
    const trimmed = (term || '').trim();
    setRecent(addRecentSearch(trimmed || query));
    navigate(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products');
    setQuery('');
    close();
  };

  const goToCategory = (label) => {
    setRecent(addRecentSearch(query || label));
    navigate(`/products?category=${encodeURIComponent(label)}`);
    setQuery('');
    close();
  };

  const goToShop = (shopName) => {
    setRecent(addRecentSearch(query || shopName));
    navigate(`/products?search=${encodeURIComponent(shopName)}`);
    setQuery('');
    close();
  };

  const goToProduct = (id) => {
    setRecent(addRecentSearch(query));
    navigate(`/products/${id}`);
    setQuery('');
    close();
  };

  const flatList = useMemo(() => {
    if (query.trim().length >= 2) {
      return [
        ...data.products.map((p) => ({ kind: 'product', key: `p-${p.id}`, run: () => goToProduct(p.id), item: p })),
        ...data.categories.map((c) => ({ kind: 'category', key: `c-${c}`, run: () => goToCategory(c), item: c })),
        ...data.shops.map((s) => ({ kind: 'shop', key: `s-${s.id}`, run: () => goToShop(s.shop_name), item: s })),
      ];
    }
    return [
      ...recent.map((t) => ({ kind: 'recent', key: `r-${t}`, run: () => runSearch(t), item: t })),
      ...data.popularSearches.map((t) => ({ kind: 'popular', key: `pop-${t}`, run: () => runSearch(t), item: t })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, data, recent]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatList.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && flatList[activeIndex]) {
        flatList[activeIndex].run();
      } else {
        runSearch(query);
      }
    }
  };

  const startVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setQuery(transcript);
        if (!open) openPanel();
      }
    };
    recognition.start();
  };

  const isBar = variant === 'bar';
  const barWidth = isBar ? Math.max(rect?.width || 0, 260) : 320;
  const panelStyle = !isMobile && rect
    ? {
        position: 'fixed',
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - barWidth - 16),
        width: barWidth,
      }
    : undefined;

  const renderProductRow = (p, idx) => (
    <button
      key={`p-${p.id}`}
      role="option"
      aria-selected={flatList[activeIndex]?.key === `p-${p.id}`}
      onClick={() => goToProduct(p.id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${flatList[activeIndex]?.key === `p-${p.id}` ? 'bg-pink-50' : 'hover:bg-gray-50'}`}
    >
      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0">
        {p.image_url ? (
          <img src={`${import.meta.env.VITE_API_URL}${p.image_url}`} alt="" className="w-full h-full object-contain" />
        ) : <span className="text-lg">🍬</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 truncate">{p.name}</p>
        <p className="text-xs text-gray-400">{p.category}</p>
      </div>
      <span className="text-sm font-semibold text-pink-500 flex-shrink-0">₹{Number(p.price).toFixed(2)}</span>
    </button>
  );

  const panelContent = (
    <motion.div
      ref={panelRef}
      initial={isMobile ? { opacity: 0 } : { opacity: 0, y: -8 }}
      animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={isMobile ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      style={isMobile ? undefined : panelStyle}
      className={isMobile
        ? 'fixed inset-0 bg-white z-[70] flex flex-col'
        : 'bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[70]'
      }
    >
      {isMobile && (
        <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 flex-shrink-0">
          <button onClick={close} aria-label="Back" className="p-2 -ml-1 text-gray-500 active:scale-90 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER}
              aria-label={PLACEHOLDER}
              className="w-full h-10 rounded-full border border-gray-200 pl-9 pr-9 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-gray-50"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button onClick={() => runSearch(query)} className="text-sm font-semibold text-pink-500 px-2">Search</button>
        </div>
      )}

      <div id="search-suggestions-listbox" role="listbox" className={isMobile ? 'flex-1 overflow-y-auto' : 'max-h-[70vh] overflow-y-auto'}>
        {loading && (
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin" />
            Searching…
          </div>
        )}

        {!loading && error && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-gray-500 font-medium">Couldn't load suggestions</p>
            <p className="text-xs text-gray-400 mt-1">Check your connection, or press Enter to search anyway.</p>
          </div>
        )}

        {!loading && !error && query.trim().length >= 2 && (
          <>
            {data.products.length === 0 && data.categories.length === 0 && data.shops.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">No matches for "{query}" yet</p>
                <button onClick={() => runSearch(query)} className="text-xs text-pink-500 font-semibold mt-2 hover:underline">
                  Search anyway →
                </button>
              </div>
            ) : (
              <>
                {data.products.length > 0 && (
                  <div className="py-1">
                    <p className="px-4 pt-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Products</p>
                    {data.products.map(renderProductRow)}
                  </div>
                )}
                {data.categories.length > 0 && (
                  <div className="py-1 border-t border-gray-50">
                    <p className="px-4 pt-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Categories</p>
                    {data.categories.map((c) => (
                      <button
                        key={`c-${c}`}
                        role="option"
                        aria-selected={flatList[activeIndex]?.key === `c-${c}`}
                        onClick={() => goToCategory(c)}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors ${flatList[activeIndex]?.key === `c-${c}` ? 'bg-pink-50' : 'hover:bg-gray-50'}`}
                      >
                        <span className="text-gray-400">🏷️</span> {c}
                      </button>
                    ))}
                  </div>
                )}
                {data.shops.length > 0 && (
                  <div className="py-1 border-t border-gray-50">
                    <p className="px-4 pt-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Shops</p>
                    {data.shops.map((s) => (
                      <button
                        key={`s-${s.id}`}
                        role="option"
                        aria-selected={flatList[activeIndex]?.key === `s-${s.id}`}
                        onClick={() => goToShop(s.shop_name)}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors ${flatList[activeIndex]?.key === `s-${s.id}` ? 'bg-pink-50' : 'hover:bg-gray-50'}`}
                      >
                        <span className="text-gray-400">🏪</span> {s.shop_name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!loading && !error && query.trim().length < 2 && (
          <>
            {recent.length > 0 && (
              <div className="py-1">
                <div className="flex items-center justify-between px-4 pt-2 pb-1">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recent Searches</p>
                  <button
                    onClick={() => { clearRecentSearches(); setRecent([]); }}
                    className="text-[11px] text-gray-400 hover:text-pink-500"
                  >
                    Clear
                  </button>
                </div>
                {recent.map((t) => (
                  <button
                    key={`r-${t}`}
                    role="option"
                    aria-selected={flatList[activeIndex]?.key === `r-${t}`}
                    onClick={() => runSearch(t)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors ${flatList[activeIndex]?.key === `r-${t}` ? 'bg-pink-50' : 'hover:bg-gray-50'}`}
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t}
                  </button>
                ))}
              </div>
            )}
            {data.popularSearches.length > 0 && (
              <div className="py-1 border-t border-gray-50">
                <p className="px-4 pt-2 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Popular Searches</p>
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                  {data.popularSearches.map((t) => (
                    <button
                      key={`pop-${t}`}
                      role="option"
                      aria-selected={flatList[activeIndex]?.key === `pop-${t}`}
                      onClick={() => runSearch(t)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${flatList[activeIndex]?.key === `pop-${t}` ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-600 hover:border-pink-300'}`}
                    >
                      🔥 {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {recent.length === 0 && data.popularSearches.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Start typing to search products, shops, and categories
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <div ref={anchorRef} className={`relative ${className}`}>
      {isBar ? (
        <div className="relative">
          <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={!open ? inputRef : undefined}
            value={query}
            onFocus={openPanel}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); if (!open) openPanel(); }}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER}
            aria-label={PLACEHOLDER}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="search-suggestions-listbox"
            className="w-full h-10 rounded-full border border-gray-200 pl-10 pr-16 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-gray-50 text-gray-700 placeholder-gray-400 transition-colors"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search" className="text-gray-400 hover:text-pink-500 p-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {canVoice && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={startVoice}
                aria-label="Voice search"
                className={`p-1.5 rounded-full ${listening ? 'text-pink-500 bg-pink-50' : 'text-gray-400 hover:text-pink-500'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {open && !isMobile ? (
            <motion.div
              key="expanded"
              initial={{ width: 40, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 40, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden"
            >
              <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
                onKeyDown={handleKeyDown}
                placeholder={PLACEHOLDER}
                aria-label={PLACEHOLDER}
                role="combobox"
                aria-expanded={open}
                aria-autocomplete="list"
                aria-controls="search-suggestions-listbox"
                className="w-full h-10 rounded-full border border-gray-200 pl-9 pr-16 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-gray-50 text-gray-700 placeholder-gray-400"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {canVoice && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={startVoice}
                    aria-label="Voice search"
                    className={`p-1.5 rounded-full ${listening ? 'text-pink-500 bg-pink-100' : 'text-gray-400 hover:text-pink-500'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setQuery(''); close(); }}
                  aria-label="Close search"
                  className="p-1.5 rounded-full text-gray-400 hover:text-pink-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="icon"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={openPanel}
              aria-label={PLACEHOLDER}
              className="text-gray-500 hover:text-pink-500 flex-shrink-0 p-1"
            >
              <SearchIcon />
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {createPortal(
        <AnimatePresence>
          {open && panelContent}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
