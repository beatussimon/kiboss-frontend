import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { logout, updateUser } from '../../features/auth/authSlice';
import { fetchThreads, fetchUnreadCount } from '../../features/messaging/messagingSlice';
import { fetchNotifications } from '../../features/notifications/notificationsSlice';
import {
  MessageCircle, Bell, User, LogOut, Menu, X,
  Home, Car, Briefcase, Plus, Search, Settings,
  Calendar, Shield, CreditCard, Globe, Facebook, Twitter, Instagram, Linkedin, CheckCircle, Heart, Building2, ChevronRight, Sparkles, Crown, MoreHorizontal, Sun, Moon, Laptop, Star
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import VerificationBadge from '../ui/VerificationBadge';
import { getMediaUrl } from '../../utils/media';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { useCurrency, CurrencyCode } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotificationWebSocket } from '../../features/notifications/useNotificationWebSocket';
import Footer from './Footer';
import Breadcrumbs from '../common/Breadcrumbs';
import SmartBackButton from '../common/SmartBackButton';

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const { theme, setTheme, isDark } = useTheme();

  // Start notification WebSocket
  useNotificationWebSocket();

  const bottomNavClass = (...paths: string[]) => {
    const isActive = paths.some(path => location.pathname === path || (path !== '/' && location.pathname.startsWith(path)));
    return `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`;
  };

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { unreadCount: messageUnreadCount } = useSelector((state: RootState) => state.messaging);
  const { unreadCount: notificationUnreadCount } = useSelector((state: RootState) => state.notifications);
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMobileMoreDrawerOpen, setIsMobileMoreDrawerOpen] = useState(false);

  // Scroll direction tracking for breadcrumbs and bottom navbar
  const [showNavBars, setShowNavBars] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show at top of page
      if (currentScrollY <= 10) {
        setShowNavBars(true);
      } else if (currentScrollY > lastScrollY.current) {
        // Scrolling down - hide
        setShowNavBars(false);
      } else {
        // Scrolling up - show
        setShowNavBars(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Refs for click-outside detection
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

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
      if (isThemeMenuOpen && themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isNotificationOpen, isCreateMenuOpen, isThemeMenuOpen]);

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

  const isMessagingPage = location.pathname.startsWith('/messages');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Dynamic checks
  const isCorporateVerified = user?.corporate_profile?.verification_status === 'VERIFIED';
  const businessCategory = user?.corporate_profile?.business_category;

  // Tier-derived helpers
  const accountTier = user?.account_tier || 'FREE';
  const effectiveTier = isStaff
    ? 'STAFF'
    : (accountTier !== 'FREE'
      ? accountTier
      : (user?.corporate_profile ? 'BUSINESS' : 'FREE'));

  // Primary navigation - main features (Desktop)
  const primaryNav = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Assets', href: '/assets', icon: Briefcase },
    { name: 'Rides', href: '/rides', icon: Car },
    ...(effectiveTier === 'PLUS'
      ? [{ name: 'Plus', href: '/plus', icon: Sparkles }]
      : effectiveTier === 'BUSINESS'
      ? [{ name: 'Business', href: '/business', icon: Building2 }]
        : []),
    ...(isStaff ? [{ name: 'Staff', href: '/staff/tasks', icon: Shield }] : []),
  ];

  // Secondary navigation - user actions (only when authenticated)
  const secondaryNav = isAuthenticated ? [
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Messages', href: '/messages', icon: MessageCircle, badge: messageUnreadCount },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: notificationUnreadCount },
  ] : [];

  // Create actions
  const createActions = (isAuthenticated && (!isStaff || user?.is_superuser)) ? [
    { name: 'List Asset', href: '/assets/create', icon: Plus },
    { name: 'Offer Ride', href: '/rides/create', icon: Car },
  ] : [];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 transition-colors duration-200 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 relative">
            {/* Left side - Logo and Primary Nav */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0 flex items-center relative z-10">
                <div className="hidden md:flex h-8 w-8 bg-primary-600 rounded-lg items-center justify-center transition-all duration-300">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <div className="flex md:ml-2 items-center">
                  {"KIBOSS".split("").map((char, index) => (
                    <motion.span
                      key={index}
                      className="inline-block text-4xl md:text-2xl font-black font-heading text-gray-900 dark:text-white tracking-tighter origin-bottom"
                      animate={{ 
                        y: [0, -6, 0],
                        rotate: [0, 12, -12, 0],
                        scale: [1, 1.15, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        delay: index * 0.2,
                        ease: [0.45, 0, 0.55, 1]
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
              </Link>

              {/* Desktop Primary Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
                {primaryNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-colors ${isActive(item.href)
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 transition-all shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Create
                    <ChevronRight className={`h-3 w-3 transition-transform ${isCreateMenuOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {isCreateMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl py-2 z-50 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                      {createActions.map((action) => (
                        <Link
                          key={action.name}
                          to={action.href}
                          onClick={() => setIsCreateMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400"
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

            {/* Right side - Secondary Nav, Theme Toggle, and User Menu */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <div className="relative" ref={themeMenuRef}>
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="relative inline-flex items-center p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  title="Toggle Theme"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

              </div>

              {/* Desktop Secondary Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {secondaryNav.map((item) => (
                  item.name === 'Notifications' ? (
                    <div key={item.name} className="relative" ref={notificationRef}>
                      <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className={`relative inline-flex items-center p-2 rounded-lg transition-colors ${isActive(item.href) || isNotificationOpen
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        title={item.name}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
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
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      title={item.name}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  )
                ))}
              </div>

              {/* User menu */}
              {isAuthenticated && user ? (
                <div className="hidden md:block relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    data-testid="user-menu-button"
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {user.profile?.avatar ? (
                      <img
                        src={getMediaUrl(user.profile.avatar)}
                        alt={user.first_name}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent hover:ring-primary-500 transition-all"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <div className="hidden md:block text-left">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{user.first_name}</p>
                        {isStaff && (
                          <span className="bg-primary-600 text-white text-[8px] font-black px-1 rounded-sm uppercase">Staff</span>
                        )}
                        <VerificationBadge
                          tier={user.verification_badge?.tier}
                          color={user.verification_badge?.color}
                          size="xs"
                          checkmarkData={user.checkmark_data}
                        />
                      </div>
                    </div>
                  </button>

                  {/* User dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 z-50 border border-gray-100 dark:border-gray-700">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
                      </div>
                      
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <User className="h-4 w-4 mr-3 text-gray-400" /> Profile
                      </Link>
                      <Link to="/my-listings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Briefcase className="h-4 w-4 mr-3 text-gray-400" /> My Listings
                      </Link>
                      
                      {/* Tier-Conditional Section */}
                      {effectiveTier === 'FREE' && (
                        <div className="px-2 my-2">
                          <Link
                            to="/upgrade"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 rounded-lg shadow-sm"
                          >
                            <Sparkles className="h-4 w-4 mr-2" /> Upgrade Plan
                          </Link>
                        </div>
                      )}
                      {effectiveTier === 'PLUS' && (
                        <div className="px-2 my-2">
                          <Link
                            to="/plus"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center justify-center px-4 py-2 text-sm font-bold text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg"
                          >
                            <Crown className="h-4 w-4 mr-2" /> Plus Dashboard
                          </Link>
                        </div>
                      )}
                      {effectiveTier === 'BUSINESS' && (
                        <div className="px-2 my-2">
                          <Link
                            to="/business"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center justify-center px-4 py-2 text-sm font-bold text-primary-700 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg"
                          >
                            <Building2 className="h-4 w-4 mr-2" /> 
                            {isCorporateVerified ? 'Business Panel' : 'Pending Review'}
                          </Link>
                        </div>
                      )}
                      {isStaff && (
                        <div className="px-2 my-2">
                          <Link
                            to="/staff/tasks"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center justify-center px-4 py-2 text-sm font-black text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg"
                          >
                            <Shield className="h-4 w-4 mr-2" /> Staff Dashboard
                          </Link>
                        </div>
                      )}

                      <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                        <Link
                          to="/profile"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setTimeout(() => {
                              const wishlist = document.getElementById('wishlist-section');
                              wishlist?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Heart className="h-4 w-4 mr-3 text-red-500" /> My Wishlist
                        </Link>
                        <Link
                          to="/payments"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <CreditCard className="h-4 w-4 mr-3 text-gray-400" /> Payments & Wallet
                        </Link>
                        <Link
                          to="/bookings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Calendar className="h-4 w-4 mr-3 text-gray-400" /> Bookings
                        </Link>
                        <Link
                          to="/subscription"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Star className="h-4 w-4 mr-3 text-gray-400" /> Subscription
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Settings className="h-4 w-4 mr-3 text-gray-400" /> Settings
                        </Link>
                        
                        <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <LogOut className="h-4 w-4 mr-3" /> Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${location.pathname === '/' ? 'pb-8' : 'py-8'}`}>
        {/* Breadcrumbs */}
        {location.pathname !== '/' && (
          <div className="mb-4 flex items-center">
            <div className="md:hidden mr-2">
              <SmartBackButton />
            </div>
            <div className="flex-1 min-w-0">
              <Breadcrumbs />
            </div>
          </div>
        )}
        <Outlet />
      </main>

      {/* Footer */}
      {!isMessagingPage && <Footer />}

      {/* Mobile Bottom Navbar */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 transition-transform duration-300 ${showNavBars ? 'translate-y-0' : 'translate-y-full'} pb-safe`}>
        <div className="flex justify-around items-center h-16 px-2 relative">
          {/* Home */}
          <Link to="/" className={bottomNavClass('/')}>
            <Home className="h-5 w-5 mb-1" /><span className="text-[10px] font-bold">Home</span>
          </Link>

          {/* Explore (Assets + Rides) */}
          <Link to="/assets" className={bottomNavClass('/assets', '/rides')}>
            <Search className="h-5 w-5 mb-1" /><span className="text-[10px] font-bold">Explore</span>
          </Link>

          {/* Create FAB — center raised button */}
          {isAuthenticated && (
            <button onClick={() => setIsCreateMenuOpen(true)}
              className="flex flex-col items-center justify-center -mt-5 w-14 h-14 bg-primary-600 rounded-full shadow-xl shadow-primary-500/30 text-white hover:bg-primary-700 active:scale-95 transition-transform">
              <Plus className="h-6 w-6" />
            </button>
          )}

          {/* Inbox with badge */}
          <Link to="/messages" className={`relative ${bottomNavClass('/messages')}`}>
            <MessageCircle className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-bold">Inbox</span>
            {messageUnreadCount > 0 && (
               <span className="absolute top-1 right-3 px-1 py-0.5 text-[8px] font-bold bg-red-500 text-white rounded-full min-w-[14px] text-center">
                 {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
               </span>
            )}
          </Link>

          {/* Me / Staff */}
          {isStaff ? (
            <Link to="/staff/tasks" className={bottomNavClass('/staff/tasks')}>
              <Shield className="h-5 w-5 mb-1 text-red-600" />
              <span className="text-[10px] font-bold text-red-600">Staff</span>
            </Link>
          ) : (
            <button onClick={() => setIsMobileMoreDrawerOpen(true)} className={`relative ${bottomNavClass('/profile', '/settings', '/bookings', '/plus', '/business')}`}>
              {user?.profile?.avatar
                ? <img src={getMediaUrl(user.profile.avatar)} className="h-6 w-6 rounded-full mb-1 object-cover ring-2 ring-transparent" alt="" />
                : <User className="h-5 w-5 mb-1" />
              }
              <span className="text-[10px] font-bold">Me</span>
              {notificationUnreadCount > 0 && (
                 <span className="absolute top-1 right-3 px-1 py-0.5 text-[8px] font-bold bg-red-500 text-white rounded-full min-w-[14px] text-center">
                   {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                 </span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile More Drawer */}
      {isMobileMoreDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/60 transition-opacity" onClick={() => setIsMobileMoreDrawerOpen(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />
            
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                   {user?.profile?.avatar ? (
                      <img src={getMediaUrl(user.profile.avatar)} alt={user.first_name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <div>
                       <p className="font-bold font-heading text-gray-900 dark:text-white text-lg">{user?.first_name} {user?.last_name}</p>
                       <Link to="/profile" onClick={() => setIsMobileMoreDrawerOpen(false)} className="text-sm text-primary-600 dark:text-primary-400 font-bold">View Profile</Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {createActions.map(action => (
                    <Link key={action.name} to={action.href} onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                       <action.icon className="h-6 w-6 mb-2 text-gray-700 dark:text-gray-300" />
                       <span className="text-sm font-bold">{action.name}</span>
                    </Link>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                   <Link to="/notifications" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl justify-between">
                      <div className="flex items-center"><Bell className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" /> Notifications</div>
                      {notificationUnreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{notificationUnreadCount}</span>}
                   </Link>
                   <Link to="/bookings" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                      <Calendar className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" /> My Bookings
                   </Link>
                   <Link to="/my-listings" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                      <Briefcase className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" /> My Listings
                   </Link>
                   <Link to="/assets" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                      <Building2 className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" /> Browse Assets
                   </Link>
                   <Link to="/rides" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                      <Car className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" /> Browse Rides
                   </Link>
                   {effectiveTier === 'FREE' && (
                     <Link to="/upgrade" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 font-bold text-white bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-sm">
                        <Sparkles className="h-5 w-5 mr-3" /> Upgrade Plan
                     </Link>
                   )}
                   {effectiveTier === 'PLUS' && (
                     <Link to="/plus" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                        <Crown className="h-5 w-5 mr-3" /> Plus Dashboard
                     </Link>
                   )}
                   {effectiveTier === 'BUSINESS' && (
                     <Link to="/business" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                        <Building2 className="h-5 w-5 mr-3" /> Business Dashboard
                     </Link>
                   )}
                   {isStaff && (
                     <Link to="/staff/tasks" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 font-black text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl">
                        <Shield className="h-5 w-5 mr-3" /> Staff Dashboard
                     </Link>
                   )}
                   <Link to="/payments" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                      <CreditCard className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" /> Payments & Wallet
                   </Link>
                   <Link to="/subscription" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                     <Star className="h-5 w-5 mr-4 text-gray-400" /> Subscription
                   </Link>
                   <Link to="/settings" onClick={() => setIsMobileMoreDrawerOpen(false)} className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                      <Settings className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" /> Settings
                   </Link>
                </div>
                
                <button onClick={() => { setIsMobileMoreDrawerOpen(false); handleLogout(); }} className="w-full flex items-center justify-center px-4 py-4 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 rounded-xl">
                   <LogOut className="h-5 w-5 mr-2" /> Logout
                </button>
              </>
            ) : (
              <div className="space-y-4">
                 <h3 className="text-xl font-bold font-heading text-gray-900 dark:text-white text-center mb-6">Join Kiboss Today</h3>
                 <Link to="/login" onClick={() => setIsMobileMoreDrawerOpen(false)} className="block w-full py-4 text-center text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/30 rounded-xl">Log In</Link>
                 <Link to="/register" onClick={() => setIsMobileMoreDrawerOpen(false)} className="block w-full py-4 text-center text-white font-bold bg-primary-600 rounded-xl shadow-md">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
