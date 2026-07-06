const STATUS_STYLES = {
  approved: 'bg-green-100 text-green-700',
  pending:  'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-600',
};

export default function ProductTable({ products, onEdit, onDelete, apiUrl }) {
  if (products.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-gray-400 text-sm">No products found. Add your first product!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map(p => (
            <tr key={p.id} className="hover:bg-gray-50/60 transition-colors group">
              <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.image_url ? (
                      <img src={`${apiUrl}${p.image_url}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">🍬</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{p.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full capitalize">
                  {p.category || '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                LKR {Number(p.price).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <span className={`text-sm font-semibold ${Number(p.stock) <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                  {p.stock}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'}`}>
                  {p.status}
                </span>
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
