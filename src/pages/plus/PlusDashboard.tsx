import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../../app/store';
import {
    Sparkles, BarChart3, Zap, TrendingUp, Eye,
    ArrowRight, Crown, Shield, Star, CheckCircle
} from 'lucide-react';

export default function PlusDashboard() {
    const { user } = useSelector((state: RootState) => state.auth);

    const accountTier = user?.account_tier || 'FREE';

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

    return (
        <div className="max-w-5xl mx-auto space-y-8">
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 flex items-center gap-5 hover:shadow-xl transition-shadow border-none shadow-lg ring-1 ring-gray-200/50">
                    <div className="h-14 w-14 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Eye className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">1.5x</p>
                        <p className="text-xs text-gray-500">Boosted search ranking</p>
                    </div>
                </div>
                <div className="card p-6 flex items-center gap-5 hover:shadow-xl transition-shadow border-none shadow-lg ring-1 ring-gray-200/50">
                    <div className="h-14 w-14 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                        <Zap className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Boosts</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">3/mo</p>
                        <p className="text-xs text-gray-500">Listing boosts available</p>
                    </div>
                </div>
                <div className="card p-6 flex items-center gap-5 hover:shadow-xl transition-shadow border-none shadow-lg ring-1 ring-gray-200/50">
                    <div className="h-14 w-14 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Listings</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">25</p>
                        <p className="text-xs text-gray-500">Active listings allowed</p>
                    </div>
                </div>
            </div>

            {/* Plus Features */}
            <div className="card p-8 border-none shadow-lg">
                <h2 className="text-xl font-black text-gray-900 tracking-tight mb-6 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                    Your Plus Benefits
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { title: 'Analytics Preview', desc: 'See how your listings perform with basic analytics', icon: BarChart3 },
                        { title: '1.5x Visibility', desc: 'Your listings appear higher in search results', icon: Eye },
                        { title: '3 Monthly Boosts', desc: 'Boost your best listings to the top', icon: Zap },
                        { title: 'Priority Support', desc: 'Get faster responses from our support team', icon: Star },
                        { title: 'Plus Badge', desc: 'Show your Plus verification on your profile', icon: CheckCircle },
                        { title: '25 Active Listings', desc: 'List up to 25 items at the same time', icon: TrendingUp },
                    ].map((feature, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-purple-50 transition-colors">
                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-purple-500 shadow-sm flex-shrink-0">
                                <feature.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 text-sm">{feature.title}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

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
