import React, { useEffect, useRef, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from './app/store';
import { fetchCurrentUser } from './features/auth/authSlice';

// Layout
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load all pages for Code Splitting
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const AssetsPage = React.lazy(() => import('./pages/assets/AssetsPage'));
const AssetDetailPage = React.lazy(() => import('./pages/assets/AssetDetailPage'));
const CreateAssetPage = React.lazy(() => import('./pages/assets/CreateAssetPage'));
const UnifiedBookingsPage = React.lazy(() => import('./pages/bookings/UnifiedBookingsPage'));
const BookingDetailPage = React.lazy(() => import('./pages/bookings/BookingDetailPage'));
const CreateBookingPage = React.lazy(() => import('./pages/bookings/CreateBookingPage'));
const ContractDetailPage = React.lazy(() => import('./pages/bookings/ContractDetailPage'));
const RidesPage = React.lazy(() => import('./pages/rides/RidesPage'));
const RideDetailPage = React.lazy(() => import('./pages/rides/RideDetailPage'));
const CreateRidePage = React.lazy(() => import('./pages/rides/CreateRidePage'));
const RideBookingDetailPage = React.lazy(() => import('./pages/rides/RideBookingDetailPage'));
const MessagesPage = React.lazy(() => import('./pages/messages/MessagesPage'));
const ThreadPage = React.lazy(() => import('./pages/messages/ThreadPage'));
const NotificationsPage = React.lazy(() => import('./pages/notifications/NotificationsPage'));
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PaymentsPage = React.lazy(() => import('./pages/profile/PaymentsPage'));
const SettingsPage = React.lazy(() => import('./pages/profile/SettingsPage'));
const PublicProfilePage = React.lazy(() => import('./pages/profile/PublicProfilePage'));
const SearchPage = React.lazy(() => import('./pages/search/SearchPage'));
const FAQPage = React.lazy(() => import('./pages/faq/FAQPage'));
const RegisterVehiclePage = React.lazy(() => import('./pages/rides/RegisterVehiclePage'));
const MyVehiclesPage = React.lazy(() => import('./pages/rides/MyVehiclesPage'));
const VehicleManagePage = React.lazy(() => import('./pages/rides/VehicleManagePage'));
const TaskDashboard = React.lazy(() => import('./pages/staff/TaskDashboard'));
const RideManifestPage = React.lazy(() => import('./pages/rides/RideManifestPage'));
const RideEditPage = React.lazy(() => import('./pages/rides/RideEditPage'));
const BusinessDashboard = React.lazy(() => import('./pages/business/BusinessDashboard'));
const UpgradePage = React.lazy(() => import('./pages/business/UpgradePage'));
const PlusDashboard = React.lazy(() => import('./pages/plus/PlusDashboard'));
const BusinessRegistrationForm = React.lazy(() => import('./pages/business/BusinessRegistrationForm'));
const MyListingsPage = React.lazy(() => import('./pages/plus/MyListingsPage'));

// Fallback loader for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useSelector((state: RootState) => state.auth);

  if (isLoading && !user) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const fetched = useRef(false);

  useEffect(() => {
    // Unconditionally fetch current user on mount to check HttpOnly cookie session
    if (!fetched.current) {
      dispatch(fetchCurrentUser());
      fetched.current = true;
    }
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/assets/:id" element={<AssetDetailPage />} />
            <Route path="/assets/create" element={<CreateAssetPage />} />
            <Route path="/bookings" element={<UnifiedBookingsPage />} />
            <Route path="/bookings/new" element={<CreateBookingPage />} />
            <Route path="/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/contracts/:id" element={<ContractDetailPage />} />
            <Route path="/rides" element={<RidesPage />} />
            <Route path="/rides/create" element={<CreateRidePage />} />
            <Route path="/rides/:id" element={<RideDetailPage />} />
            <Route path="/rides/:id/edit" element={<RideEditPage />} />
            <Route path="/rides/:id/manifest" element={<RideManifestPage />} />
            <Route path="/rides/bookings/:id" element={<RideBookingDetailPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:threadId" element={<ThreadPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/vehicles" element={<MyVehiclesPage />} />
            <Route path="/vehicles/register" element={<RegisterVehiclePage />} />
            <Route path="/vehicles/:id/manage" element={<VehicleManagePage />} />
            <Route path="/business" element={<BusinessDashboard />} />
            <Route path="/business/register" element={<BusinessRegistrationForm />} />
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="/plus" element={<PlusDashboard />} />
            <Route path="/staff/tasks" element={<TaskDashboard />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/users/:userId" element={<PublicProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
