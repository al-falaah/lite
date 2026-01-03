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

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Order Submitted Successfully!
            </h1>
            <p className="text-lg text-gray-600">
              Thank you for your order
            </p>
          </div>

          {/* Order Number */}
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200 mb-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Order Number</p>
              <p className="text-3xl font-bold text-emerald-600">{orderNumber}</p>
              <p className="text-sm text-gray-500 mt-2">
                Please save this number for your records
              </p>
            </div>

            {/* Confirmation Email Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Confirmation sent to:</p>
                <p>{customerEmail}</p>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-6 w-6 text-emerald-600" />
              What Happens Next?
            </h2>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <div>
                  <p className="font-semibold text-gray-900">We'll review your order</p>
                  <p className="text-sm text-gray-600">Our team will check product availability and your order details</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Calculate delivery cost</p>
                  <p className="text-sm text-gray-600">We'll determine the shipping cost based on your location and order weight</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Send you an invoice</p>
                  <p className="text-sm text-gray-600">You'll receive an email with the total cost including delivery and payment instructions</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
                <div>
                  <p className="font-semibold text-gray-900">You make payment</p>
                  <p className="text-sm text-gray-600">Follow the payment instructions in the invoice email</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                  5
                </span>
                <div>
                  <p className="font-semibold text-gray-900">We'll ship your order</p>
                  <p className="text-sm text-gray-600">Once payment is confirmed, we'll prepare and ship your items</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Order Summary */}
          {items && items.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
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
                <p className="text-xs text-gray-500 mt-1 text-right">
                  Shipping cost will be added to your invoice
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/store"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Continue Shopping
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back to Home
            </Link>
          </div>

          {/* Support Notice */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Questions about your order?{' '}
              <a href="mailto:admin@tftmadrasah.nz" className="text-emerald-600 hover:text-emerald-700 font-medium">
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
