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
      case 'RELEASED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'REFUNDED': return <ArrowDownLeft className="h-4 w-4 text-primary-500" />;
      default: return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatCurrency = (amount: string | number, currency = 'TZS') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments & Wallet</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your transactions and security holds.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary-50 rounded-lg">
              <CreditCard className="h-6 w-6 text-primary-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Paid</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.total_paid)}</span>
            <span className="text-xs text-gray-400 mt-1">Direct payments confirmed</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Received</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.total_received)}</span>
            <span className="text-xs text-gray-400 mt-1">Confirmed earnings</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Shield className="h-6 w-6 text-warning-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Confirmation</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.in_escrow)}</span>
            </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h2>
          <button onClick={() => {
              const csv = payments.map((p: any) => `${p.id},${p.created_at},${p.payment_method},${p.status},${p.amount}`).join('\n');
              const blob = new Blob([`ID,Date,Method,Status,Amount\n${csv}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click();
            }} className="text-sm font-medium text-primary-600 hover:text-primary-700">Download CSV</button>
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
            <p className="text-gray-500 dark:text-gray-400">No transactions yet.</p>
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
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{payment.id.split('-')[0]}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{new Date(payment.escrow_held_at || '').toLocaleDateString()}</span>
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
          <h4 className="text-sm font-bold text-primary-900">Secure Offline Payments</h4>
          <p className="text-xs text-primary-700 mt-1">
            Payments are made directly to the service provider. Completed bookings are logged to facilitate dispute resolution if needed.
          </p>        </div>
      </div>
    </div>
  );
}
