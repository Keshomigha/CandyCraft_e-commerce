import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createProduct, updateProduct } from '../../api/sellerApi';
import { getProductById } from '../../api/productApi';
import ProductForm from '../../components/seller/ProductForm';

export default function AddEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getProductById(id)
      .then(r => setProduct(r.data))
      .catch(() => setError('Product not found'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (formData) => {
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }
      navigate('/seller/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/seller/products"
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {isEdit ? 'Update your product details' : 'Fill in the details to list a new product'}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm px-4 py-3 rounded-xl font-medium bg-red-50 text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {/* Form */}
      {loading ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl h-40 animate-pulse shadow-sm border border-gray-100" />
          <div className="bg-white rounded-2xl h-80 animate-pulse shadow-sm border border-gray-100" />
        </div>
      ) : (
        <ProductForm
          initial={isEdit ? product : {}}
          onSubmit={handleSubmit}
          saving={saving}
        />
      )}
    </div>
  );
}
