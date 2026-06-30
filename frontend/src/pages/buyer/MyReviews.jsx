import { useEffect, useState } from 'react';
import { getMyReviews, getPendingReviews, submitReview } from '../../api/reviewApi';

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <svg
            className={`w-6 h-6 transition-colors ${s <= (hovered || value) ? 'text-yellow-400' : 'text-gray-200'}`}
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-4 h-4 ${s <= rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function MyReviews() {
  const [pending, setPending]   = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [forms, setForms]       = useState({});    // { productId: { rating, comment, loading, error } }
  const [submitted, setSubmitted] = useState({});  // { productId: true }

  useEffect(() => {
    Promise.all([
      getPendingReviews().catch(() => ({ data: [] })),
      getMyReviews().catch(() => ({ data: [] })),
    ]).then(([p, r]) => {
      setPending(Array.isArray(p.data) ? p.data : []);
      setReviews(Array.isArray(r.data) ? r.data : []);
    }).finally(() => setLoading(false));
  }, []);

  const setForm = (productId, patch) => {
    setForms(prev => ({
      ...prev,
      [productId]: { ...prev[productId], ...patch },
    }));
  };

  const handleSubmit = async (e, productId) => {
    e.preventDefault();
    const form = forms[productId] || {};
    if (!form.rating) {
      setForm(productId, { error: 'Please select a rating.' });
      return;
    }
    setForm(productId, { loading: true, error: '' });
    try {
      await submitReview({ productId, rating: form.rating, comment: form.comment || '' });
      setSubmitted(prev => ({ ...prev, [productId]: true }));
      setPending(prev => prev.filter(p => p.product_id !== productId));
      // Re-fetch reviews
      getMyReviews().then(r => setReviews(Array.isArray(r.data) ? r.data : []));
    } catch (err) {
      setForm(productId, { loading: false, error: err.response?.data?.message || 'Failed to submit.' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">My Reviews ⭐</h1>
        <p className="text-gray-400 text-sm mt-1">Share your feedback and help other buyers</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse shadow-sm border border-gray-100" />)}
        </div>
      ) : (
        <>
          {/* Pending reviews */}
          {pending.length > 0 && (
            <section>
              <h2 className="font-bold text-gray-700 mb-3">Pending Reviews</h2>
              <div className="space-y-4">
                {pending.map(item => {
                  const form = forms[item.product_id] || {};
                  const isDone = submitted[item.product_id];
                  return (
                    <div key={item.product_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.product_image ? (
                              <img src={`${import.meta.env.VITE_API_URL}${item.product_image}`} alt={item.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">🍬</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{item.product_name}</p>
                            <p className="text-xs text-gray-400">Order #{item.order_id}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#F4A261] bg-orange-50 px-3 py-1 rounded-full">
                          Awaiting Review
                        </span>
                      </div>

                      {isDone ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Review submitted! Thank you.
                        </div>
                      ) : (
                        <form onSubmit={e => handleSubmit(e, item.product_id)} className="space-y-3">
                          <StarInput
                            value={form.rating || 0}
                            onChange={r => setForm(item.product_id, { rating: r, error: '' })}
                          />
                          <textarea
                            rows={3}
                            placeholder="Tell others about your experience..."
                            value={form.comment || ''}
                            onChange={e => setForm(item.product_id, { comment: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#F4A261] focus:ring-2 focus:ring-orange-100 transition resize-none placeholder-gray-300"
                          />
                          {form.error && <p className="text-red-500 text-xs">{form.error}</p>}
                          <button
                            type="submit"
                            disabled={form.loading}
                            className="bg-[#F4A261] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#E76F51] transition-colors disabled:opacity-60"
                          >
                            {form.loading ? 'Submitting…' : 'Submit Review'}
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Past reviews */}
          <section>
            <h2 className="font-bold text-gray-700 mb-3">My Past Reviews</h2>
            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                <p className="text-3xl mb-3">⭐</p>
                <p className="text-gray-500 font-medium">No reviews yet</p>
                <p className="text-gray-400 text-sm mt-1">After purchasing and receiving products, you can leave reviews here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {review.product_image ? (
                          <img src={`${import.meta.env.VITE_API_URL}${review.product_image}`} alt={review.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">🍬</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 text-sm">{review.product_name}</p>
                          <p className="text-xs text-gray-400 flex-shrink-0">{fmt(review.created_at)}</p>
                        </div>
                        <StarDisplay rating={review.rating} />
                        {review.comment && (
                          <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
