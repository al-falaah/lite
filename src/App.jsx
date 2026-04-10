import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';

// Pages
import LandingPage from './pages/LandingPage';
import Programs from './pages/Programs';
import ApplicationPage from './pages/ApplicationPage';
import StripePaymentPage from './pages/StripePaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import StudentPortal from './pages/StudentPortal';
import EnrollAdditionalProgram from './pages/EnrollAdditionalProgram';
import AdminDashboard from './pages/AdminDashboard';
import VacanciesPage from './pages/VacanciesPage';
import TeacherPortal from './pages/TeacherPortal';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogAdmin from './pages/BlogAdmin';
import FAQs from './pages/FAQs';
import Unsubscribe from './pages/Unsubscribe';
import StorePage from './pages/StorePage';
import StoreOrderPage from './pages/StoreOrderPage';
import StoreOrderConfirmation from './pages/StoreOrderConfirmation';
import StoreAdmin from './pages/StoreAdmin';
import AdminRoles from './pages/AdminRoles';
import DirectorDashboard from './pages/DirectorDashboard';
import ResearchAdmin from './pages/ResearchAdmin';
import Resources from './pages/Resources';
import LessonNotes from './pages/LessonNotes';
import ChapterQuiz from './pages/ChapterQuiz';
import MilestoneTest from './pages/MilestoneTest';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyCertificate from './pages/VerifyCertificate';
import RegistrarHub from './pages/RegistrarHub';
import AcademicDeanHub from './pages/AcademicDeanHub';
import NotFoundPage from './pages/NotFoundPage';
import DrillManager from './components/drills/DrillManager';
import DrillHub from './components/drills/DrillHub';
import DrillPlayer from './components/drills/DrillPlayer';

// Components
import CountdownBanner from './components/CountdownBanner';
import FloatingWhatsApp from './components/FloatingWhatsApp';

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
            <Route path="/payment-cancel" element={<PaymentCancelPage />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/student/test/:programId/:type/:milestoneIndex?" element={<MilestoneTest />} />
            <Route path="/drills" element={<DrillHub />} />
            <Route path="/drills/play/:deckId" element={<DrillPlayer />} />
            <Route path="/enroll-additional" element={<EnrollAdditionalProgram />} />
            <Route path="/vacancies" element={<VacanciesPage />} />
            <Route path="/teacher" element={<TeacherPortal />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/:courseSlug" element={<LessonNotes />} />
            <Route path="/resources/:courseSlug/:chapterSlug/quiz" element={<ChapterQuiz />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/store/order" element={<StoreOrderPage />} />
            <Route path="/store/order-confirmation" element={<StoreOrderConfirmation />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/verify" element={<VerifyCertificate />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Legacy route redirects */}
            <Route path="/student-portal" element={<Navigate to="/login" replace />} />
            <Route path="/teacher-portal" element={<Navigate to="/login" replace />} />

            {/* Registrar Hub - registrar or director */}
            <Route
              path="/registrar"
              element={
                <RoleRoute allowedRoles={['registrar', 'director']}>
                  <RegistrarHub />
                </RoleRoute>
              }
            />

            {/* Academic Dean Hub - academic_dean or director */}
            <Route
              path="/academic-dean"
              element={
                <RoleRoute allowedRoles={['academic_dean', 'director']}>
                  <AcademicDeanHub />
                </RoleRoute>
              }
            />

            {/* Protected Blog Admin Route - academic_dean or director */}
            <Route
              path="/blog/admin"
              element={
                <RoleRoute allowedRoles={['academic_dean', 'director']}>
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

            {/* Admin Route - registrar or director */}
            <Route
              path="/admin"
              element={
                <RoleRoute allowedRoles={['registrar', 'director']}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />

            {/* Store Admin Route - registrar or director */}
            <Route
              path="/store/admin"
              element={
                <RoleRoute allowedRoles={['registrar', 'director']}>
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

            {/* Research Admin Route - academic_dean or director */}
            <Route
              path="/research/admin"
              element={
                <RoleRoute allowedRoles={['academic_dean', 'director']}>
                  <ResearchAdmin />
                </RoleRoute>
              }
            />

            {/* Drill Manager - academic_dean or director */}
            <Route
              path="/drills/manage"
              element={
                <RoleRoute allowedRoles={['academic_dean', 'director']}>
                  <DrillManager />
                </RoleRoute>
              }
            />

            {/* Fallback - 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Toaster position="top-right" duration={3000} closeButton />
          <Analytics />
          <FloatingWhatsApp />
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;