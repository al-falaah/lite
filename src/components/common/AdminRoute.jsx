import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wine-50 to-wine-50">
        <div className="text-center">
          <div className="mb-4">
            <h1 className="text-3xl font-brand font-bold text-wine-600">The FastTrack Madrasah</h1>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // AdminDashboard will handle its own authentication UI
  return children;
};

export default AdminRoute;