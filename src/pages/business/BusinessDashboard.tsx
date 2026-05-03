import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../app/store';
import { fetchAssets } from '../../features/assets/assetsSlice';
import {
  Building2,
  Utensils,
  Plus,
  ShieldCheck,
  Clock,
  AlertCircle,
  ChevronRight,
  LayoutDashboard,
  Hotel,
  Coffee,
  Bed,
  Users,
  Settings,
  Briefcase,
  MessageCircle,
  Zap,
  Star,
  CreditCard,
  Car,
  Activity,
  Sparkles,
  BarChart3,
  TrendingUp,
  Eye,
  Crown,
  CheckCircle,
  AlertTriangle,
  Trophy,
  Percent,
  UploadCloud
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Asset } from '../../types';
import { getMediaUrl } from '../../utils/media';
import VerificationBadge from '../../components/ui/VerificationBadge';
import ContactButton from '../../components/messaging/ContactButton';
import FeedbackForm from '../../components/common/FeedbackForm';
import WorkerManagement from './WorkerManagement';
import FleetCommand from './FleetCommand';
import SupportInbox from './SupportInbox';
import PaymentMethods from '../plus/PaymentMethods';
import { Price } from '../../context/CurrencyContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchCurrentUser } from '../../features/auth/authSlice';
import { SubscriptionStatusCard } from '../../components/subscription/SubscriptionStatusCard';

