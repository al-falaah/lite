import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Package,
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
  Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  invoice_sent: { label: 'Invoice Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const AdminStoreOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const headers = {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      };

      if (token) {
        const authData = JSON.parse(token);
        if (authData?.currentSession?.access_token) {
          headers['Authorization'] = `Bearer ${authData.currentSession.access_token}`;
        }
      }

      let url = `${supabaseUrl}/rest/v1/store_orders?select=*,items:store_order_items(*)&order=created_at.desc`;

      if (statusFilter !== 'all') {
        url += `&status=eq.${statusFilter}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const headers = {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      if (token) {
        const authData = JSON.parse(token);
        if (authData?.currentSession?.access_token) {
          headers['Authorization'] = `Bearer ${authData.currentSession.access_token}`;
        }
      }

      // Auto-calculate total if shipping cost is provided
      const order = orders.find(o => o.id === orderId);
      if (updates.shipping_cost_nzd !== undefined && order) {
        updates.total_nzd = parseFloat(order.subtotal_nzd) + parseFloat(updates.shipping_cost_nzd || 0);
      }

      // Auto-set timestamps based on status changes
      if (updates.status === 'invoice_sent' && !order?.invoice_sent_at) {
        updates.invoice_sent_at = new Date().toISOString();
      }
      if (updates.status === 'paid' && !order?.paid_at) {
        updates.paid_at = new Date().toISOString();
      }
      if (updates.status === 'shipped' && !order?.shipped_at) {
        updates.shipped_at = new Date().toISOString();
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/store_orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
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

  const startEditing = (order) => {
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

  const cancelEditing = () => {
    setEditingOrder(null);
  };

  const saveEditing = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Store Orders | Admin</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Orders</h1>
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

          {/* Orders List */}
          {orders.length === 0 ? (
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
                    {/* Order Header - Always Visible */}
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
                          {/* Left Column - Order Items & Customer Info */}
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

                            {/* Customer Information */}
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
                                    <a href={`https://wa.me/${order.customer_whatsapp.replace(/[^0-9]/g, '')}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="text-sm text-emerald-600 hover:text-emerald-700">
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

                          {/* Right Column - Admin Controls */}
                          <div className="space-y-6">
                            {/* Edit Form */}
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
                                    {editingOrder.shipping_cost_nzd && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Total will be: {formatCurrency(parseFloat(order.subtotal_nzd) + parseFloat(editingOrder.shipping_cost_nzd || 0))}
                                      </p>
                                    )}
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
                                      placeholder="Transaction ID or reference number"
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
                                      placeholder="Shipping tracking number"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Admin Notes (Internal)
                                    </label>
                                    <textarea
                                      value={editingOrder.admin_notes}
                                      onChange={(e) => setEditingOrder({ ...editingOrder, admin_notes: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                      rows="3"
                                      placeholder="Internal notes about this order..."
                                    />
                                  </div>

                                  <div className="flex gap-2 pt-2">
                                    <button
                                      onClick={saveEditing}
                                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                    >
                                      Save Changes
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Order Status & Details */}
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
                                    {order.payment_reference && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Payment Ref:</span>
                                        <span className="text-gray-900">{order.payment_reference}</span>
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

                                {/* Admin Notes */}
                                {order.admin_notes && (
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Admin Notes</h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.admin_notes}</p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                  <button
                                    onClick={() => startEditing(order)}
                                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                  >
                                    Edit Order Details
                                  </button>
                                  <button
                                    onClick={() => toast('Invoice email feature coming soon')}
                                    className="w-full px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium flex items-center justify-center gap-2"
                                  >
                                    <Send className="h-4 w-4" />
                                    Send Invoice Email
                                  </button>
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
      </div>
    </>
  );
};

export default AdminStoreOrders;
