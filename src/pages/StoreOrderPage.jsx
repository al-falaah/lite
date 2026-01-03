import { Link } from 'react-router-dom';

const StoreOrderPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Submit Order</h1>
        <p className="text-gray-600 mb-6">Coming soon - Order submission form</p>
        <Link to="/store" className="text-emerald-600 hover:text-emerald-700">
          ← Back to Store
        </Link>
      </div>
    </div>
  );
};

export default StoreOrderPage;
