import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { logout, updateUser } from '../../features/auth/authSlice';
import { fetchThreads, fetchUnreadCount } from '../../features/messaging/messagingSlice';
import { fetchNotifications } from '../../features/notifications/notificationsSlice';
import {
  MessageCircle, Bell, User, LogOut, Menu, X,
  Home, Car, Briefcase, Plus, Search, Settings,
  Calendar, Shield, CreditCard, Globe, Facebook, Twitter, Instagram, Linkedin, CheckCircle, Heart, Building2, ChevronRight, Sparkles, Crown
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import VerificationBadge from '../ui/VerificationBadge';
import { getMediaUrl } from '../../utils/media';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { useCurrency, CurrencyCode } from '../../context/CurrencyContext';
import { useNotificationWebSocket } from '../../features/notifications/useNotificationWebSocket';
import Footer from './Footer';

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currency, setCurrency, availableCurrencies } = useCurrency();

  // Start notification WebSocket
  useNotificationWebSocket();

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { unreadCount: messageUnreadCount } = useSelector((state: RootState) => state.messaging);
  const { unreadCount: notificationUnreadCount } = useSelector((state: RootState) => state.notifications);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // Refs for click-outside detection
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (isNotificationOpen && notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
      if (isCreateMenuOpen && createMenuRef.current && !createMenuRef.current.contains(target)) {
        setIsCreateMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isNotificationOpen, isCreateMenuOpen]);

  // Dynamic staff check
  const isStaff = !!(user?.is_staff || user?.is_superuser || (user?.roles && Array.isArray(user.roles) && user.roles.length > 0));

  useEffect(() => {
    if (user && user.is_staff !== isStaff) {
      dispatch(updateUser({ ...user, is_staff: isStaff }));
    }
  }, [user, isStaff, dispatch]);
  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch to get counts
      dispatch(fetchThreads({}) as any);
      dispatch(fetchNotifications({}) as any);
      dispatch(fetchUnreadCount() as any);
    }
  }, [dispatch, isAuthenticated]);

  const isMessagingPage = location.pathname.startsWith('/messages/');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Dynamic checks
  const isCorporateVerified = user?.corporate_profile?.verification_status === 'VERIFIED';
  const businessCategory = user?.corporate_profile?.business_category;

  // Tier-derived helpers
  const accountTier = user?.account_tier || 'FREE';
  // Effective tier: staff have no tier upgrades, legacy users with corporate_profile are BUSINESS
  const effectiveTier = isStaff ? 'STAFF' : (user?.corporate_profile ? 'BUSINESS' : accountTier);

  // Primary navigation - main features
  const primaryNav = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Assets', href: '/assets', icon: Briefcase },
    { name: 'Rides', href: '/rides', icon: Car },
    // Tier-conditional business link
    ...(effectiveTier === 'PLUS'
      ? [{ name: 'Plus', href: '/plus', icon: Sparkles }]
      : effectiveTier === 'BUSINESS'
        ? [{ name: businessCategory === 'RIDE' ? 'Ride Business' : 'Asset Business', href: '/business', icon: Building2 }]
        : []),
    ...(isStaff ? [{ name: 'Staff', href: '/staff/tasks', icon: Shield }] : []),
  ];

  // Secondary navigation - user actions (only when authenticated)
  const secondaryNav = isAuthenticated ? [
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Messages', href: '/messages', icon: MessageCircle, badge: messageUnreadCount },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: notificationUnreadCount },
  ] : [];

  // Create actions (only when authenticated and user is allowed)
  const createActions = (isAuthenticated && (!isStaff || user?.is_superuser)) ? [
    { name: 'List Asset', href: '/assets/create', icon: Plus },
    { name: 'Offer Ride', href: '/rides/create', icon: Car },
  ] : [];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo and Primary Nav */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900 hidden md:block">KIBOSS</span>
              </Link>

              {/* Desktop Primary Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
                {primaryNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <item.icon className="h-4 w-4 mr-1.5" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Center - Create Actions Dropdown (Desktop) */}
            <div className="hidden lg:flex items-center" ref={createMenuRef}>
              {createActions.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black bg-gray-900 text-white hover:bg-black transition-all shadow-lg shadow-gray-200"
                  >
                    <Plus className="h-4 w-4" />
                    Create
                    <ChevronRight className={`h-3 w-3 transition-transform ${isCreateMenuOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {isCreateMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl py-2 z-50 ring-1 ring-gray-100 animate-in fade-in zoom-in-95 duration-200">
                      {createActions.map((action) => (
                        <Link
                          key={action.name}
                          to={action.href}
                          onClick={() => setIsCreateMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                        >
                          <action.icon className="h-4 w-4 mr-2" />
                          {action.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right side - Secondary Nav and User Menu */}
            <div className="flex items-center space-x-2">
              {/* Desktop Secondary Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {secondaryNav.map((item) => (
                  item.name === 'Notifications' ? (
                    <div key={item.name} className="relative" ref={notificationRef}>
                      <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className={`relative inline-flex items-center p-2 rounded-lg transition-colors ${isActive(item.href) || isNotificationOpen
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        title={item.name}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full min-w-[18px] text-center">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </button>
                      <NotificationDropdown
                        isOpen={isNotificationOpen}
                        onClose={() => setIsNotificationOpen(false)}
                      />
                    </div>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`relative inline-flex items-center p-2 rounded-lg transition-colors ${isActive(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      title={item.name}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full min-w-[18px] text-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  )
                ))}
              </div>

              {/* User menu */}
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    data-testid="user-menu-button"
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {user.profile?.avatar ? (
                      <img
                        src={getMediaUrl(user.profile.avatar)}
                        alt={user.first_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div className="hidden md:block text-left">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-black text-gray-900">{user.first_name}</p>
                        {isStaff && (
                          <span className="bg-primary-600 text-white text-[8px] font-black px-1 rounded-sm  tracking-tighter">Staff</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <VerificationBadge
                          tier={user.verification_badge?.tier}
                          color={user.verification_badge?.color}
                          size="xs"
                        />
                      </div>
                    </div>
                  </button>

                  {/* User dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                      <Link to="/my-listings" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        My Listings
                      </Link>
                      {/* Tier-Conditional Section */}
                      {effectiveTier === 'FREE' && (
                        <Link
                          to="/upgrade"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mx-2 my-1 rounded-lg"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Upgrade Plan
                        </Link>
                      )}
                      {effectiveTier === 'PLUS' && (
                        <Link
                          to="/plus"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 mx-2 my-1 rounded-lg"
                        >
                          <Crown className="h-3.5 w-3.5 mr-2" />
                          Plus Dashboard
                        </Link>
                      )}
                      {effectiveTier === 'BUSINESS' && (
                        <Link
                          to="/business"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 font-bold bg-gray-50 hover:bg-gray-100"
                        >
                          <Building2 className="h-4 w-4 mr-2 text-primary-600" />
                          {isCorporateVerified
                            ? (businessCategory === 'RIDE' ? 'Ride Business' : 'Asset Business')
                            : 'Verification Pending'}
                        </Link>
                      )}
                      {isStaff && (
                        <Link
                          to="/staff/tasks"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-primary-700 font-black bg-primary-50 hover:bg-primary-100 border-y border-primary-100"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Staff Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Scroll to wishlist section if already on profile
                          setTimeout(() => {
                            const wishlist = document.getElementById('wishlist-section');
                            wishlist?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Heart className="h-4 w-4 mr-2 text-red-500" />
                        My Wishlist
                      </Link>
                      <Link
                        to="/payments"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payments & Wallet
                      </Link>
                      <Link
                        to="/bookings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        My Bookings
                      </Link>
                      {(effectiveTier === 'PLUS' || effectiveTier === 'BUSINESS') && (
                        <Link
                          to="/bookings?tab=incoming_bookings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Incoming Bookings
                        </Link>
                      )}
                      <Link
                        to="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        title="Logout"
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {/* Primary Nav */}
              {primaryNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium ${isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}

              {/* Create Actions */}
              {createActions.length > 0 && (
                <>
                  <div className="pt-2 pb-1">
                    <p className="px-3 text-xs font-semibold text-gray-400  tracking-wider">Create</p>
                  </div>
                  {createActions.map((action) => (
                    <Link
                      key={action.name}
                      to={action.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-primary-600 hover:bg-primary-50"
                    >
                      <action.icon className="h-5 w-5 mr-3" />
                      {action.name}
                    </Link>
                  ))}
                </>
              )}

              {/* Secondary Nav */}
              <div className="pt-2 pb-1">
                <p className="px-3 text-xs font-semibold text-gray-400  tracking-wider">Account</p>
              </div>
              {secondaryNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium ${isActive(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}

              {/* User Actions */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-50"
                >
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </Link>
                {effectiveTier === 'FREE' && (
                  <Link
                    to="/upgrade"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2 rounded-lg text-base font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 mx-1 my-1"
                  >
                    <Sparkles className="h-5 w-5 mr-3" />
                    Upgrade Plan
                  </Link>
                )}
                {effectiveTier === 'PLUS' && (
                  <Link
                    to="/plus"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2 rounded-lg text-base font-bold text-purple-700 bg-purple-50 hover:bg-purple-100"
                  >
                    <Crown className="h-5 w-5 mr-3" />
                    Plus Dashboard
                  </Link>
                )}
                {effectiveTier === 'BUSINESS' && (
                  <Link
                    to="/business"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-primary-600 font-bold hover:bg-gray-50"
                  >
                    <Building2 className="h-5 w-5 mr-3" />
                    {isCorporateVerified
                      ? (businessCategory === 'RIDE' ? 'Ride Business' : 'Asset Business')
                      : 'Verification Pending'}
                  </Link>
                )}
                <Link
                  to="/payments"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-50"
                >
                  <CreditCard className="h-5 w-5 mr-3" />
                  Payments
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  title="Logout"
                  className="w-full flex items-center px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      {!isMessagingPage && <Footer />}
    </div>
  );
}
