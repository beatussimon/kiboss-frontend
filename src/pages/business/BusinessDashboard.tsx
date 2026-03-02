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
  Activity
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

export default function BusinessDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [properties, setProperties] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [businessStats, setBusinessStats] = useState({ tripCount: 0, driverCount: 0, serviceCount: 0 });
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'fleet' | 'support'>('overview');

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
    }
  }, [isCorporateVerified]);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const category = user?.corporate_profile?.business_category || 'ASSET';
      const assetTypes = category === 'RIDE' ? 'VEHICLE' : 'HOTEL,RESTAURANT';

      const res = await api.get('/assets/', {
        params: {
          owner: 'me',
          asset_type: assetTypes,
          is_active: 'any',
          context: 'corporate'
        }
      });
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
      window.location.reload();
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
              className="px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
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
              <p className="text-gray-500 text-sm font-medium">Modify your information if there were mistakes in your application.</p>
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

        <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100">
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
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">We verify the Zenopay reference provided to ensure your subscription is valid.</p>
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
      <div className="relative rounded-[2.5rem] overflow-hidden bg-white border border-gray-100 shadow-xl shadow-gray-200/40">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />

        <div className="relative pt-24 px-8 pb-8 flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="h-32 w-32 rounded-3xl bg-white p-2 shadow-xl ring-1 ring-gray-100 flex-shrink-0 relative z-10">
              <div className="w-full h-full bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                {isRide ? <Car className="h-12 w-12" /> : <Building2 className="h-12 w-12" />}
              </div>
            </div>

            <div className="space-y-2 mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter drop-shadow-sm">
                  {user?.corporate_profile?.company_name || 'Business Partner'}
                </h1>
                <VerificationBadge tier="business" color="indigo" size="md" />
              </div>
              <div className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-gray-500">
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
              className="flex-1 md:flex-none px-6 py-3 bg-white rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
            />
            <Link to={isRide ? "/vehicles/register" : "/assets/create?mode=business"} className="flex-1 md:flex-none btn-primary px-8 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary-500/30">
              <Plus className="h-5 w-5" />
              {isRide ? 'Register Vehicle' : 'Add Property'}
            </Link>
            {isRide && (
              <Link to="/rides/create?mode=business" className="flex-1 md:flex-none px-8 py-3 rounded-2xl flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/30 text-xs font-black uppercase tracking-widest">
                <Car className="h-5 w-5" />
                Create Trip
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-none bg-white shadow-lg ring-1 ring-gray-200/50 flex items-center gap-5 hover:shadow-xl transition-shadow">
          <div className="h-14 w-14 bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 rounded-2xl flex items-center justify-center ring-1 ring-blue-100/50">
            {isRide ? <Car className="h-7 w-7" /> : <Hotel className="h-7 w-7" />}
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRide ? 'Active Vehicles' : 'Active Properties'}</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{properties.length}</p>
          </div>
        </div>
        <div className="card p-6 border-none bg-white shadow-lg ring-1 ring-gray-200/50 flex items-center gap-5 hover:shadow-xl transition-shadow">
          <div className="h-14 w-14 bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600 rounded-2xl flex items-center justify-center ring-1 ring-emerald-100/50">
            {isRide ? <Users className="h-7 w-7" /> : <Bed className="h-7 w-7" />}
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRide ? 'Total Drivers' : 'Total Services'}</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{isRide ? businessStats.driverCount : businessStats.serviceCount}</p>
          </div>
        </div>
        <div className="card p-6 border-none bg-white shadow-lg ring-1 ring-gray-200/50 flex items-center gap-5 hover:shadow-xl transition-shadow">
          <div className="h-14 w-14 bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-600 rounded-2xl flex items-center justify-center ring-1 ring-purple-100/50">
            {isRide ? <Activity className="h-7 w-7" /> : <Users className="h-7 w-7" />}
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRide ? 'Trip Volume' : 'Booking Volume'}</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{isRide ? businessStats.tripCount : businessStats.serviceCount}</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          {isRide ? 'Fleet' : 'Properties'}
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'team'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Users className="h-3.5 w-3.5" /> Team
        </button>
        {isRide && (
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'fleet'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Car className="h-3.5 w-3.5" /> Fleet Command
          </button>
        )}
        <button
          onClick={() => setActiveTab('support')}
          className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'support'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <MessageCircle className="h-3.5 w-3.5" /> Support
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'team' ? (
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
                  <p className="text-gray-500 text-sm leading-relaxed">
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
                            {prop.asset_type === 'HOTEL' ? <Hotel className="h-3.5 w-3.5 text-primary-600" /> : prop.asset_type === 'VEHICLE' ? <Car className="h-3.5 w-3.5 text-blue-600" /> : <Utensils className="h-3.5 w-3.5 text-emerald-600" />}
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

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{isRide ? 'Seats' : 'Rooms'}</p>
                          <p className="text-sm font-black text-gray-900">{isRide ? (prop.properties?.seats as string) || '4' : '0'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{isRide ? 'Condition' : 'Staff'}</p>
                          <p className="text-sm font-black text-gray-900">{isRide ? ((prop.properties?.status as string) || 'Good') : '--'}</p>
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
                      <div className="bg-orange-500/90 backdrop-blur-md text-white px-6 py-2 rounded-2xl font-black tracking-widest text-lg shadow-2xl uppercase transform -rotate-6 border border-orange-400">
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
