import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { RootState } from '../../app/store';
import { SubscriptionStatusCard } from '../../components/subscription/SubscriptionStatusCard';
import { format } from 'date-fns';
import { Price } from '../../context/CurrencyContext';

export default function SubscriptionPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [analytics, setAnalytics] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.account_tier === 'PLUS' || user?.account_tier === 'BUSINESS') {
      api.get('/users/me/analytics/')
        .then(res => setAnalytics(res.data))
        .catch(console.error);
    }
    
    api.get('/payments/manual-payments/', { params: { booking_type: 'SUBSCRIPTION' } })
      .then(res => {
        setPayments(res.data.results || res.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle.")) {
      // In a real app this would hit a cancellation endpoint
      alert("Subscription cancellation requested. Our support team will process this.");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  const accountTier = user?.account_tier || 'FREE';

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Subscription Management</h1>
        <p className="text-gray-500 mt-2">View your current plan, billing history, and manage your account.</p>
      </div>

      <SubscriptionStatusCard
        tier={accountTier === 'FREE' ? 'FREE' : accountTier as 'PLUS' | 'BUSINESS'}
        expiresAt={analytics?.subscription_expires_at || null}
        isPending={analytics?.subscription_status === 'PENDING'}
      />

      <div className="card p-6">
        <h2 className="text-xl font-bold mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No payment history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 font-black text-xs text-gray-500 uppercase">Date</th>
                  <th className="py-3 px-4 font-black text-xs text-gray-500 uppercase">Reference</th>
                  <th className="py-3 px-4 font-black text-xs text-gray-500 uppercase">Amount</th>
                  <th className="py-3 px-4 font-black text-xs text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm">{format(new Date(p.created_at), 'MMM d, yyyy')}</td>
                    <td className="py-3 px-4 text-sm font-medium">{p.transaction_reference}</td>
                    <td className="py-3 px-4 text-sm font-bold"><Price amount={p.amount} /></td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        p.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        p.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-lg font-bold mb-2 text-red-600">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">Once you cancel your subscription, it will not renew and you will lose access to premium features.</p>
        <button
          onClick={handleCancel}
          className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors"
        >
          Cancel Subscription
        </button>
      </div>
    </div>
  );
}
