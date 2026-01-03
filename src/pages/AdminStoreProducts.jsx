import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Save, Trash2, Edit2, Home, Package } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';

const CATEGORIES = ['Books', 'Souvenirs', 'Other'];

const AdminStoreProducts = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_nzd: '',
    image_url: '',
    category: 'Books',
    stock_quantity: 0,
    is_active: true
  });

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    console.log('[AdminStoreProducts] Fetching all products...');
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Get auth token from localStorage
      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const authData = localStorage.getItem(storageKey);

      const headers = {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      };

      // Add Authorization header if we have an access token
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const accessToken = parsed.access_token || parsed.accessToken;
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }
        } catch (e) {
          console.warn('[AdminStoreProducts] Could not parse auth data:', e);
        }
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/store_products?order=created_at.desc&select=*`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[AdminStoreProducts] Products fetched:', data?.length || 0);

      setProducts(data || []);
    } catch (error) {
      console.error('[AdminStoreProducts] Error fetching products:', error);
      toast.error(`Failed to load products: ${error.message || 'Unknown error'}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    });
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Not logged in. Please refresh the page and log in again.');
      return;
    }

    if (!formData.name || !formData.price_nzd) {
      toast.error('Product name and price are required');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        price_nzd: parseFloat(formData.price_nzd),
        image_url: formData.image_url || null,
        category: formData.category || 'Books',
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        is_active: formData.is_active
      };

      console.log('Saving product:', productData);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Get auth token
      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const authData = localStorage.getItem(storageKey);

      let accessToken = null;
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          accessToken = parsed.access_token || parsed.accessToken;
        } catch (e) {
          console.error('Failed to parse auth data:', e);
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      let response;
      if (editingProduct) {
        // Update existing product
        response = await fetch(`${supabaseUrl}/rest/v1/store_products?id=eq.${editingProduct.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(productData)
        });
      } else {
        // Create new product
        response = await fetch(`${supabaseUrl}/rest/v1/store_products`, {
          method: 'POST',
          headers,
          body: JSON.stringify(productData)
        });
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || response.statusText);
      }

      toast.success(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      resetForm();
      fetchAllProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Failed to save product: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price_nzd: product.price_nzd.toString(),
      image_url: product.image_url || '',
      category: product.category || 'Books',
      stock_quantity: product.stock_quantity || 0,
      is_active: product.is_active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const authData = localStorage.getItem(storageKey);

      let accessToken = null;
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          accessToken = parsed.access_token || parsed.accessToken;
        } catch (e) {
          console.error('Failed to parse auth data:', e);
        }
      }

      const headers = {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/store_products?id=eq.${id}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }

      toast.success('Product deleted successfully');
      fetchAllProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const authData = localStorage.getItem(storageKey);

      let accessToken = null;
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          accessToken = parsed.access_token || parsed.accessToken;
        } catch (e) {
          console.error('Failed to parse auth data:', e);
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/store_products?id=eq.${product.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_active: !product.is_active })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      toast.success(`Product ${!product.is_active ? 'activated' : 'deactivated'} successfully`);
      fetchAllProducts();
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast.error('Failed to update product status');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price_nzd: '',
      image_url: '',
      category: 'Books',
      stock_quantity: 0,
      is_active: true
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <img src="/favicon.svg" alt="Al-Falaah Logo" className="h-12 w-12 mx-auto mb-4" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || !profile.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Store Admin - Products</h2>
          <p className="text-red-600 mb-4">You do not have admin access to the store.</p>
          <Link to="/" className="text-emerald-600 hover:text-emerald-700">
            ← Back to Home
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/favicon.svg" alt="Al-Falaah Logo" className="h-8 w-8" />
              <div className="flex flex-col leading-none -space-y-1">
                <span className="text-xs sm:text-sm font-semibold text-gray-900" style={{letterSpacing: "0.0005em"}}>The FastTrack</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900" style={{letterSpacing: "0.28em"}}>Madrasah</span>
                <span className="text-xs text-gray-500 mt-0.5">Store Admin - Products</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/admin/store-orders" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors hidden sm:inline">
                View Orders
              </Link>
              <Link to="/store" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors hidden sm:inline">
                View Store
              </Link>
              <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <button onClick={signOut} className="text-sm text-gray-600 hover:text-red-600 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Package className="h-8 w-8 text-emerald-600" />
            Store Products Management
          </h1>
          <p className="text-gray-600">Add and manage products for the online store</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingProduct ? 'Edit Product' : 'New Product'}
              </h2>

              {/* Product Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              {/* Slug */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="product-url-slug"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL: /store/{formData.slug || 'product-slug'}
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Product description..."
                />
              </div>

              {/* Price and Category Row */}
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (NZD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_nzd}
                    onChange={(e) => setFormData({ ...formData, price_nzd: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              {/* Image URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image URL
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://..."
                />
                {formData.image_url && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Product is active (visible to customers)</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Products List Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">All Products</h2>

              {loading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : products.length === 0 ? (
                <p className="text-gray-500 text-sm">No products yet</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors"
                    >
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-24 object-cover rounded-md mb-2"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
                          {product.name}
                        </h3>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            product.is_active ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                          title={product.is_active ? 'Active' : 'Inactive'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              product.is_active ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 mb-2 space-y-1">
                        <p>Price: ${product.price_nzd}</p>
                        <p>Stock: {product.stock_quantity}</p>
                        <p>Category: {product.category}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStoreProducts;
