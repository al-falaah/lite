import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Pages
import LandingPage from './pages/LandingPage';
import Programs from './pages/Programs';
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
import StoreAdmin from './pages/StoreAdmin';
import AdminRoles from './pages/AdminRoles';
import DirectorDashboard from './pages/DirectorDashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFoundPage from './pages/NotFoundPage';

// Components
import CountdownBanner from './components/CountdownBanner';

// Layout
import AdminRoute from './components/common/AdminRoute';
import RoleRoute from './components/common/RoleRoute';

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
            <Route path="/programs" element={<Programs />} />
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

            {/* Protected Blog Admin Route - blog_admin or director */}
            <Route
              path="/blog/admin"
              element={
                <RoleRoute allowedRoles={['blog_admin', 'director']}>
                  <BlogAdmin />
                </RoleRoute>
              }
            />

            {/* Director Dashboard - director only */}
            <Route
              path="/director"
              element={
                <RoleRoute allowedRoles={['director']}>
                  <DirectorDashboard />
                </RoleRoute>
              }
            />

            {/* Admin Route - madrasah_admin or director */}
            <Route
              path="/admin"
              element={
                <RoleRoute allowedRoles={['madrasah_admin', 'director']}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />

            {/* Store Admin Route - store_admin or director */}
            <Route
              path="/store/admin"
              element={
                <RoleRoute allowedRoles={['store_admin', 'director']}>
                  <StoreAdmin />
                </RoleRoute>
              }
            />

            {/* Admin Roles Management - director only */}
            <Route
              path="/admin/roles"
              element={
                <RoleRoute allowedRoles={['director']}>
                  <AdminRoles />
                </RoleRoute>
              }
            />

            {/* Fallback - 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Toaster position="top-right" duration={3000} />
          <Analytics />
          <SpeedInsights />
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;