export default function BusinessDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [properties, setProperties] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [businessStats, setBusinessStats] = useState({ tripCount: 0, driverCount: 0, serviceCount: 0 });
  const [activeTab, setActiveTab] = useState<'analytics' | 'team' | 'fleet' | 'support' | 'marketing' | 'payments' | 'directory'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [discountForm, setDiscountForm] = useState({ percentage: 10, isApplying: false, success: false, error: '' });

  // Registration Form State
  const [regData, setRegData] = useState({
    company_name: user?.corporate_profile?.company_name || '',
    registration_number: user?.corporate_profile?.registration_number || '',
    tax_id: user?.corporate_profile?.tax_id || '',
  });

  const isCorporateVerified = user?.corporate_profile?.verification_status === 'VERIFIED';
  const isCorporatePending = user?.corporate_profile?.verification_status === 'PENDING';
  const isCorporateRejected = user?.corporate_profile?.verification_status === 'REJECTED';

  useEffect(() => {
    if (user) {
      fetchProperties();
      if (user.corporate_profile) {
        setRegData({
          company_name: user.corporate_profile.company_name,
          registration_number: user.corporate_profile.registration_number,
          tax_id: user.corporate_profile.tax_id,
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (isCorporateVerified) {
      fetchBusinessStats();
      api.get('/users/me/analytics/')
        .then(res => setAnalytics(res.data))
        .catch(console.error);
    }
  }, [isCorporateVerified]);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const category = user?.corporate_profile?.business_category || 'ASSET';
      
      const params: any = {
        owner: 'me',
        is_active: 'any',
        context: 'corporate'
      };
      
      if (category === 'RIDE') {
        params.asset_type = 'VEHICLE';
      }

      const res = await api.get('/assets/', { params });
      const data = res.data.results || res.data;
      setProperties(data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinessStats = async () => {
    try {
      const category = user?.corporate_profile?.business_category || 'ASSET';
      if (category === 'RIDE') {
        // Get completed trip count from the rides API
        const ridesRes = await api.get('/rides/', { params: { driver: 'me', status: 'COMPLETED' } });
        const tripCount = ridesRes.data.count ?? (ridesRes.data.results?.length || 0);
        setBusinessStats(prev => ({ ...prev, tripCount }));
      } else {
        // Count services (child assets under corporate properties)
        const servicesRes = await api.get('/assets/', { params: { owner: 'me', asset_type: 'HOTEL_ROOM,CONFERENCE_HALL,DINING_TABLE', context: 'corporate' } });
        const serviceCount = servicesRes.data.count ?? (servicesRes.data.results?.length || 0);
        setBusinessStats(prev => ({ ...prev, serviceCount }));
      }
    } catch (error) {
      console.error('Failed to fetch business stats:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Patch the profile via the corporate registration endpoint
      await api.patch('/users/corporate/register/', regData);
      toast.success('Company application resubmitted successfully!');
      setIsEditing(false);
      dispatch(fetchCurrentUser());
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!window.confirm("Are you sure you want to completely cancel and delete your corporate application? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      await api.delete('/users/corporate/register/');
      toast.success('Your corporate application has been cancelled.');
      // Refresh the page to reload the user profile from scratch
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountForm(p => ({ ...p, isApplying: true, success: false, error: '' }));
    try {
        await api.post('/assets/bulk_discount/', { percentage: discountForm.percentage });
        setDiscountForm(p => ({ ...p, isApplying: false, success: true }));
        setTimeout(() => setDiscountForm(p => ({ ...p, success: false })), 5000);
    } catch (err: any) {
        setDiscountForm(p => ({ 
            ...p, 
            isApplying: false, 
            error: err.response?.data?.error || 'Failed to apply discount' 
        }));
    }
  };

  // TIER GUARD: Allow if account_tier is BUSINESS *or* user has a corporate_profile
  // (handles legacy users who registered before the tier system)
  if (user?.account_tier !== 'BUSINESS' && !user?.corporate_profile) {
    return (
      <div className="max-w-4xl mx-auto py-20 space-y-10 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="h-24 w-24 bg-primary-50 text-primary-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Business Dashboard</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            Subscribe to the Business plan to access fleet management, analytics, team tools, and more.
          </p>
          <div className="pt-8">
            <button
              onClick={() => navigate('/upgrade')}
              className="btn-primary px-10 py-4 rounded-2xl shadow-2xl shadow-primary-500/30 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 mx-auto hover:scale-105 transition-transform"
            >
              Upgrade to Business <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state - only shown AFTER tier guard passes
  if (isLoading && !isEditing && properties.length === 0 && user?.corporate_profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // 1. NO CORPORATE PROFILE — redirect to registration
  if (!user?.corporate_profile || (!isCorporateVerified && !isCorporatePending && !isCorporateRejected)) {
    return (
      <div className="max-w-4xl mx-auto py-20 space-y-10 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="h-24 w-24 bg-primary-50 text-primary-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Register Your Business</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            You're subscribed to the Business plan. Complete your business registration to access the dashboard.
          </p>
          <div className="pt-8">
            <button
              onClick={() => navigate('/business/register')}
              className="btn-primary px-10 py-4 rounded-2xl shadow-2xl shadow-primary-500/30 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 mx-auto hover:scale-105 transition-transform"
            >
              Register Business <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  // 2. PENDING VIEW
  if (isCorporatePending) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-10 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="h-24 w-24 bg-orange-50 text-orange-500 rounded-[2.5rem] flex items-center justify-center mx-auto animate-pulse">
            <Clock className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Verification in Progress</h1>
          <p className="text-gray-500 font-medium">
            Our team is currently reviewing your business credentials. You'll be notified via email once your account is activated.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              {isEditing ? 'Cancel Editing' : 'Edit Application'}
            </button>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="px-6 py-3 bg-primary-50 text-primary-600 border-2 border-primary-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-100 transition-all flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" /> Message Us
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={handleCancelApplication}
              className="text-red-500 hover:text-red-600 text-xs font-bold uppercase tracking-widest transition-colors underline underline-offset-4"
            >
              Cancel Application
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="card p-8 md:p-12 animate-in slide-in-from-top-4 duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Update Company Details</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Modify your information if there were mistakes in your application.</p>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="label">Official Company Name</label>
                  <input
                    type="text"
                    className="input"
                    value={regData.company_name}
                    onChange={e => setRegData({ ...regData, company_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Registration Number</label>
                  <input
                    type="text"
                    className="input"
                    value={regData.registration_number}
                    onChange={e => setRegData({ ...regData, registration_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Tax ID / TIN</label>
                  <input
                    type="text"
                    className="input"
                    value={regData.tax_id}
                    onChange={e => setRegData({ ...regData, tax_id: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="submit" disabled={isLoading} className="btn-primary px-8 py-3 rounded-2xl shadow-xl shadow-primary-500/20">
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">What's next?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="space-y-2">
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest">1. Document Review</p>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Our compliance team checks your registration documents against government records.</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest">2. Payment Confirmation</p>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Our team will verify your payment receipt and activate your account within 24 hours.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="text-gray-400 font-bold hover:text-primary-600 text-xs uppercase tracking-widest transition-colors">Return to Home</Link>
        </div>

        <FeedbackForm
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          category="VERIFICATION"
          initialSubject="Inquiry about pending business verification"
        />
      </div>
    );
  }

  // 3. REJECTED VIEW
  if (isCorporateRejected) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-10 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="h-24 w-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Application Rejected</h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Our compliance team could not verify the provided credentials or the documents were invalid.
            If you believe this is a mistake, you can adjust your application details below or contact support.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-3 bg-red-600 border border-red-700 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-lg hover:bg-red-700 transition-all"
            >
              {isEditing ? 'Cancel Updating' : 'Update Credentials'}
            </button>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" /> Appeal Decision
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={handleCancelApplication}
              className="text-red-500 hover:text-red-600 text-xs font-bold uppercase tracking-widest transition-colors underline underline-offset-4"
            >
              Cancel Application
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="card p-8 md:p-12 animate-in slide-in-from-top-4 duration-500 border-red-100 shadow-xl shadow-red-900/5">
            <div className="mb-8 border-b border-red-100 pb-4">
              <h2 className="text-2xl font-black text-red-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-red-500" />
                Resubmit Application
              </h2>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="company_name" className="label">Official Company Name</label>
                  <input
                    id="company_name"
                    name="company_name"
                    type="text"
                    className="input border-red-200 focus:border-red-500 focus:ring-red-500/20"
                    value={regData.company_name}
                    onChange={e => setRegData({ ...regData, company_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="registration_number" className="label">Registration Number</label>
                  <input
                    id="registration_number"
                    name="registration_number"
                    type="text"
                    className="input border-red-200 focus:border-red-500 focus:ring-red-500/20"
                    value={regData.registration_number}
                    onChange={e => setRegData({ ...regData, registration_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="tax_id" className="label">Tax ID / TIN</label>
                  <input
                    id="tax_id"
                    name="tax_id"
                    type="text"
                    className="input border-red-200 focus:border-red-500 focus:ring-red-500/20"
                    value={regData.tax_id}
                    onChange={e => setRegData({ ...regData, tax_id: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={isLoading} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-xl shadow-red-500/20 font-black text-sm transition-colors uppercase tracking-widest">
                  {isLoading ? 'Resubmitting...' : 'Submit for Re-verification'}
                </button>
              </div>
            </form>
          </div>
        )}

        <FeedbackForm
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          category="VERIFICATION"
          initialSubject={`Appeal for Corporate Profile: ${user?.corporate_profile?.company_name}`}
        />
      </div>
    );
  }

  // 4. VERIFIED DASHBOARD
  const category = user?.corporate_profile?.business_category || 'ASSET';
  const isRide = category === 'RIDE';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Business Header Profile */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 shadow-xl shadow-gray-200/40">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />

        <div className="relative pt-24 px-8 pb-8 flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="h-32 w-32 rounded-3xl bg-white dark:bg-gray-800 p-2 shadow-xl ring-1 ring-gray-100 flex-shrink-0 relative z-10">
              <div className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-gray-300">
                {isRide ? <Car className="h-12 w-12" /> : <Building2 className="h-12 w-12" />}
              </div>
            </div>

            <div className="space-y-2 mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter drop-shadow-sm">
                  {user?.corporate_profile?.company_name || 'Business Partner'}
                </h1>
                <VerificationBadge 
                  tier="business" 
                  color="indigo" 
                  size="md" 
                  checkmarkData={user?.checkmark_data}
                />
              </div>
              <div className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {isRide ? 'Fleet operations' : 'Asset Management'}</span>
                <span>•</span>
                <span className="text-gray-400">Reg: {user?.corporate_profile?.registration_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <ContactButton
              targetUserId="admin"
              label="Support"
              threadType="SUPPORT"
              subject="Corporate Support Request"
              variant="outline"
              className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
            />
            <Link to={isRide ? "/vehicles/register" : "/assets/create?mode=business"} className="flex-1 md:flex-none btn-primary px-8 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary-500/30">
              <Plus className="h-5 w-5" />
              {isRide ? 'Register Vehicle' : 'Add Property'}
            </Link>
            {isRide && (
              <Link to="/rides/create?mode=business" className="flex-1 md:flex-none px-8 py-3 rounded-2xl flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-500/30 text-xs font-black uppercase tracking-widest">
                <Car className="h-5 w-5" />
                Create Trip
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Global Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 border border-gray-100 bg-white dark:bg-gray-800 shadow-sm flex items-center gap-4 hover:shadow transition-shadow">
          <div className="h-10 w-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-800">
            {isRide ? <Car className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRide ? 'Active Vehicles' : 'Active Properties'}</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{properties.length}</p>
          </div>
        </div>
        <div className="card p-5 border border-gray-100 bg-white dark:bg-gray-800 shadow-sm flex items-center gap-4 hover:shadow transition-shadow">
          <div className="h-10 w-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-800">
            {isRide ? <Users className="h-5 w-5" /> : <Bed className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRide ? 'Active Drivers' : 'Total Services'}</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{isRide ? businessStats.driverCount : businessStats.serviceCount}</p>
          </div>
        </div>
        <div className="card p-5 border border-gray-100 bg-white dark:bg-gray-800 shadow-sm flex items-center gap-4 hover:shadow transition-shadow">
          <div className="h-10 w-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-800">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRide ? 'Total Trips' : 'Total Bookings'}</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{isRide ? businessStats.tripCount : businessStats.serviceCount}</p>
          </div>
        </div>
        <div className="card p-5 border border-gray-100 bg-white dark:bg-gray-800 shadow-sm flex items-center gap-4 hover:shadow transition-shadow">
          <div className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-md">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Revenue</p>
            <p className="text-xl font-black text-gray-900 mt-0.5"><Price amount={analytics?.total_earnings || 0} /></p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar max-w-full">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'analytics'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <BarChart3 className="h-3.5 w-3.5 inline mr-1.5 align-text-bottom" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'directory'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          {isRide ? 'Fleet' : 'Properties'}
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'team'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Users className="h-3.5 w-3.5" /> Team
        </button>
        {isRide && (
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'fleet'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Car className="h-3.5 w-3.5" /> Fleet Command
          </button>
        )}
        <button
          onClick={() => setActiveTab('marketing')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'marketing'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Percent className="h-3.5 w-3.5 inline mr-1.5 align-text-bottom" />
          Marketing
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'payments'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Star className="h-3.5 w-3.5" /> Payments
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'support'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <MessageCircle className="h-3.5 w-3.5" /> Support
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SubscriptionStatusCard
                tier="BUSINESS"
                expiresAt={analytics?.subscription_expires_at || null}
                isPending={analytics?.subscription_status === 'PENDING'}
            />

            {/* Server Warning if advanced analytics missing */}
            {analytics && !analytics.advanced_analytics && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-4 shadow-sm">
                    <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
                    <div>
                        <h3 className="font-bold text-amber-900 leading-tight">Analytics Engine Updating</h3>
                        <p className="text-sm mt-1 text-amber-700">We recently upgraded your dashboard with new chart capabilities! However, we haven't received the advanced data payload yet. If you are a developer testing locally, please <strong>restart your Python backend server</strong> to load the new data.</p>
                    </div>
                </div>
            )}

            {/* Analytics Engine Space */}

            {/* Advanced Analytics - Charts & Tables */}
            {analytics?.advanced_analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="card p-6 border border-gray-100 bg-white dark:bg-gray-800 shadow-sm lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary-500" />
                                Revenue Overview (6 Months)
                            </h2>
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Completed Bookings</span>
                        </div>
                        <div className="h-[300px] w-full">
                            {analytics.advanced_analytics.revenue_trend?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.advanced_analytics.revenue_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `$${value}`} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(value: number) => [<Price amount={value} key={value} />, "Revenue"]}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <BarChart3 className="h-10 w-10 mb-2 opacity-50" />
                                    <p className="text-sm font-bold">No revenue data for the past 6 months</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="card p-6 border border-gray-100 bg-white dark:bg-gray-800 shadow-sm relative overflow-hidden">
                            <Star className="absolute -right-4 -top-4 h-24 w-24 text-gray-900 opacity-[0.03]" />
                            <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase mb-1">Host Rating</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{analytics.advanced_analytics.overall_rating}</span>
                                <span className="text-sm text-gray-500 font-bold">/ 5.0</span>
                            </div>
                            <div className="flex gap-1 mt-3">
                                {[1,2,3,4,5].map(star => (
                                    <Star key={star} className={`h-4 w-4 ${star <= Math.round(analytics.advanced_analytics.overall_rating) ? 'text-gray-800 fill-gray-800' : 'text-gray-200'}`} />
                                ))}
                            </div>
                        </div>

                        <div className="card p-6 border border-gray-100 bg-white dark:bg-gray-800 shadow-sm relative overflow-hidden">
                            <AlertTriangle className="absolute -right-4 -top-4 h-24 w-24 text-gray-900 opacity-[0.03]" />
                            <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase mb-1">Cancellation Rate</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{analytics.advanced_analytics.cancellation_rate}%</span>
                            </div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2">
                                {analytics.advanced_analytics.cancellation_rate > 10 ? 'High capacity loss' : 'Healthy engagement'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Listings Table */}
            {analytics?.advanced_analytics?.top_listings?.length > 0 && (
                <div className="card border border-gray-100 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Top Performing Listings
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Listing Name</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Bookings</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Earnings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {analytics.advanced_analytics.top_listings.map((listing: any, index: number) => (
                                    <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-black text-xs">
                                                    #{index + 1}
                                                </div>
                                                <span className="font-bold text-gray-900 dark:text-white">{listing.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-600 dark:text-gray-300">
                                            {listing.bookings}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-green-600 dark:text-green-400">
                                            <Price amount={listing.earnings} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <div className="card p-8 border border-gray-100 bg-white dark:bg-gray-800 shadow-sm mb-8">
        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-6 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-gray-900 dark:text-white" />
                    Usage & Limits
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility Multiplier</p>
                        <p className="text-3xl font-black text-gray-900 mt-1 flex items-baseline gap-2">
                            {analytics?.visibility_multiplier || 2.5}x
                            <span className="text-xs text-gray-500 font-medium tracking-normal block mt-1">Maximum search ranking boost</span>
                        </p>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rides This Month</p>
                        <p className="text-3xl font-black text-gray-900 mt-1 flex items-baseline gap-2">
                            {analytics?.rides_this_month || 0} <span className="text-sm text-gray-400">/ {analytics?.max_rides_per_month === -1 ? 'Unlimited' : (analytics?.max_rides_per_month || 'Unlimited')}</span>
                            <span className="text-xs text-gray-500 font-medium tracking-normal block mt-1">Monthly limit tracker</span>
                        </p>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Listings</p>
                        <p className="text-3xl font-black text-gray-900 mt-1 flex items-baseline gap-2">
                            {analytics?.active_listings || 0} <span className="text-sm text-gray-400">/ {analytics?.max_assets === -1 ? 'Unlimited' : (analytics?.max_assets || 'Unlimited')}</span>
                            <span className="text-xs text-gray-500 font-medium tracking-normal block mt-1">Active listings allowed</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
      ) : activeTab === 'marketing' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="card p-8 border border-gray-100 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <Percent className="h-6 w-6 text-gray-900 dark:text-white" />
                            Global Discount Campaign
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
                            Run a flash sale by quickly applying a single percentage discount across all your active listings at once. This permanently updates current pricing rules.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleApplyDiscount} className="max-w-md bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-indigo-100">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                        Discount Percentage
                    </label>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-500 font-bold">%</span>
                            </div>
                            <input
                                type="number"
                                min="1"
                                max="99"
                                value={discountForm.percentage}
                                onChange={e => setDiscountForm(p => ({ ...p, percentage: parseInt(e.target.value) || 0 }))}
                                className="block w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors font-bold text-gray-900 dark:text-white"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={discountForm.isApplying}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold tracking-wide hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                            {discountForm.isApplying ? 'Applying...' : 'Apply Sale'}
                        </button>
                    </div>

                    {discountForm.error && (
                        <p className="text-sm text-red-600 mt-3 font-medium bg-red-50 p-2 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> {discountForm.error}
                        </p>
                    )}
                    {discountForm.success && (
                        <p className="text-sm text-green-600 mt-3 font-medium bg-green-50 p-2 rounded-lg flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Discount rules applied to all active assets!
                        </p>
                    )}
                </form>
            </div>

            <div className="card p-8 border border-gray-100 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-gray-900 dark:text-white" />
                            Listing Boosting
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Your Plus/Business plan gives you an automatic visibility multiplier. You can optionally boost specific listings further (coming soon).
                        </p>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest rounded-full">
                        Active ({analytics?.visibility_multiplier || 2.5}x)
                    </span>
                </div>
            </div>
        </div>
      ) : activeTab === 'payments' ? (
        <PaymentMethods />
      ) : activeTab === 'team' ? (
        <WorkerManagement />
      ) : activeTab === 'fleet' && isRide ? (
        <FleetCommand />
      ) : activeTab === 'support' ? (
        <SupportInbox />
      ) : (
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-gray-400" />
              {isRide ? 'Fleet Directory' : 'Property Directory'}
            </h2>
          </div>

          {properties.length === 0 ? (
            <div className="card p-10 md:p-16 text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
              <div className="max-w-md mx-auto space-y-6">
                <div className="h-16 w-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
                  {isRide ? <Car className="h-8 w-8" /> : <Building2 className="h-8 w-8" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    {isRide ? 'No vehicles registered yet' : 'No properties listed yet'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {isRide
                      ? 'Register your first vehicle to start building your fleet and creating trips.'
                      : 'Add your first property to start managing bookings and services.'
                    }
                  </p>
                </div>
                <Link
                  to={isRide ? '/vehicles/register' : '/assets/create?mode=business'}
                  className="inline-flex btn-primary px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest items-center gap-2 shadow-lg shadow-primary-500/20"
                >
                  <Plus className="h-5 w-5" />
                  {isRide ? 'Register First Vehicle' : 'Add First Property'}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {properties.map((prop) => (
                <div key={prop.id} className={`group card p-3 overflow-hidden bg-white transition-all duration-300 border-none ring-1 ring-gray-200/60 flex flex-col md:flex-row gap-6 items-center relative ${prop.verification_status === 'PENDING' ? 'opacity-50 grayscale-[50%]' : 'hover:shadow-2xl'}`}>
                  <div className="w-full md:w-64 h-48 md:h-40 rounded-2xl overflow-hidden bg-gray-100 relative flex-shrink-0">
                    <div className={`w-full h-full ${prop.verification_status === 'PENDING' ? 'blur-[2px]' : ''}`}>
                      {prop.photos?.[0] ? (
                        <img src={getMediaUrl(prop.photos[0].url)} alt="" className={`w-full h-full object-cover transition-transform duration-500 ${prop.verification_status !== 'PENDING' ? 'group-hover:scale-105' : ''}`} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 font-black text-[10px] uppercase tracking-widest px-4 text-center">
                          {isRide ? 'VEHICLE PREVIEW' : 'PROPERTY PREVIEW'}
                        </div>
                      )}
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md backdrop-blur-sm ${prop.verification_status === 'VERIFIED' ? 'bg-emerald-500/90 text-white' : 'bg-orange-500/90 text-white'
                        }`}>
                        {prop.verification_status}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full py-2 pr-4 flex flex-col justify-between h-full relative z-10">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            {prop.asset_type === 'HOTEL' ? <Hotel className="h-3.5 w-3.5 text-primary-600" /> : prop.asset_type === 'VEHICLE' ? <Car className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" /> : <Utensils className="h-3.5 w-3.5 text-emerald-600" />}
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{prop.asset_type}</span>
                          </div>
                          <h3 className="text-xl font-black text-gray-900 tracking-tight">{prop.name}</h3>
                          <p className="text-gray-500 text-xs font-medium mt-0.5">{prop.city}, {prop.country}</p>
                        </div>
                        <button className="p-2 bg-gray-50 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{isRide ? 'Seats' : 'Rooms'}</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{isRide ? (prop.properties?.seats as string) || '4' : '0'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{isRide ? 'Condition' : 'Staff'}</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{isRide ? ((prop.properties?.status as string) || 'Good') : '--'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!isRide && prop.verification_status !== 'PENDING' && (
                          <Link
                            to={`/assets/create?parent=${prop.id}&mode=service`}
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus className="h-3 w-3" />
                            Add Service
                          </Link>
                        )}
                        {prop.verification_status !== 'PENDING' ? (
                          <Link
                            to={isRide ? `/vehicles/${prop.id}/manage` : `/assets/${prop.id}`}
                            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center gap-1.5 shadow-md shadow-primary-500/20"
                          >
                            Manage
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        ) : (
                          <button className="px-4 py-2 bg-gray-300 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                            Awaiting Staff
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {prop.verification_status === 'PENDING' && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                      <div className="bg-orange-600 text-white px-6 py-2 rounded-2xl font-black tracking-widest text-lg shadow-2xl uppercase transform -rotate-6 border border-orange-500">
                        Pending Review
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
