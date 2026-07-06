import { useEffect, useState } from 'react';
import { getSellerReviews } from '../../api/sellerApi';

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-4 h-4 ${i <= rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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

export default function SellerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSellerReviews()
      .then(r => setReviews(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const avgRating = reviews.length > 0
    ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10
    : 0;

  const breakdown = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Reviews</h1>
        <p className="text-gray-400 text-sm mt-1">See what customers are saying about your products</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl h-36 animate-pulse shadow-sm border border-gray-100" />
          <div className="bg-white rounded-2xl h-60 animate-pulse shadow-sm border border-gray-100" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Score */}
              <div className="text-center sm:text-left flex-shrink-0">
                <p className="text-5xl font-extrabold text-gray-800">{avgRating}</p>
                <Stars rating={Math.round(avgRating)} />
                <p className="text-xs text-gray-400 mt-2">{reviews.length} total reviews</p>
              </div>

              {/* Breakdown */}
              <div className="flex-1 w-full space-y-2">
                {breakdown.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 w-3">{star}</span>
                    <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {reviews.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-4xl mb-3">⭐</p>
                <p className="text-gray-400 text-sm">No reviews yet. They'll appear here once customers review your products.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {reviews.map(r => (
                  <div key={r.id} className="px-6 py-4 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-[#F4A261] flex-shrink-0">
                            {r.user_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{r.user_name}</p>
                            <p className="text-xs text-gray-400">{fmt(r.created_at)}</p>
                          </div>
                        </div>
                        <Stars rating={r.rating} />
                        {r.comment && (
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          {r.product_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
