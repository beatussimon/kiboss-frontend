import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../app/store';
import { fetchCurrentUser } from '../../features/auth/authSlice';
import { Price } from '../../context/CurrencyContext';
import api from '../../services/api';
import {
    Sparkles, Building2, Crown, Check, ArrowRight, Zap, Shield,
    BarChart3, Users, HeadphonesIcon, Car, Home, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TierInfo {
    tier_id: string;
    name: string;
    price_monthly_tzs: number;
    price_yearly_tzs: number;
    max_listings: number;
    max_boosts_per_month: number;
    visibility_multiplier: number;
    analytics_access: boolean;
    fleet_management: boolean;
    worker_management: boolean;
    support_inbox: boolean;
    priority_support: boolean;
    verified_badge: boolean;
    custom_branding: boolean;
    highlights: string[];
}

const tierIcons: Record<string, React.ReactNode> = {
    FREE: <Shield className="h-8 w-8" />,
    PLUS: <Sparkles className="h-8 w-8" />,
    BUSINESS: <Building2 className="h-8 w-8" />,
};

const tierGradients: Record<string, string> = {
    FREE: 'from-gray-50 to-gray-100 border-gray-200',
    PLUS: 'from-blue-50 to-indigo-50 border-blue-300',
    BUSINESS: 'from-purple-50 to-indigo-50 border-purple-400',
};

const tierAccents: Record<string, string> = {
    FREE: 'text-gray-600',
    PLUS: 'text-blue-600',
    BUSINESS: 'text-purple-600',
};

export default function UpgradePage() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [tiers, setTiers] = useState<TierInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    useEffect(() => {
        const fetchTiers = async () => {
            try {
                const response = await api.get('/users/tiers/');
                setTiers(response.data);
            } catch (error) {
                console.error('Failed to fetch tiers:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTiers();
    }, []);

    const handleUpgrade = async (tierId: string) => {
        // Staff cannot upgrade to BUSINESS
        if (tierId === 'BUSINESS' && user?.is_staff) {
            toast.error('Staff accounts cannot register as a business');
            return;
        }

        // For BUSINESS tier, show category selector
        if (tierId === 'BUSINESS') {
            setShowCategoryModal(true);
            return;
        }

        // For PLUS, upgrade immediately
        setIsUpgrading(tierId);
        try {
            const response = await api.post('/users/upgrade/', { tier: tierId });
            toast.success(response.data.message || 'Upgraded to Plus!');
            dispatch(fetchCurrentUser());
            setTimeout(() => navigate('/plus'), 1500);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to upgrade');
        } finally {
            setIsUpgrading(null);
        }
    };

    const handleBusinessCategorySelect = (category: 'RIDE' | 'ASSET') => {
        setShowCategoryModal(false);
        // Navigate to business registration with category pre-selected
        navigate(`/business/register?category=${category}`);
    };

    const currentTier = user?.account_tier || 'FREE';
    const isStaff = user?.is_staff || false;
    const tierOrder: Record<string, number> = { FREE: 0, PLUS: 1, BUSINESS: 2 };
    // Staff cannot be businesses — filter out BUSINESS tier
    const displayTiers = isStaff ? tiers.filter(t => t.tier_id !== 'BUSINESS') : tiers;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    // Staff don't need upgrades — they have full access
    if (user?.is_staff) {
        return (
            <div className="max-w-lg mx-auto py-20 text-center space-y-6 px-4">
                <div className="h-20 w-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto">
                    <Shield className="h-10 w-10" />
                </div>
                <h1 className="text-3xl font-black text-gray-900">Staff Account</h1>
                <p className="text-gray-500">Staff accounts have full platform access and don't require plan upgrades.</p>
                <button onClick={() => navigate('/')} className="btn-primary px-6 py-3 rounded-xl font-bold text-sm">Back to Home</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-1.5 rounded-full mb-4">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-bold text-purple-700">Upgrade Your Experience</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                    Choose Your Plan
                </h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    Unlock powerful features to grow your presence or business on Kiboss.
                </p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'yearly' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        Yearly
                        <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Save 17%</span>
                    </button>
                </div>
            </div>

            {/* Tier Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                {displayTiers.map((tier) => {
                    const isCurrentTier = currentTier === tier.tier_id;
                    const canUpgrade = tierOrder[tier.tier_id] > tierOrder[currentTier];
                    const price = billingCycle === 'monthly' ? tier.price_monthly_tzs : tier.price_yearly_tzs;

                    return (
                        <div
                            key={tier.tier_id}
                            className={`relative rounded-2xl border-2 p-6 transition-all ${isCurrentTier
                                ? `bg-gradient-to-b ${tierGradients[tier.tier_id]} ring-2 ring-offset-2 ring-primary-500`
                                : `bg-gradient-to-b ${tierGradients[tier.tier_id]} hover:shadow-xl hover:-translate-y-1`
                                }`}
                        >
                            {isCurrentTier && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    Current Plan
                                </div>
                            )}

                            {tier.tier_id === 'PLUS' && !isCurrentTier && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    Popular
                                </div>
                            )}

                            {/* Tier Header */}
                            <div className="text-center mb-6">
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm mb-3 ${tierAccents[tier.tier_id]}`}>
                                    {tierIcons[tier.tier_id]}
                                </div>
                                <h3 className="text-xl font-black text-gray-900">{tier.name}</h3>
                                <div className="mt-3">
                                    {price === 0 ? (
                                        <span className="text-3xl font-black text-gray-900">Free</span>
                                    ) : (
                                        <>
                                            <span className="text-3xl font-black text-gray-900">
                                                <Price amount={price} />
                                            </span>
                                            <span className="text-gray-500 text-sm">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Feature List */}
                            <ul className="space-y-3 mb-6">
                                {tier.highlights.map((highlight, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${tierAccents[tier.tier_id]}`} />
                                        <span className="text-sm text-gray-700">{highlight}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            {isCurrentTier ? (
                                <button
                                    disabled
                                    className="w-full py-3 rounded-xl bg-gray-200 text-gray-500 font-bold text-sm cursor-not-allowed"
                                >
                                    Current Plan
                                </button>
                            ) : canUpgrade ? (
                                <button
                                    onClick={() => handleUpgrade(tier.tier_id)}
                                    disabled={isUpgrading === tier.tier_id}
                                    className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${tier.tier_id === 'BUSINESS'
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20'
                                        }`}
                                >
                                    {isUpgrading === tier.tier_id ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                    ) : (
                                        <>
                                            {tier.tier_id === 'BUSINESS' ? 'Get Started' : `Upgrade to ${tier.name}`}
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-bold text-sm cursor-not-allowed"
                                >
                                    Included in your plan
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Feature Comparison Table */}
            <div className="mt-12 card p-6 overflow-x-auto">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Feature Comparison</h2>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 pr-4 font-bold">Feature</th>
                            {tiers.map((t) => (
                                <th key={t.tier_id} className={`py-3 text-center font-bold ${tierAccents[t.tier_id]}`}>
                                    {t.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="py-2.5 pr-4 text-gray-600">Max Listings</td>
                            {tiers.map((t) => (
                                <td key={t.tier_id} className="py-2.5 text-center font-medium">
                                    {t.max_listings === -1 ? '∞' : t.max_listings}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="py-2.5 pr-4 text-gray-600">Monthly Boosts</td>
                            {tiers.map((t) => (
                                <td key={t.tier_id} className="py-2.5 text-center font-medium">
                                    {t.max_boosts_per_month === -1 ? '∞' : t.max_boosts_per_month}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td className="py-2.5 pr-4 text-gray-600">Visibility Boost</td>
                            {tiers.map((t) => (
                                <td key={t.tier_id} className="py-2.5 text-center font-medium">{t.visibility_multiplier}x</td>
                            ))}
                        </tr>
                        {['analytics_access', 'fleet_management', 'worker_management', 'support_inbox', 'verified_badge'].map((feature) => (
                            <tr key={feature}>
                                <td className="py-2.5 pr-4 text-gray-600 capitalize">{feature.replace(/_/g, ' ')}</td>
                                {tiers.map((t) => (
                                    <td key={t.tier_id} className="py-2.5 text-center">
                                        {(t as any)[feature] ? (
                                            <Check className="h-4 w-4 text-green-500 mx-auto" />
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Business Category Selection Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Choose Your Business Type</h2>
                                <p className="text-sm text-gray-500 mt-1">Select how you operate to get the right tools and dashboard.</p>
                            </div>
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl"
                            >
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => handleBusinessCategorySelect('RIDE')}
                                className="group flex items-center gap-5 p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left"
                            >
                                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Car className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Ride Business</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Transport company, bus operator, taxi fleet, or shuttle service. Manage vehicles, drivers, trips, and passengers.
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                            </button>

                            <button
                                onClick={() => handleBusinessCategorySelect('ASSET')}
                                className="group flex items-center gap-5 p-6 border-2 border-gray-100 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-left"
                            >
                                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Home className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Asset Business</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Hotels, restaurants, equipment rental, or property management. Manage properties, rooms, services, and bookings.
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 flex-shrink-0" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
