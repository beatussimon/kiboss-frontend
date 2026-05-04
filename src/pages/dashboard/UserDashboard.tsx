import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../app/store';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Building2, Crown, Sparkles, BarChart3, Zap, TrendingUp, Eye,
  ArrowRight, Shield, Star, CheckCircle, Activity, AlertTriangle,
  Trophy, Percent, UploadCloud, Users, LayoutDashboard, Plus,
  ChevronRight, MessageCircle, Clock, Settings, Car, Bed, Package,
  ShieldCheck, Briefcase
} from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchCurrentUser } from '../../features/auth/authSlice';
import PaymentMethods from '../plus/PaymentMethods';
import WorkerManagement from '../business/WorkerManagement';
import FleetCommand from '../business/FleetCommand';
import MyListingsPage from '../plus/MyListingsPage';

export default function UserDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [discountForm, setDiscountForm] = useState({ percentage: 10, isApplying: false, success: false, error: '' });
  const [businessStats, setBusinessStats] = useState({ tripCount: 0, serviceCount: 0 });

  const tier = user?.account_tier || 'FREE';
  const isBusiness = tier === 'BUSINESS' || !!user?.corporate_profile;
  const isPlus = tier === 'PLUS';
  const isCorporateVerified = user?.corporate_profile?.verification_status === 'VERIFIED';
  const isCorporatePending = user?.corporate_profile?.verification_status === 'PENDING';
  const isCorporateRejected = user?.corporate_profile?.verification_status === 'REJECTED';

  useEffect(() => {
    if (isPlus || isBusiness) {
      fetchAnalytics();
      if (isCorporateVerified) {
        fetchBusinessStats();
      }
    } else {
      setIsLoading(false);
    }
  }, [isPlus, isBusiness, isCorporateVerified]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/users/me/analytics/');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinessStats = async () => {
    try {
      const category = user?.corporate_profile?.business_category || 'ASSET';
      if (category === 'RIDE') {
        const ridesRes = await api.get('/rides/', { params: { driver: 'me', status: 'COMPLETED' } });
        setBusinessStats(prev => ({ ...prev, tripCount: ridesRes.data.count ?? (ridesRes.data.results?.length || 0) }));
      } else {
        const servicesRes = await api.get('/assets/', { params: { owner: 'me', asset_type: 'HOTEL_ROOM,CONFERENCE_HALL,DINING_TABLE', context: 'corporate' } });
        setBusinessStats(prev => ({ ...prev, serviceCount: servicesRes.data.count ?? (servicesRes.data.results?.length || 0) }));
      }
    } catch (err) {}
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountForm(p => ({ ...p, isApplying: true, success: false, error: '' }));
    try {
      await api.post('/assets/bulk_discount/', { percentage: discountForm.percentage });
      setDiscountForm(p => ({ ...p, isApplying: false, success: true }));
      setTimeout(() => setDiscountForm(p => ({ ...p, success: false })), 5000);
    } catch (err: any) {
      setDiscountForm(p => ({ ...p, isApplying: false, error: err.response?.data?.error || 'Failed to apply discount' }));
    }
  };

  if (!isPlus && !isBusiness) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="h-20 w-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto">
          <Sparkles className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Pro Dashboard</h1>
        <p className="text-gray-500 max-w-md mx-auto">Upgrade to Plus or Business to access analytics, boosts, and advanced management tools.</p>
        <button onClick={() => navigate('/upgrade')} className="btn-primary px-8 py-3 rounded-xl font-bold shadow-lg">Upgrade Now</button>
      </div>
    );
  }

  if (isBusiness && !user?.corporate_profile) {
    return (
        <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
          <div className="h-24 w-24 bg-primary-50 text-primary-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="h-12 w-12" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Register Your Business</h1>
          <p className="text-gray-500 font-medium text-lg">You're on the Business plan. Complete registration to unlock your dashboard.</p>
          <button onClick={() => navigate('/business/register')} className="btn-primary px-10 py-4 rounded-2xl shadow-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 mx-auto">
            Register Business <ChevronRight className="h-5 w-5" />
          </button>
        </div>
    );
  }

  if (isBusiness && isCorporatePending) {
    return (
        <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
          <div className="h-24 w-24 bg-orange-50 text-orange-500 rounded-[2.5rem] flex items-center justify-center mx-auto animate-pulse">
            <Clock className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Verification Pending</h1>
          <p className="text-gray-500 font-medium">Our team is reviewing your business credentials. You'll be notified once activated.</p>
          <div className="flex justify-center gap-4">
              <Link to="/profile" className="btn-secondary px-6 py-2.5 rounded-xl text-xs font-black uppercase">Edit Profile</Link>
              <Link to="/" className="btn-primary px-6 py-2.5 rounded-xl text-xs font-black uppercase">Go Home</Link>
          </div>
        </div>
    );
  }

  const visibleTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'listings', label: 'Listings', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    ...(isBusiness ? [{ id: 'team', label: 'Team', icon: Users }] : []),
    ...(isBusiness && user?.corporate_profile?.business_category === 'RIDE' ? [{ id: 'fleet', label: 'Fleet', icon: Car }] : []),
    { id: 'marketing', label: 'Marketing', icon: Percent },
    { id: 'payments', label: 'Receiving', icon: Star },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl mb-6">
        <div className={`absolute inset-0 ${
          isBusiness 
            ? 'bg-gradient-to-br from-gray-900 via-primary-950 to-gray-900' 
            : 'bg-gradient-to-br from-purple-700 via-indigo-700 to-primary-700'
        }`} />
        
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
        
        <div className="relative p-6 md:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isBusiness ? <Building2 className="h-5 w-5 text-primary-400" /> : <Crown className="h-5 w-5 text-yellow-300" />}
                <span className="text-xs font-black uppercase tracking-widest text-white/50">
                  {isBusiness ? user?.corporate_profile?.company_name || 'Business' : 'Plus Plan'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none uppercase">
                {user?.first_name}'s Dashboard
              </h1>
              <p className="text-white/50 text-sm mt-2 font-medium">
                {isBusiness ? 'Corporate management and analytics' : 'Analytics, boosts, and priority tools'}
              </p>
            </div>
            
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 min-w-[180px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Plan Status</p>
              <p className="text-sm font-black text-white">
                {isBusiness ? 'Business' : 'Plus'} — 
                <span className={analytics?.subscription_status === 'ACTIVE' ? 'text-green-400' : 'text-amber-400'}>
                  {' '}{analytics?.subscription_status || 'ACTIVE'}
                </span>
              </p>
              {analytics?.subscription_expires_at && (
                <p className="text-[10px] text-white/40 mt-1">
                  Renews {new Date(analytics.subscription_expires_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}
                </p>
              )}
              <Link to="/subscription" className="text-[10px] text-primary-300 font-bold hover:text-primary-200 mt-1 block">
                Manage →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto scrollbar-none">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 md:px-6 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Earnings', value: <Price amount={analytics?.total_earnings || 0} />, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Completed', value: analytics?.total_completed_bookings || 0, icon: CheckCircle, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' },
              { label: 'Pending', value: analytics?.pending_requests || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Views', value: analytics?.views_count || 0, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</p>
              </div>
            ))}
          </div>

          {analytics?.advanced_analytics?.revenue_trend && (
            <div className="card p-6 bg-white dark:bg-gray-900 border-none shadow-sm">
                <h2 className="text-lg font-black mb-6 uppercase tracking-tight flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary-500" /> Revenue Trend
                </h2>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.advanced_analytics.revenue_trend}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={v => `$${v}`} />
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
          )}

          {analytics?.advanced_analytics?.top_listings && (
              <div className="card bg-white dark:bg-gray-900 border-none shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" /> Top Listings
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">Listing</th>
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Bookings</th>
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {analytics.advanced_analytics.top_listings.map((l: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-sm">{l.name}</td>
                                    <td className="px-6 py-4 text-right text-sm">{l.bookings}</td>
                                    <td className="px-6 py-4 text-right font-black text-green-600"><Price amount={l.earnings} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          )}
        </div>
      )}

      {activeTab === 'listings' && (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase">My Listings</h2>
                <Link to="/assets/create" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm rounded-xl">
                    <Plus className="h-4 w-4" /> Add Listing
                </Link>
            </div>
            <MyListingsPage />
        </div>
      )}

      {activeTab === 'analytics' && analytics?.advanced_analytics && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card p-6 bg-white dark:bg-gray-900 border-none shadow-sm relative overflow-hidden">
                      <Star className="absolute -right-4 -top-4 h-24 w-24 text-gray-900 opacity-[0.03]" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Host Rating</p>
                      <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black">{analytics.advanced_analytics.overall_rating}</span>
                          <span className="text-sm text-gray-400 font-bold">/ 5.0</span>
                      </div>
                  </div>
                  <div className="card p-6 bg-white dark:bg-gray-900 border-none shadow-sm relative overflow-hidden">
                      <AlertTriangle className="absolute -right-4 -top-4 h-24 w-24 text-gray-900 opacity-[0.03]" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cancellation Rate</p>
                      <span className="text-4xl font-black">{analytics.advanced_analytics.cancellation_rate}%</span>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'team' && isBusiness && <WorkerManagement />}
      {activeTab === 'fleet' && isBusiness && <FleetCommand />}

      {activeTab === 'marketing' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="card p-8 bg-white dark:bg-gray-900 border-none shadow-sm">
            <h2 className="text-xl font-black flex items-center gap-2 mb-2 uppercase">
              <Percent className="h-6 w-6 text-primary-500" /> Bulk Discount
            </h2>
            <p className="text-gray-500 text-sm mb-6">Apply a global percentage discount to all your active listings instantly.</p>
            <form onSubmit={handleApplyDiscount} className="max-w-md flex gap-3">
              <input type="number" min="1" max="99" value={discountForm.percentage} 
                onChange={e => setDiscountForm(p => ({...p, percentage: parseInt(e.target.value) || 0}))}
                className="flex-1 input p-3 font-black text-center" />
              <button type="submit" disabled={discountForm.isApplying} className="btn-primary px-6 rounded-xl font-black uppercase text-xs">
                {discountForm.isApplying ? '...' : 'Apply Sale'}
              </button>
            </form>
            {discountForm.success && <p className="text-green-600 text-xs font-bold mt-2">Discounts applied successfully!</p>}
          </div>
          <div className="card p-8 bg-white dark:bg-gray-900 border-none shadow-sm flex items-center justify-between">
            <div>
                <h2 className="text-xl font-black flex items-center gap-2 mb-1 uppercase">
                    <UploadCloud className="h-5 w-5 text-purple-500" /> Listing Boosting
                </h2>
                <p className="text-gray-500 text-sm">Your plan includes a {isBusiness ? '2.5x' : '1.5x'} visibility multiplier.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-xs font-black uppercase tracking-widest">Active</span>
              <button onClick={() => toast.success('Promotion purchase initiated.')} className="btn-primary px-4 py-1.5 text-xs rounded-full uppercase tracking-widest">Purchase Promotion</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
            <div className="bg-primary-50 dark:bg-primary-900/10 p-6 rounded-2xl border border-primary-100 dark:border-primary-800 mb-6">
                <p className="text-sm text-primary-800 dark:text-primary-300 font-medium">Manage how you receive payments from customers. These methods will be shown to bookers during checkout.</p>
            </div>
            <PaymentMethods />
        </div>
      )}
    </div>
  );
}
