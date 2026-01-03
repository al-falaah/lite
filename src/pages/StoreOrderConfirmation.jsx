import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const StoreOrderConfirmation = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 mb-6">Coming soon - Order confirmation details</p>
        <Link to="/store" className="text-emerald-600 hover:text-emerald-700">
          ← Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default StoreOrderConfirmation;
