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
  CreditCard
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Asset } from '../../types';
import { getMediaUrl } from '../../utils/media';
import VerificationBadge from '../../components/ui/VerificationBadge';
import ContactButton from '../../components/messaging/ContactButton';
import BusinessRegistrationForm from './BusinessRegistrationForm';
import FeedbackForm from '../../components/common/FeedbackForm';

export default function BusinessDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [properties, setProperties] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'YEARLY' | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      // Fetch only parent properties (Hotels/Restaurants) owned by me
      const res = await api.get('/assets/', {
        params: {
          owner: 'me',
          asset_type: 'HOTEL,RESTAURANT',
          is_active: 'any'
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

  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/users/corporate/register/', regData);
      toast.success('Business registration submitted for verification!');
      // Refresh user data would be ideal here via dispatch
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isRegistering && !isEditing && properties.length === 0 && user?.corporate_profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // ... (keeping marketing view as is)

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
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-600 rounded-2xl shadow-lg shadow-primary-200">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Corporate HQ</h1>
                <VerificationBadge tier="business" color="indigo" size="sm" />
              </div>
              <p className="text-gray-500 font-medium italic">Verified Business Partner</p>
            </div>
          </div>
          <p className="text-gray-500 font-medium max-w-md">Manage your properties, services, and inventory from one central hub.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ContactButton
            targetUserId="admin"
            label="Support / Platform Assistance"
            threadType="SUPPORT"
            subject="Corporate Support Request"
            variant="outline"
            className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest"
          />
          <Link to="/assets/create?mode=business" className="btn-primary px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-primary-500/20">
            <Plus className="h-5 w-5" />
            Add New Property
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-none bg-white shadow-sm ring-1 ring-gray-100 flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Hotel className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Properties</p>
            <p className="text-2xl font-black text-gray-900">{properties.length}</p>
          </div>
        </div>
        <div className="card p-6 border-none bg-white shadow-sm ring-1 ring-gray-100 flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Bed className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Services</p>
            <p className="text-2xl font-black text-gray-900">--</p>
          </div>
        </div>
        <div className="card p-6 border-none bg-white shadow-sm ring-1 ring-gray-100 flex items-center gap-4">
          <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking Volume</p>
            <p className="text-2xl font-black text-gray-900">--</p>
          </div>
        </div>
      </div>

      {/* Property List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">My Properties</h2>

        {properties.length === 0 ? (
          <div className="card p-20 text-center bg-gray-50 border-dashed border-2">
            <Building2 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No properties listed yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {properties.map((prop) => (
              <div key={prop.id} className="card p-0 overflow-hidden bg-white hover:shadow-2xl transition-all border-none ring-1 ring-gray-100 flex flex-col md:flex-row">
                <div className="w-full md:w-72 h-48 bg-gray-100 relative">
                  {prop.photos?.[0] ? (
                    <img src={getMediaUrl(prop.photos[0].url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-black">
                      KIBOSS PROPERTY
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-lg ${prop.verification_status === 'VERIFIED' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-orange-500 text-white border-orange-400'
                      }`}>
                      {prop.verification_status}
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {prop.asset_type === 'HOTEL' ? <Hotel className="h-4 w-4 text-primary-600" /> : <Utensils className="h-4 w-4 text-emerald-600" />}
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{prop.asset_type}</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{prop.name}</h3>
                        <p className="text-gray-500 text-sm font-medium mt-1">{prop.city}, {prop.country}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                          <Settings className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-50">
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Rooms</p>
                        <p className="text-sm font-black text-gray-900">0</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Staff</p>
                        <p className="text-sm font-black text-gray-900">--</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/assets/create?parent=${prop.id}&mode=service`}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Service
                      </Link>
                      <Link
                        to={`/assets/${prop.id}`}
                        className="px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-100 transition-all flex items-center gap-2"
                      >
                        View Public Page
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
