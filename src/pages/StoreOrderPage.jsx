import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, AlertCircle, Package } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { storeOrders, storeOrderItems, supabaseUrl, supabaseAnonKey } from '../services/supabase';
import { toast } from 'sonner';

const COUNTRIES = [
  'New Zealand',
  'Australia',
  'United States',
  'United Kingdom',
  'Canada',
  'Other'
];

const StoreOrderPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerWhatsapp: '',
    deliveryAddressLine1: '',
    deliveryAddressLine2: '',
    deliveryCity: '',
    deliveryPostalCode: '',
    deliveryCountry: 'New Zealand',
    customerNotes: ''
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('store_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        if (parsedCart.length === 0) {
          toast.error('Your cart is empty');
          navigate('/store');
        }
      } catch (e) {
        console.error('Failed to parse cart:', e);
        navigate('/store');
      }
    } else {
      navigate('/store');
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(productId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCart(updatedCart);
    localStorage.setItem('store_cart', JSON.stringify(updatedCart));
  };

  const removeItem = (productId) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem('store_cart', JSON.stringify(updatedCart));

    if (updatedCart.length === 0) {
      toast.info('Cart is now empty');
      setTimeout(() => navigate('/store'), 1500);
    }
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.deliveryAddressLine1 || !formData.deliveryCity || !formData.deliveryPostalCode) {
      toast.error('Please complete your delivery address');
      return;
    }

    setLoading(true);

    try {
      const subtotal = getSubtotal();

      // Create order
      const orderData = {
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        customer_whatsapp: formData.customerWhatsapp || formData.customerPhone,
        delivery_address_line1: formData.deliveryAddressLine1,
        delivery_address_line2: formData.deliveryAddressLine2 || null,
        delivery_city: formData.deliveryCity,
        delivery_postal_code: formData.deliveryPostalCode,
        delivery_country: formData.deliveryCountry,
        customer_notes: formData.customerNotes || null,
        subtotal_nzd: subtotal,
        status: 'pending'
      };

      console.log('Creating order:', orderData);

      const { data: order, error: orderError } = await storeOrders.create(orderData);

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(orderError.message || 'Failed to create order');
      }

      console.log('Order created:', order);

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_price_nzd: item.price,
        quantity: item.quantity,
        subtotal_nzd: item.price * item.quantity
      }));

      const { error: itemsError } = await storeOrderItems.createMany(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        throw new Error(itemsError.message || 'Failed to create order items');
      }

      // Send admin notification
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-store-order-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({
            orderId: order.id,
            orderNumber: order.order_number
          })
        });
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the order if email fails
      }

      // Clear cart
      localStorage.removeItem('store_cart');

      // Navigate to confirmation with order number
      navigate('/store/order-confirmation', {
        state: {
          orderNumber: order.order_number,
          customerEmail: formData.customerEmail,
          items: cart,
          subtotal
        }
      });

      toast.success('Order submitted successfully!');
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error(error.message || 'Failed to submit order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Submit Order | The FastTrack Madrasah Store</title>
        <meta name="description" content="Complete your order for Islamic books and madrasah souvenirs" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to="/store" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-emerald-600" />
              Submit Your Order
            </h1>
            <p className="text-gray-600 mt-2">Review your items and provide delivery details</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Items */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Items</h2>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                      {/* Product Image */}
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${item.imageUrl ? 'hidden' : 'flex'}`}>
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                        <p className="text-emerald-600 font-bold mt-1">${item.price.toFixed(2)}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="+64 21 234 5678"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Number (optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.customerWhatsapp}
                      onChange={(e) => setFormData({ ...formData, customerWhatsapp: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Leave blank to use phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.deliveryAddressLine1}
                      onChange={(e) => setFormData({ ...formData, deliveryAddressLine1: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2 (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.deliveryAddressLine2}
                      onChange={(e) => setFormData({ ...formData, deliveryAddressLine2: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Apartment, suite, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.deliveryCity}
                      onChange={(e) => setFormData({ ...formData, deliveryCity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Auckland"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.deliveryPostalCode}
                      onChange={(e) => setFormData({ ...formData, deliveryPostalCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="1010"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      required
                      value={formData.deliveryCountry}
                      onChange={(e) => setFormData({ ...formData, deliveryCountry: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      {COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Notes (Optional)</h2>
                <textarea
                  value={formData.customerNotes}
                  onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Any special instructions or requests..."
                />
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-sm">Calculated later</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-emerald-600">${getSubtotal().toFixed(2)}*</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">*Plus shipping (to be calculated)</p>
                  </div>
                </div>

                {/* Delivery Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">What happens next?</p>
                      <ul className="space-y-1 text-xs">
                        <li>1. We'll review your order</li>
                        <li>2. Calculate delivery cost</li>
                        <li>3. Email you an invoice</li>
                        <li>4. You make payment</li>
                        <li>5. We ship your order</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Order Request'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By submitting, you agree to receive an invoice via email
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoreOrderPage;
