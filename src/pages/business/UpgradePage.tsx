import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../app/store';
import { fetchCurrentUser } from '../../features/auth/authSlice';
import api from '../../services/api';
import {
    Sparkles, Building2, Crown, Check, ArrowRight, Zap, Shield,
    UploadCloud, X, Copy, Image as ImageIcon, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Price } from '../../context/CurrencyContext';

interface OfflineMethod {
    id: number;
    network_name: string;
    payment_number: string;
    account_name: string;
    instructions: string;
}

export default function UpgradePage() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    
    const [methods, setMethods] = useState<OfflineMethod[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<OfflineMethod | null>(null);
    
    // New state for pending payments
    const [hasPendingSubscription, setHasPendingSubscription] = useState(false);
    const [isCheckingPending, setIsCheckingPending] = useState(true);
    
    // Form state
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsCheckingPending(true);
                // Check if user has an existing unapproved manual subscription payment
                const pendingRes = await api.get('/payments/manual-payments/?status=PENDING');
                const pendingData = pendingRes.data.results || pendingRes.data;
                // Filter locally just to be safe if backend doesn't filter by type
                const hasPending = pendingData.some((p: any) => p.booking_type === 'SUBSCRIPTION');
                if (hasPending) {
                    setHasPendingSubscription(true);
                }
            } catch (error) {
                console.error('Failed to check pending subscriptions:', error);
            } finally {
                setIsCheckingPending(false);
            }

            try {
                const response = await api.get('/payments/offline-methods/');
                const data = response.data.results || response.data;
                setMethods(data);
                if (data.length > 0) {
                    setSelectedMethod(data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch payment methods:', error);
            }
        };
        fetchInitialData();
    }, []);

    const currentTier = user?.account_tier || 'FREE';
    // We hardcode the plans to enforce the temporary rules without breaking the backend API
    const plans = [
        {
            id: 'FREE',
            name: 'Free Plan',
            price: 0,
            icon: <Shield className="h-8 w-8" />,
            highlights: ['Up to 3 Active Listings', 'Offer 3 Rides for Free', 'Basic Support'],
            accent: 'text-gray-600',
            bg: 'from-gray-50 to-gray-100 border-gray-200'
        },
        {
            id: 'PLUS',
            name: 'Plus Plan',
            price: 10000,
            icon: <Sparkles className="h-8 w-8" />,
            highlights: ['Up to 10 Active Listings', 'Available 100 Rides/mo', 'Listing Boosts Available', 'Priority Support'],
            accent: 'text-blue-600',
            bg: 'from-blue-50 to-indigo-50 border-blue-300'
        },
        {
            id: 'BUSINESS',
            name: 'Business Plan',
            price: 50000,
            icon: <Building2 className="h-8 w-8" />,
            highlights: ['Unlimited Active Listings', 'Unlimited Rides', 'Corporate Fleet Management', 'Worker Accounts', 'Advanced Analytics'],
            accent: 'text-purple-600',
            bg: 'from-purple-50 to-indigo-50 border-purple-400'
        }
    ];

    const handleUpgradeSelect = (planId: string) => {
        if (hasPendingSubscription) {
            toast('You already have a pending upgrade request. Please wait for verification.', { icon: '⏳' });
            return;
        }
        if (planId === 'BUSINESS') {
            toast('The Business plan is coming soon!', { icon: '🚀' });
            return;
        }
        setSelectedPlan(planId);
        setShowPaymentModal(true);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReceiptFile(e.target.files[0]);
        }
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMethod || !selectedPlan) return;
        if (!confirmationMessage && !receiptFile) {
            toast.error("Please provide a confirmation message or upload a receipt screenshot.");
            return;
        }
        if (!receiptFile) {
            toast.error("Receipt screenshot is required for payment verification.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('booking_type', 'SUBSCRIPTION');
            formData.append('plan_type', selectedPlan);
            formData.append('payment_method', selectedMethod.id.toString());
            formData.append('amount', selectedPlan === 'PLUS' ? '10000' : '0');
            formData.append('currency', 'TZS');
            
            if (confirmationMessage) formData.append('confirmation_message', confirmationMessage);
            if (receiptFile) formData.append('receipt_image', receiptFile);

            await api.post('/payments/manual-payments/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Payment proof submitted successfully! Admins will review it shortly.');
            setShowPaymentModal(false);
            setConfirmationMessage('');
            setReceiptFile(null);
            dispatch(fetchCurrentUser());
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit payment proof.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckingPending) {
         return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="max-w-5xl mx-auto py-10">
            {/* Pending Subscription Banner */}
            {hasPendingSubscription && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 mb-8 mx-4 flex items-start gap-4 animate-in fade-in duration-500">
                    <div className="bg-amber-100 p-3 rounded-2xl shrink-0"><Clock className="h-6 w-6 text-amber-600" /></div>
                    <div>
                        <h3 className="text-lg font-black text-amber-900 mb-1">Upgrade Pending Verification</h3>
                        <p className="text-sm font-medium text-amber-700">We have received your payment proof and our team is currently verifying it. Your account tier will be upgraded automatically within a few hours. Thank you for your patience!</p>
                    </div>
                </div>
            )}
            
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-1.5 rounded-full mb-4">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-bold text-purple-700">Premium Plans</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                    Upgrade Your Experience
                </h1>
                <p className="text-gray-500 max-w-xl mx-auto text-lg">
                    Unlock powerful features to grow your business, increase visibility, and get priority support.
                </p>
            </div>

            {/* Plans List */}
            <div className="grid md:grid-cols-3 gap-8 px-4">
                {plans.map((plan) => {
                    const isCurrentPlan = currentTier === plan.id;
                    const isComingSoon = plan.id === 'BUSINESS';

                    return (
                        <div key={plan.id} className={`relative rounded-3xl border-2 p-8 transition-all duration-300 ${isCurrentPlan ? `bg-gradient-to-b ${plan.bg} ring-4 ring-primary-500/20 scale-105 shadow-xl` : `bg-white hover:border-${plan.accent.split('-')[1]}-300 hover:shadow-2xl`}`}> 
                            {isCurrentPlan && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                    Current Plan
                                </div>
                            )}

                            <div className="mb-8 text-center flex flex-col items-center">
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 shadow-inner mb-4 ${plan.accent}`}>
                                    {plan.icon}
                                </div>
                                <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
                                <div className="mt-4">
                                    {plan.price === 0 ? (
                                        <span className="text-4xl font-black text-gray-900">Free</span>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <span className="text-4xl font-black text-gray-900"><Price amount={plan.price} /></span>
                                            <span className="text-gray-500 font-medium">/month</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.highlights.map((highlight, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${plan.accent}`} />
                                        <span className="text-gray-700 font-medium">{highlight}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgradeSelect(plan.id)}
                                disabled={isCurrentPlan || hasPendingSubscription}
                                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                                    isCurrentPlan ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border-2 border-gray-200' :
                                    isComingSoon ? 'bg-gray-800 text-white hover:bg-gray-700 hover:shadow-xl' :
                                    hasPendingSubscription ? 'bg-amber-100 text-amber-500 cursor-not-allowed shadow-none border-2 border-amber-200' :
                                    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl shadow-blue-500/30'
                                }`}
                            >
                                {isCurrentPlan ? 'Active' : isComingSoon ? 'Coming Soon' : hasPendingSubscription ? 'Pending Review' : 'Upgrade Now'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16" />
                            <div className="relative">
                                <h3 className="text-2xl font-black text-gray-900">Manual Payment</h3>
                                <p className="text-gray-500 mt-1 font-medium">Complete your upgrade to Plus Plan by making an offline payment.</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors relative z-10"><X className="h-6 w-6 text-gray-500" /></button>
                        </div>

                        <div className="p-8 pb-3 max-h-[70vh] overflow-y-auto">
                            {/* Amount Due Box */}
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white text-center shadow-inner mb-8">
                                <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-1">Total Amount Due</p>
                                <p className="text-4xl font-black tracking-tight"><Price amount={10000} /></p>
                            </div>

                            {/* Method Selection */}
                            <div className="mb-6">
                                <h4 className="font-bold text-gray-900 mb-3 text-lg">1. Choose Payment Method</h4>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {methods.map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedMethod(method)}
                                            className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all border-2 ${selectedMethod?.id === method.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50'}`}
                                        >
                                            {method.network_name}
                                        </button>
                                    ))}
                                    {methods.length === 0 && <p className="text-sm text-gray-500">No payment methods configured.</p>}
                                </div>
                            </div>

                            {selectedMethod && (
                                <div className="space-y-8">
                                    {/* Payment Details */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                                        <h4 className="font-bold text-gray-900 mb-4 text-lg">2. Make the Transfer</h4>
                                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{selectedMethod.instructions}</p>
                                        
                                        <div className="space-y-3">
                                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Number / Network</p>
                                                    <p className="font-black text-gray-900 text-lg tracking-tight">{selectedMethod.payment_number}</p>
                                                    <p className="text-sm text-gray-500 font-medium">{selectedMethod.account_name}</p>
                                                </div>
                                                <button onClick={() => handleCopy(selectedMethod.payment_number)} className="p-3 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all group-hover:scale-105 active:scale-95">
                                                    <Copy className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Proof Submission */}
                                    <form id="payment-proof-form" onSubmit={handleSubmitPayment}>
                                        <h4 className="font-bold text-gray-900 mb-4 text-lg">3. Submit Proof of Payment</h4>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Transaction ID / SMS Message</label>
                                                <textarea
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors bg-gray-50 hover:bg-white"
                                                    rows={3}
                                                    placeholder="Paste the confirmation message or transaction ID..."
                                                    value={confirmationMessage}
                                                    onChange={e => setConfirmationMessage(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Receipt Screenshot <span className="text-red-500">*</span></label>
                                                <label className={`w-full flex-col flex items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${receiptFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                    {receiptFile ? (
                                                        <div className="flex items-center gap-3 text-green-700 font-bold">
                                                            <div className="bg-green-100 p-2 rounded-lg"><ImageIcon className="h-6 w-6" /></div>
                                                            {receiptFile.name}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center">
                                                            <div className="bg-gray-100 p-3 rounded-full inline-block mb-3 text-gray-400"><UploadCloud className="h-6 w-6" /></div>
                                                            <p className="text-sm font-bold text-gray-600">Click to upload receipt</p>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                className="px-6 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="payment-proof-form"
                                disabled={isSubmitting || methods.length === 0}
                                className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            >
                                {isSubmitting ? (
                                    <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                    <>
                                        Submit Proof <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Subscription Section */}
            {currentTier !== 'FREE' && (
                <div className="mt-16 px-4">
                    <div className="card p-8 border-2 border-gray-200 rounded-3xl">
                        <h3 className="text-lg font-black text-gray-900 mb-2">Cancel Subscription</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Cancellation requests are reviewed by our team to ensure all obligations are settled.
                            Your subscription remains active until the review is complete.
                        </p>
                        <button
                            onClick={async () => {
                                if (!confirm(
                                    'Are you sure you want to request cancellation?\n\n' +
                                    'Your request will be submitted for admin review. ' +
                                    'Your subscription stays active until an admin processes your request. ' +
                                    'You will be notified once the review is complete.'
                                )) return;
                                try {
                                    await api.delete('/users/corporate/register/');
                                    toast.success('Cancellation request submitted for admin review.');
                                    dispatch(fetchCurrentUser());
                                } catch (err: any) {
                                    toast.error(err.response?.data?.error || 'Failed to submit cancellation request.');
                                }
                            }}
                            className="px-6 py-3 rounded-xl font-bold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all"
                        >
                            Request Cancellation
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
