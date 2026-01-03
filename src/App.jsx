import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';

// Pages
import LandingPage from './pages/LandingPage';
import ApplicationPage from './pages/ApplicationPage';
import PaymentUploadPage from './pages/PaymentUploadPage';
import StripePaymentPage from './pages/StripePaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import StudentPortal from './pages/StudentPortal';
import EnrollAdditionalProgram from './pages/EnrollAdditionalProgram';
import AdminDashboard from './pages/AdminDashboard';
import VacanciesPage from './pages/VacanciesPage';
import TeacherPortal from './pages/TeacherPortal';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogAdmin from './pages/BlogAdmin';
import Unsubscribe from './pages/Unsubscribe';
import StorePage from './pages/StorePage';
import StoreOrderPage from './pages/StoreOrderPage';
import StoreOrderConfirmation from './pages/StoreOrderConfirmation';
import AdminStoreProducts from './pages/AdminStoreProducts';
import AdminStoreOrders from './pages/AdminStoreOrders';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFoundPage from './pages/NotFoundPage';

// Components
import CountdownBanner from './components/CountdownBanner';

// Layout
import AdminRoute from './components/common/AdminRoute';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
          <CountdownBanner />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/apply" element={<ApplicationPage />} />
            <Route path="/payment" element={<StripePaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/payment-upload" element={<PaymentUploadPage />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/enroll-additional" element={<EnrollAdditionalProgram />} />
            <Route path="/vacancies" element={<VacanciesPage />} />
            <Route path="/teacher" element={<TeacherPortal />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/store/order" element={<StoreOrderPage />} />
            <Route path="/store/order-confirmation" element={<StoreOrderConfirmation />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Legacy route redirects */}
            <Route path="/student-portal" element={<Navigate to="/student" replace />} />
            <Route path="/teacher-portal" element={<Navigate to="/teacher" replace />} />

            {/* Protected Blog Admin Route */}
            <Route
              path="/blog/admin"
              element={
                <AdminRoute>
                  <BlogAdmin />
                </AdminRoute>
              }
            />

            {/* Admin Route - Login and Dashboard */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Admin Store Routes */}
            <Route
              path="/admin/store-products"
              element={
                <AdminRoute>
                  <AdminStoreProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/store-orders"
              element={
                <AdminRoute>
                  <AdminStoreOrders />
                </AdminRoute>
              }
            />

            {/* Fallback - 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Toaster position="top-right" duration={3000} />
          <Analytics />
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;