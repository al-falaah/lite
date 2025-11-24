import { useAuth } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // AdminDashboard will handle its own authentication UI
  return children;
};

export default AdminRoute;