import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  ShoppingBag,
  LogOut,
  Save,
  Trash2,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const CATEGORIES = ['Books', 'Souvenirs', 'Other'];

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  invoice_sent: { label: 'Invoice Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const StoreAdmin = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'products';

  // Determine back link based on user role
  const backLink = profile?.role === 'director' ? '/director' : '/admin';

  // Helper function to get authenticated headers
  const getAuthHeaders = async () => {
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session?.session?.access_token;

    if (!accessToken) {
      throw new Error('No access token available');
    }

    return {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_nzd: '',
    image_url: '',
    category: 'Books',
    stock_quantity: 0,
    is_active: true
  });

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, statusFilter]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const switchTab = (tab) => {
    setSearchParams({ tab });
  };

  // ============================================
  // PRODUCTS FUNCTIONS
  // ============================================

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${supabaseUrl}/rest/v1/store_products?order=created_at.desc`, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setProductsLoading(false);
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

  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setProductFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (name === 'name' && !editingProduct) {
      setProductFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!productFormData.name || !productFormData.price_nzd) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      headers['Prefer'] = 'return=representation';

      const productData = {
        ...productFormData,
        price_nzd: parseFloat(productFormData.price_nzd),
        stock_quantity: parseInt(productFormData.stock_quantity) || 0
      };

      if (editingProduct) {
        const response = await fetch(`${supabaseUrl}/rest/v1/store_products?id=eq.${editingProduct.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(productData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Update error:', response.status, errorText);
          throw new Error('Failed to update product');
        }
        toast.success('Product updated successfully');
      } else {
        const response = await fetch(`${supabaseUrl}/rest/v1/store_products`, {
          method: 'POST',
          headers,
          body: JSON.stringify(productData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Create error:', response.status, errorText);
          throw new Error('Failed to create product');
        }
        toast.success('Product created successfully');
      }

      resetProductForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price_nzd: product.price_nzd,
      image_url: product.image_url || '',
      category: product.category,
      stock_quantity: product.stock_quantity,
      is_active: product.is_active
    });
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${supabaseUrl}/rest/v1/store_products?id=eq.${productId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete error:', response.status, errorText);
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductFormData({
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

  // ============================================
  // ORDERS FUNCTIONS
  // ============================================

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const headers = await getAuthHeaders();

      let url = `${supabaseUrl}/rest/v1/store_orders?select=*,items:store_order_items(*)&order=created_at.desc`;

      if (statusFilter !== 'all') {
        url += `&status=eq.${statusFilter}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch orders error:', response.status, errorText);
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      const headers = await getAuthHeaders();
      headers['Prefer'] = 'return=representation';

      // Sanitize numeric fields: convert empty strings to null
      const sanitizedUpdates = { ...updates };
      if (sanitizedUpdates.shipping_cost_nzd === '') {
        sanitizedUpdates.shipping_cost_nzd = null;
      }
      if (sanitizedUpdates.total_nzd === '') {
        sanitizedUpdates.total_nzd = null;
      }

      const order = orders.find(o => o.id === orderId);
      if (sanitizedUpdates.shipping_cost_nzd !== undefined && order) {
        sanitizedUpdates.total_nzd = parseFloat(order.subtotal_nzd) + parseFloat(sanitizedUpdates.shipping_cost_nzd || 0);
      }

      if (sanitizedUpdates.status === 'invoice_sent' && !order?.invoice_sent_at) {
        sanitizedUpdates.invoice_sent_at = new Date().toISOString();
      }
      if (sanitizedUpdates.status === 'paid' && !order?.paid_at) {
        sanitizedUpdates.paid_at = new Date().toISOString();
      }
      if (sanitizedUpdates.status === 'shipped' && !order?.shipped_at) {
        sanitizedUpdates.shipped_at = new Date().toISOString();
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/store_orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(sanitizedUpdates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update order error:', response.status, errorText);
        throw new Error('Failed to update order');
      }

      toast.success('Order updated successfully');
      setEditingOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const startEditingOrder = (order) => {
    setEditingOrder({
      id: order.id,
      shipping_cost_nzd: order.shipping_cost_nzd || '',
      status: order.status,
      payment_method: order.payment_method || '',
      payment_reference: order.payment_reference || '',
      tracking_number: order.tracking_number || '',
      admin_notes: order.admin_notes || ''
    });
  };

  const cancelEditingOrder = () => {
    setEditingOrder(null);
  };

  const saveEditingOrder = () => {
    if (editingOrder) {
      const { id, ...updates } = editingOrder;
      handleUpdateOrder(id, updates);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <Helmet>
        <title>Store Admin | The FastTrack Madrasah</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-8 w-8 text-emerald-600" />
                  <h1 className="text-2xl font-bold text-gray-900">Store Admin</h1>
                </div>
                <Link
                  to={backLink}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              <button
                onClick={() => switchTab('products')}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="h-5 w-5" />
                Products
              </button>
              <button
                onClick={() => switchTab('orders')}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'orders'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingBag className="h-5 w-5" />
                Orders
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'products' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Products Management</h2>
                <p className="text-gray-600">Add and manage products for the online store</p>
              </div>

              {productsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Product Form */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">
                        {editingProduct ? 'Edit Product' : 'New Product'}
                      </h3>
                      <form onSubmit={handleSaveProduct} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={productFormData.name}
                            onChange={handleProductFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug (URL-friendly name)
                          </label>
                          <input
                            type="text"
                            name="slug"
                            value={productFormData.slug}
                            onChange={handleProductFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={productFormData.description}
                            onChange={handleProductFormChange}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Price (NZD) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              name="price_nzd"
                              value={productFormData.price_nzd}
                              onChange={handleProductFormChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Stock Quantity
                            </label>
                            <input
                              type="number"
                              name="stock_quantity"
                              value={productFormData.stock_quantity}
                              onChange={handleProductFormChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            name="category"
                            value={productFormData.category}
                            onChange={handleProductFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image URL
                          </label>
                          <input
                            type="url"
                            name="image_url"
                            value={productFormData.image_url}
                            onChange={handleProductFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          {productFormData.image_url && (
                            <img
                              src={productFormData.image_url}
                              alt="Preview"
                              className="mt-2 h-32 w-32 object-cover rounded-lg"
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={productFormData.is_active}
                            onChange={handleProductFormChange}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                          <label className="text-sm font-medium text-gray-700">
                            Active (visible in store)
                          </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button type="submit" className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            {editingProduct ? 'Update Product' : 'Create Product'}
                          </Button>
                          {editingProduct && (
                            <Button type="button" variant="secondary" onClick={resetProductForm}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Product List */}
                  <div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        All Products ({products.length})
                      </h3>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {products.map(product => (
                          <div
                            key={product.id}
                            className="border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors"
                          >
                            <div className="flex gap-3">
                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-16 w-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                                <p className="text-sm text-gray-600">${parseFloat(product.price_nzd).toFixed(2)}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">{product.category}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {product.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="flex-1 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Orders Management</h2>
                <p className="text-gray-600">View and manage customer orders</p>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending Review</option>
                    <option value="invoice_sent">Invoice Sent</option>
                    <option value="paid">Paid</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <span className="text-sm text-gray-500">
                    {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                  </span>
                </div>
              </div>

              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600">
                    {statusFilter === 'all'
                      ? 'No customer orders have been submitted yet.'
                      : `No orders with status "${statusConfig[statusFilter]?.label}".`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const isEditing = editingOrder?.id === order.id;
                    const StatusIcon = statusConfig[order.status]?.icon || Clock;

                    return (
                      <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* Order Header */}
                        <div
                          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleOrderExpansion(order.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{order.order_number}</h3>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig[order.status]?.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Mail className="h-4 w-4" />
                                  {order.customer_name}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(order.created_at)}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Package className="h-4 w-4" />
                                  {order.items?.length || 0} items
                                </div>
                                <div className="flex items-center gap-2 font-semibold text-emerald-600">
                                  <DollarSign className="h-4 w-4" />
                                  {order.total_nzd ? formatCurrency(order.total_nzd) : formatCurrency(order.subtotal_nzd)}
                                </div>
                              </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 ml-4">
                              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Order Details - Expanded */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 p-6 bg-gray-50">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Left: Items & Customer Info */}
                              <div className="space-y-6">
                                {/* Order Items */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Items</h4>
                                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                                    {order.items?.map((item) => (
                                      <div key={item.id} className="p-3 flex justify-between items-center">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">{item.product_name}</p>
                                          <p className="text-sm text-gray-600">
                                            {formatCurrency(item.product_price_nzd)} × {item.quantity}
                                          </p>
                                        </div>
                                        <p className="font-semibold text-gray-900">
                                          {formatCurrency(item.subtotal_nzd)}
                                        </p>
                                      </div>
                                    ))}
                                    <div className="p-3 bg-emerald-50">
                                      <div className="flex justify-between items-center font-semibold text-gray-900">
                                        <span>Subtotal</span>
                                        <span className="text-emerald-600">{formatCurrency(order.subtotal_nzd)}</span>
                                      </div>
                                      {order.shipping_cost_nzd && (
                                        <>
                                          <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                                            <span>Shipping</span>
                                            <span>{formatCurrency(order.shipping_cost_nzd)}</span>
                                          </div>
                                          <div className="flex justify-between items-center font-bold text-gray-900 mt-2 pt-2 border-t border-emerald-200">
                                            <span>Total</span>
                                            <span className="text-emerald-600">{formatCurrency(order.total_nzd)}</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Customer Info */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h4>
                                  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <a href={`mailto:${order.customer_email}`} className="text-sm text-emerald-600 hover:text-emerald-700">
                                          {order.customer_email}
                                        </a>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <a href={`tel:${order.customer_phone}`} className="text-sm text-gray-900">
                                          {order.customer_phone}
                                        </a>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500">WhatsApp</p>
                                        <a
                                          href={`https://wa.me/${order.customer_whatsapp.replace(/[^0-9]/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-emerald-600 hover:text-emerald-700"
                                        >
                                          {order.customer_whatsapp}
                                        </a>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500">Delivery Address</p>
                                        <p className="text-sm text-gray-900">
                                          {order.delivery_address_line1}<br />
                                          {order.delivery_address_line2 && <>{order.delivery_address_line2}<br /></>}
                                          {order.delivery_city}, {order.delivery_postal_code}<br />
                                          {order.delivery_country}
                                        </p>
                                      </div>
                                    </div>
                                    {order.customer_notes && (
                                      <div className="pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">Customer Notes</p>
                                        <p className="text-sm text-gray-900 italic">{order.customer_notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Admin Controls */}
                              <div className="space-y-6">
                                {isEditing ? (
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Edit Order Details</h4>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Shipping Cost (NZD)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={editingOrder.shipping_cost_nzd}
                                          onChange={(e) => setEditingOrder({ ...editingOrder, shipping_cost_nzd: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                          placeholder="0.00"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Order Status
                                        </label>
                                        <select
                                          value={editingOrder.status}
                                          onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                          <option value="pending">Pending Review</option>
                                          <option value="invoice_sent">Invoice Sent</option>
                                          <option value="paid">Paid</option>
                                          <option value="shipped">Shipped</option>
                                          <option value="delivered">Delivered</option>
                                          <option value="cancelled">Cancelled</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Payment Method
                                        </label>
                                        <input
                                          type="text"
                                          value={editingOrder.payment_method}
                                          onChange={(e) => setEditingOrder({ ...editingOrder, payment_method: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                          placeholder="e.g., Bank Transfer, Stripe"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Payment Reference
                                        </label>
                                        <input
                                          type="text"
                                          value={editingOrder.payment_reference}
                                          onChange={(e) => setEditingOrder({ ...editingOrder, payment_reference: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                          placeholder="Transaction ID"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Tracking Number
                                        </label>
                                        <input
                                          type="text"
                                          value={editingOrder.tracking_number}
                                          onChange={(e) => setEditingOrder({ ...editingOrder, tracking_number: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                          placeholder="Tracking number"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Admin Notes
                                        </label>
                                        <textarea
                                          value={editingOrder.admin_notes}
                                          onChange={(e) => setEditingOrder({ ...editingOrder, admin_notes: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                          rows="3"
                                          placeholder="Internal notes..."
                                        />
                                      </div>

                                      <div className="flex gap-2 pt-2">
                                        <button
                                          onClick={saveEditingOrder}
                                          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                        >
                                          Save Changes
                                        </button>
                                        <button
                                          onClick={cancelEditingOrder}
                                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Order Status</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Current Status:</span>
                                          <span className={`font-medium ${statusConfig[order.status]?.color.replace('bg-', 'text-').replace('-100', '-700')}`}>
                                            {statusConfig[order.status]?.label}
                                          </span>
                                        </div>
                                        {order.invoice_sent_at && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Invoice Sent:</span>
                                            <span className="text-gray-900">{formatDate(order.invoice_sent_at)}</span>
                                          </div>
                                        )}
                                        {order.paid_at && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Paid:</span>
                                            <span className="text-gray-900">{formatDate(order.paid_at)}</span>
                                          </div>
                                        )}
                                        {order.shipped_at && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Shipped:</span>
                                            <span className="text-gray-900">{formatDate(order.shipped_at)}</span>
                                          </div>
                                        )}
                                        {order.payment_method && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Method:</span>
                                            <span className="text-gray-900">{order.payment_method}</span>
                                          </div>
                                        )}
                                        {order.tracking_number && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Tracking:</span>
                                            <span className="text-gray-900">{order.tracking_number}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {order.admin_notes && (
                                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Admin Notes</h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.admin_notes}</p>
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      <button
                                        onClick={() => startEditingOrder(order)}
                                        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                      >
                                        Edit Order Details
                                      </button>
                                      <div className="space-y-2">
                                        <button
                                          onClick={() => toast.info('Invoices are sent via Stripe')}
                                          className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
                                        >
                                          <Send className="h-4 w-4" />
                                          Send Stripe Invoice
                                        </button>
                                        <p className="text-xs text-gray-500 text-center">
                                          Invoices are sent via Stripe payment links
                                        </p>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StoreAdmin;
