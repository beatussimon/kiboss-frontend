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
import { UpgradeRequiredModal } from './components/ui/UpgradeRequiredModal';

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
const UserDashboard = React.lazy(() => import('./pages/dashboard/UserDashboard'));
const UpgradePage = React.lazy(() => import('./pages/business/UpgradePage'));
const SubscriptionPage = React.lazy(() => import('./pages/subscription/SubscriptionPage'));
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
          <Route element={<ErrorBoundary><AuthLayout /></ErrorBoundary>}>
            <Route path="/login" element={<ErrorBoundary><PublicRoute><LoginPage /></PublicRoute></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary><PublicRoute><RegisterPage /></PublicRoute></ErrorBoundary>} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ErrorBoundary><ProtectedRoute><Layout /></ProtectedRoute></ErrorBoundary>}>
            <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
            <Route path="/assets" element={<ErrorBoundary><AssetsPage /></ErrorBoundary>} />
            <Route path="/assets/:id" element={<ErrorBoundary><AssetDetailPage /></ErrorBoundary>} />
            <Route path="/assets/create" element={<ErrorBoundary><CreateAssetPage /></ErrorBoundary>} />
            <Route path="/bookings" element={<ErrorBoundary><UnifiedBookingsPage /></ErrorBoundary>} />
            <Route path="/bookings/new" element={<ErrorBoundary><CreateBookingPage /></ErrorBoundary>} />
            <Route path="/bookings/:id" element={<ErrorBoundary><BookingDetailPage /></ErrorBoundary>} />
          <Route path="/terms" element={<ErrorBoundary><TermsPage /></ErrorBoundary>} />
            <Route path="/contracts/:id" element={<ErrorBoundary><ContractDetailPage /></ErrorBoundary>} />
            <Route path="/rides" element={<ErrorBoundary><RidesPage /></ErrorBoundary>} />
            <Route path="/rides/create" element={<ErrorBoundary><CreateRidePage /></ErrorBoundary>} />
            <Route path="/rides/:id" element={<ErrorBoundary><RideDetailPage /></ErrorBoundary>} />
            <Route path="/rides/:id/edit" element={<ErrorBoundary><RideEditPage /></ErrorBoundary>} />
            <Route path="/rides/:id/manifest" element={<ErrorBoundary><RideManifestPage /></ErrorBoundary>} />
            <Route path="/rides/bookings/:id" element={<ErrorBoundary><RideBookingDetailPage /></ErrorBoundary>} />
            <Route path="/messages" element={<ErrorBoundary><MessagesPage /></ErrorBoundary>} />
            <Route path="/messages/:threadId" element={<ErrorBoundary><ThreadPage /></ErrorBoundary>} />
            <Route path="/notifications" element={<ErrorBoundary><NotificationsPage /></ErrorBoundary>} />
            <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
            <Route path="/vehicles" element={<ErrorBoundary><MyVehiclesPage /></ErrorBoundary>} />
            <Route path="/vehicles/register" element={<ErrorBoundary><RegisterVehiclePage /></ErrorBoundary>} />
            <Route path="/vehicles/:id/manage" element={<ErrorBoundary><VehicleManagePage /></ErrorBoundary>} />
            <Route path="/dashboard" element={<ErrorBoundary><UserDashboard /></ErrorBoundary>} />
            <Route path="/business/register" element={<ErrorBoundary><BusinessRegistrationForm /></ErrorBoundary>} />
            <Route path="/upgrade" element={<ErrorBoundary><UpgradePage /></ErrorBoundary>} />
            <Route path="/subscription" element={<ErrorBoundary><SubscriptionPage /></ErrorBoundary>} />
            <Route path="/staff/tasks" element={<ErrorBoundary><TaskDashboard /></ErrorBoundary>} />
            <Route path="/payments" element={<ErrorBoundary><PaymentsPage /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            <Route path="/users/:userId" element={<ErrorBoundary><PublicProfilePage /></ErrorBoundary>} />
            <Route path="/search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
            <Route path="/faq" element={<ErrorBoundary><FAQPage /></ErrorBoundary>} />
            <Route path="/my-listings" element={<ErrorBoundary><MyListingsPage /></ErrorBoundary>} />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<ErrorBoundary><Navigate to="/" replace /></ErrorBoundary>} />
        </Routes>
      </Suspense>
      <UpgradeRequiredModal />
    </ErrorBoundary>
  );
}

export default App;
