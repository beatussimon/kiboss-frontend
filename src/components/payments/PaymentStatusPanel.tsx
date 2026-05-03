import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, XCircle, User, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Props {
  bookingId: string;
  bookingType: string;
}

export function PaymentStatusPanel({ bookingId, bookingType }: Props) {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      api.get(`/payments/manual-payments/?booking_id=${bookingId}`)
        .then(res => {
          setPayments(res.data.results || res.data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [bookingId]);

  if (isLoading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl mb-6"></div>;
  if (payments.length === 0) return null;

  return (
    <div className="space-y-4">
      {payments.map((payment: any) => (
        <div key={payment.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <span className="font-bold text-gray-900 dark:text-white capitalize">
                {payment.payment_method?.replace('_', ' ')}
              </span>
            </div>
            <span className={`badge ${
              payment.status === 'APPROVED' ? 'badge-success' :
              payment.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              'badge-warning'
            }`}>
              {payment.status}
            </span>
          </div>

          {payment.status === 'APPROVED' && payment.verified_by && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              <User className="h-4 w-4" />
              <span>Verified by Admin on {format(new Date(payment.updated_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
          )}
          
          {payment.status === 'PENDING' && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              <Clock className="h-4 w-4" />
              <span>Submitted on {format(new Date(payment.created_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
          )}

          {payment.status === 'REJECTED' && (
            <div className="mt-3">
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-3">
                <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>
                  <strong>Payment rejected:</strong> {payment.rejection_reason || 'Proof was invalid or payment not received.'}
                </span>
              </div>
              <Link 
                to={`/bookings/${bookingId}?resubmit=true`} 
                className="btn-primary w-full inline-flex justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resubmit Payment Proof
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
