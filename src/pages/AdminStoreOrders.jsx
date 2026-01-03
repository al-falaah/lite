import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const AdminStoreOrders = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Store Orders</h1>
        <p className="text-gray-600 mb-6">Coming soon - Order management interface</p>
        <Link to="/admin/store-products" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
          ← Back to Products
        </Link>
      </div>
    </div>
  );
};

export default AdminStoreOrders;
