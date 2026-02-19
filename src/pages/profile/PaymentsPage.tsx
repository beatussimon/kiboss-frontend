import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchPayments, fetchPaymentSummary } from '../../features/payments/paymentsSlice';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PaymentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { payments, summary, isLoading, error } = useSelector((state: RootState) => state.payments);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchPayments());
    dispatch(fetchPaymentSummary());
  }, [dispatch]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ESCROW': return <Shield className="h-4 w-4 text-warning-500" />;
      case 'RELEASED': return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'REFUNDED': return <ArrowDownLeft className="h-4 w-4 text-primary-500" />;
      default: return <AlertCircle className="h-4 w-4 text-error-500" />;
    }
  };

  const formatCurrency = (amount: string | number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payments & Wallet</h1>
        <p className="text-gray-500 mt-1">Manage your transactions, escrow funds, and payout history.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-50 rounded-lg">
              <CreditCard className="h-6 w-6 text-primary-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Paid</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_paid)}</span>
            <span className="text-xs text-gray-400 mt-1">Lifetime spending</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <ArrowUpRight className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Received</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_received)}</span>
            <span className="text-xs text-gray-400 mt-1">Earnings available for payout</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-warning-50 rounded-lg">
              <Shield className="h-6 w-6 text-warning-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">In Escrow</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(summary.in_escrow)}</span>
            <span className="text-xs text-gray-400 mt-1">Held securely during rentals</span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
          <button className="text-sm font-medium text-primary-600 hover:text-primary-700">Download CSV</button>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500">No transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/30">
                  <th className="px-6 py-3">Transaction ID</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-500">{payment.id.split('-')[0]}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{new Date(payment.escrow_held_at || '').toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 capitalize">{payment.payment_method.replace('_', ' ').toLowerCase()}</span>
                        <span className="text-xs text-gray-400">Booking {payment.booking.split('-')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.status)}
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          payment.status === 'RELEASED' ? 'text-green-600' : 
                          payment.status === 'ESCROW' ? 'text-warning-600' : 'text-gray-500'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${
                        payment.status === 'RELEASED' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/bookings/${payment.booking}`} className="text-xs font-bold text-primary-600 hover:text-primary-700">
                        View Booking
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="mt-8 flex items-start p-4 bg-primary-50 rounded-xl border border-primary-100">
        <Shield className="h-5 w-5 text-primary-600 mr-3 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-primary-900">Secure Payments via Zenopay</h4>
          <p className="text-xs text-primary-700 mt-1">
            All payments are held in secure escrow until the rental or service is completed and both parties are satisfied. 
            Funds are released automatically 24 hours after completion unless a dispute is raised.
          </p>
        </div>
      </div>
    </div>
  );
}
