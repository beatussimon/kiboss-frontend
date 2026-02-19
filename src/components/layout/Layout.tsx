import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { logout } from '../../features/auth/authSlice';
import { fetchThreads } from '../../features/messaging/messagingSlice';
import { fetchNotifications } from '../../features/notifications/notificationsSlice';
import { 
  MessageCircle, Bell, User, LogOut, Menu, X, 
  Home, Car, Briefcase, Plus, Search, Settings,
  Calendar, Shield, CreditCard, Globe, Facebook, Twitter, Instagram, Linkedin, CheckCircle, Heart
} from 'lucide-react';
import { useState, useEffect } from 'react';
import VerificationBadge from '../ui/VerificationBadge';
import { getMediaUrl } from '../../utils/media';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { useCurrency, CurrencyCode } from '../../context/CurrencyContext';
import { useNotificationWebSocket } from '../../features/notifications/useNotificationWebSocket';

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

  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch to get counts
      dispatch(fetchThreads({}) as any);
      dispatch(fetchNotifications({}) as any);
    }
  }, [dispatch, isAuthenticated]);

  const isMessagingPage = location.pathname.startsWith('/messages/');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Primary navigation - main features
  const primaryNav = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Assets', href: '/assets', icon: Briefcase },
    { name: 'Rides', href: '/rides', icon: Car },
  ];

  // Secondary navigation - user actions (only when authenticated)
  const secondaryNav = isAuthenticated ? [
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Messages', href: '/messages', icon: MessageCircle, badge: messageUnreadCount },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: notificationUnreadCount },
  ] : [];

  // Create actions (only when authenticated)
  const createActions = isAuthenticated ? [
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
            <div className="flex items-center">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">KIBOSS</span>
              </Link>

              {/* Desktop Primary Navigation */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
                {primaryNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
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

            {/* Center - Create Actions (Desktop) */}
            <div className="hidden lg:flex items-center space-x-2">
              {createActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  <action.icon className="h-4 w-4 mr-1" />
                  {action.name}
                </Link>
              ))}
            </div>

            {/* Right side - Secondary Nav and User Menu */}
            <div className="flex items-center space-x-2">
              {/* Desktop Secondary Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {secondaryNav.map((item) => (
                  item.name === 'Notifications' ? (
                    <div key={item.name} className="relative">
                      <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className={`relative inline-flex items-center p-2 rounded-lg transition-colors ${
                          isActive(item.href) || isNotificationOpen
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
                      className={`relative inline-flex items-center p-2 rounded-lg transition-colors ${
                        isActive(item.href)
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
                <div className="relative">
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
                      <p className="text-sm font-medium text-gray-900">{user.first_name}</p>
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
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
              
              {/* Create Actions */}
              <div className="pt-2 pb-1">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Create</p>
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
              
              {/* Secondary Nav */}
              <div className="pt-2 pb-1">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
              </div>
              {secondaryNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium ${
                    isActive(item.href)
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
      {!isMessagingPage && (
        <footer className="bg-white border-t border-gray-200 mt-auto py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-10">
              {/* Logo & Slogan */}
              <div className="flex flex-col items-center">
                <Link to="/" className="flex items-center mb-3">
                  <div className="h-12 w-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-200 rotate-3">
                    <span className="text-white font-black text-2xl -rotate-3">K</span>
                  </div>
                  <span className="ml-4 text-3xl font-black tracking-tighter text-gray-900">KIBOSS</span>
                </Link>
                <p className="text-gray-500 text-sm max-w-sm font-medium leading-relaxed">
                  Universal Rental & Sharing Operating System. <br />
                  List anything, rent everything.
                </p>
              </div>

              {/* Main Divider Line */}
              <div className="w-full max-w-lg h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

              {/* Centered Links */}
              <nav className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-xs font-black uppercase tracking-widest text-gray-400">
                <Link to="/assets" className="hover:text-primary-600 transition-all hover:scale-105">Assets</Link>
                <Link to="/rides" className="hover:text-primary-600 transition-all hover:scale-105">Rides</Link>
                <Link to="/faq" className="hover:text-primary-600 transition-all hover:scale-105">How it works</Link>
                <Link to="/privacy" className="hover:text-primary-600 transition-all hover:scale-105">Privacy</Link>
                <Link to="/help" className="hover:text-primary-600 transition-all hover:scale-105">Support</Link>
              </nav>

              {/* Socials */}
              <div className="flex space-x-8">
                <a href="#" className="text-gray-300 hover:text-primary-600 transition-all transform hover:-translate-y-1"><Facebook className="h-5 w-5" /></a>
                <a href="#" className="text-gray-300 hover:text-primary-600 transition-all transform hover:-translate-y-1"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="text-gray-300 hover:text-primary-600 transition-all transform hover:-translate-y-1"><Instagram className="h-5 w-5" /></a>
                <a href="#" className="text-gray-300 hover:text-primary-600 transition-all transform hover:-translate-y-1"><Linkedin className="h-5 w-5" /></a>
              </div>

              {/* Bottom Section */}
              <div className="w-full pt-10 border-t border-gray-50 flex flex-col items-center space-y-6">
                <div className="flex flex-wrap justify-center items-center gap-6">
                  <div className="flex items-center text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <Globe className="h-4 w-4 mr-2 text-primary-500" />
                    English (US)
                  </div>
                  <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                  <div className="relative group">
                    <select 
                      value={currency.code}
                      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                      className="appearance-none bg-transparent text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none pr-4 cursor-pointer group-hover:text-primary-600 transition-colors"
                    >
                      {availableCurrencies.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                  © {new Date().getFullYear()} KIBOSS Inc. Empowering the sharing economy.
                </p>

                <div className="flex items-center gap-8 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                  <Shield className="h-5 w-5" />
                  <CheckCircle className="h-5 w-5" />
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
