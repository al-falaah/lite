import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle, Mail, Package, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const StoreOrderConfirmation = () => {
  const location = useLocation();
  const { orderNumber, customerEmail, items, subtotal } = location.state || {};

  // Redirect if no order data
  if (!orderNumber) {
    return <Navigate to="/store" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Order Confirmed | The FastTrack Madrasah Store</title>
        <meta name="description" content="Your order has been successfully submitted" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle className="h-11 w-11 text-white" strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Order Submitted Successfully!
            </h1>
            <p className="text-base text-gray-600">
              Thank you for your order
            </p>
          </div>

          {/* Order Number */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6 shadow-sm">
            <div className="text-center mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Order Number</p>
              <p className="text-4xl font-bold text-emerald-600 mb-2">{orderNumber}</p>
              <p className="text-sm text-gray-500">
                Please save this number for your records
              </p>
            </div>

            {/* Confirmation Email Notice */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-lg p-4 flex gap-3">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Confirmation sent to:</p>
                <p className="break-all">{customerEmail}</p>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              What Happens Next?
            </h2>
            <ol className="space-y-5">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">We'll review your order</p>
                  <p className="text-sm text-gray-600 leading-relaxed">Our team will check product availability and your order details</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Calculate delivery cost</p>
                  <p className="text-sm text-gray-600 leading-relaxed">We'll determine the shipping cost based on your location and order weight</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Send you an invoice</p>
                  <p className="text-sm text-gray-600 leading-relaxed">You'll receive an email with the total cost including delivery and payment instructions</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">You make payment</p>
                  <p className="text-sm text-gray-600 leading-relaxed">Follow the payment instructions in the invoice email</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                  5
                </span>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">We'll ship your order</p>
                  <p className="text-sm text-gray-600 leading-relaxed">Once payment is confirmed, we'll prepare and ship your items</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Order Summary */}
          {items && items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Subtotal</span>
                  <span className="text-emerald-600">${subtotal?.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 text-right">
                  Shipping cost will be added to your invoice
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link
              to="/store"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-semibold shadow-sm hover:shadow-md"
            >
              Continue Shopping
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold"
            >
              Back to Home
            </Link>
          </div>

          {/* Support Notice */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Questions about your order?{' '}
              <a href="mailto:admin@tftmadrasah.nz" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoreOrderConfirmation;
