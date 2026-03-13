import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { RootState } from '../../app/store';
import {
    Sparkles, BarChart3, Zap, TrendingUp, Eye,
    ArrowRight, Crown, Shield, Star, CheckCircle,
    Activity, AlertTriangle, Trophy, Percent, UploadCloud, Users
} from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function PlusDashboard() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MARKETING' | 'AUDIENCE'>('OVERVIEW');
    const [discountForm, setDiscountForm] = useState({ percentage: 10, isApplying: false, success: false, error: '' });

    const accountTier = user?.account_tier || 'FREE';

    useEffect(() => {
        if (accountTier === 'PLUS' || accountTier === 'BUSINESS') {
            api.get('/users/me/analytics/')
                .then(res => setAnalytics(res.data))
                .catch(console.error)
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [accountTier]);

    // If not Plus, redirect them
    if (accountTier !== 'PLUS') {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
                <div className="h-20 w-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto">
                    <Sparkles className="h-10 w-10" />
                </div>
                <h1 className="text-3xl font-black text-gray-900">Plus Plan Required</h1>
                <p className="text-gray-500 max-w-md mx-auto">
                    Upgrade to the Plus plan to access analytics, boosts, and priority support.
                </p>
                <Link
                    to="/upgrade"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    <Sparkles className="h-5 w-5" />
                    Upgrade Now
                    <ArrowRight className="h-5 w-5" />
                </Link>
            </div>
        );
    }

    const handleApplyDiscount = async (e: React.FormEvent) => {
        e.preventDefault();
        setDiscountForm(p => ({ ...p, isApplying: true, success: false, error: '' }));
        try {
            const res = await api.post('/assets/bulk_discount/', { percentage: discountForm.percentage });
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

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <Crown className="h-6 w-6 text-yellow-300" />
                        <span className="text-sm font-black uppercase tracking-widest text-purple-200">Plus Plan</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                        Welcome, {user?.first_name || 'Member'}
                    </h1>
                    <p className="text-purple-200 mt-2 max-w-xl">
                        You have access to enhanced analytics, listing boosts, and priority support.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar pb-1">
                <button
                    onClick={() => setActiveTab('OVERVIEW')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'OVERVIEW' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <BarChart3 className="h-4 w-4" />
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('MARKETING')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'MARKETING' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <Percent className="h-4 w-4" />
                    Marketing Center
                </button>
                <button
                    onClick={() => setActiveTab('AUDIENCE')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'AUDIENCE' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                >
                    <Users className="h-4 w-4" />
                    Audience Insights
                </button>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'OVERVIEW' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card p-5 flex items-center gap-4 hover:shadow-xl transition-shadow border-none shadow-lg ring-1 ring-gray-200/50">
                        <div className="h-12 w-12 bg-gradient-to-br from-green-50 to-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Earnings</p>
                        <p className="text-2xl font-black text-gray-900 mt-1"><Price amount={analytics?.total_earnings || 0} /></p>
                    </div>
                </div>
                <div className="card p-5 flex items-center gap-4 hover:shadow-xl transition-shadow border-none shadow-lg ring-1 ring-gray-200/50">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed Bookings</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{analytics?.total_completed_bookings || 0}</p>
                    </div>
                </div>
                <div className="card p-5 flex items-center gap-4 hover:shadow-xl transition-shadow border-none shadow-lg ring-1 ring-gray-200/50">
                    <div className="h-12 w-12 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                        <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Requests</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{analytics?.pending_requests || 0}</p>
                    </div>
                </div>
                <div className="card p-5 flex items-center gap-4 hover:shadow-xl transition-shadow border-none shadow-lg ring-1 ring-gray-200/50">
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Eye className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Listing Views</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{analytics?.views_count || 0}</p>
                    </div>
                </div>
            </div>

            {/* Advanced Analytics - Charts & Tables */}
            {analytics?.advanced_analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="card p-6 border-none shadow-lg lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-500" />
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
                        <div className="card p-6 border-none shadow-lg bg-gradient-to-br from-indigo-50 to-white relative overflow-hidden">
                            <Star className="absolute -right-4 -top-4 h-24 w-24 text-indigo-100 opacity-50" />
                            <h3 className="text-sm font-black text-gray-500 tracking-widest uppercase mb-1">Host Rating</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-gray-900">{analytics.advanced_analytics.overall_rating}</span>
                                <span className="text-sm text-gray-500 font-bold">/ 5.0</span>
                            </div>
                            <div className="flex gap-1 mt-3">
                                {[1,2,3,4,5].map(star => (
                                    <Star key={star} className={`h-4 w-4 ${star <= Math.round(analytics.advanced_analytics.overall_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                ))}
                            </div>
                        </div>

                        <div className="card p-6 border-none shadow-lg bg-gradient-to-br from-red-50 to-white relative overflow-hidden">
                            <AlertTriangle className="absolute -right-4 -top-4 h-24 w-24 text-red-100 opacity-50" />
                            <h3 className="text-sm font-black text-gray-500 tracking-widest uppercase mb-1">Cancellation Rate</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-gray-900">{analytics.advanced_analytics.cancellation_rate}%</span>
                            </div>
                            <p className="text-xs font-bold text-gray-500 mt-2">
                                {analytics.advanced_analytics.cancellation_rate > 10 ? 'High capacity loss' : 'Healthy engagement'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Listings Table */}
            {analytics?.advanced_analytics?.top_listings?.length > 0 && (
                <div className="card border-none shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
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
                                                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                                                    #{index + 1}
                                                </div>
                                                <span className="font-bold text-gray-900">{listing.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-600">
                                            {listing.bookings}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-green-600">
                                            <Price amount={listing.earnings} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <div className="card p-8 border-none shadow-lg mb-8">
                <h2 className="text-xl font-black text-gray-900 tracking-tight mb-6 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    Usage & Limits
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility Multiplier</p>
                        <p className="text-3xl font-black text-gray-900 mt-1 flex items-baseline gap-2">
                            {analytics?.visibility_multiplier || 1.5}x
                            <span className="text-xs text-gray-500 font-medium tracking-normal block mt-1">Boosted search ranking</span>
                        </p>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rides This Month</p>
                        <p className="text-3xl font-black text-gray-900 mt-1 flex items-baseline gap-2">
                            {analytics?.rides_this_month || 0} <span className="text-sm text-gray-400">/ {analytics?.max_rides_per_month || 100}</span>
                            <span className="text-xs text-gray-500 font-medium tracking-normal block mt-1">Monthly limit tracker</span>
                        </p>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Listings</p>
                        <p className="text-3xl font-black text-gray-900 mt-1 flex items-baseline gap-2">
                            {analytics?.active_listings || 0} <span className="text-sm text-gray-400">/ {analytics?.max_assets || 10}</span>
                            <span className="text-xs text-gray-500 font-medium tracking-normal block mt-1">Active listings allowed</span>
                        </p>
                    </div>
                </div>
            </div>
            </div>
            )}

            {/* TAB CONTENT: MARKETING */}
            {activeTab === 'MARKETING' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="card p-8 border-none shadow-lg bg-gradient-to-br from-indigo-50 to-white">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <Percent className="h-6 w-6 text-indigo-500" />
                                    Global Discount Campaign
                                </h2>
                                <p className="text-gray-500 mt-1 max-w-xl text-sm">
                                    Run a flash sale by quickly applying a single percentage discount across all your active listings at once. This permanently updates current pricing rules.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleApplyDiscount} className="max-w-md bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
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
                                        className="block w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors font-bold text-gray-900"
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

                    <div className="card p-8 border-none shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <UploadCloud className="h-5 w-5 text-purple-500" />
                                    Listing Boosting
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Your Plus plan gives you an automatic 1.5x visibility multiplier. You can optionally boost specific listings further (coming soon).
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 font-black text-xs uppercase tracking-widest rounded-full">
                                Active (1.5x)
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: AUDIENCE */}
            {activeTab === 'AUDIENCE' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="card p-12 border-none shadow-lg text-center flex flex-col items-center justify-center">
                        <div className="h-20 w-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                            <Users className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900">Audience Insights</h2>
                        <p className="text-gray-500 max-w-md mt-2">
                            Deep demographics, customer location data, and booking time heatmaps are being gathered for your listings. Check back next month as we compile your report!
                        </p>
                    </div>
                </div>
            )}

            {/* Upgrade to Business CTA */}
            <div className="card p-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white border-none shadow-2xl rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full -mr-20 -mt-20" />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-black tracking-tight">Ready to go bigger?</h3>
                        <p className="text-gray-400 mt-1 text-sm">
                            Upgrade to the Business plan for unlimited listings, fleet management, worker tools, and full analytics.
                        </p>
                    </div>
                    <Link
                        to="/upgrade"
                        className="flex-shrink-0 px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                        Upgrade to Business
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
