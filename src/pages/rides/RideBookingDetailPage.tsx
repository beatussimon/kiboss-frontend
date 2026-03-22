import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import { fetchCurrentUser } from '../../features/auth/authSlice';
import ContactButton from '../../components/messaging/ContactButton';
import { Calendar, MapPin, Car, Briefcase, CheckCircle } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';
import CheckoutPayment from '../../components/checkout/CheckoutPayment';
import { Price } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function RideBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  
  const bookingType = searchParams.get('type') || 'seat'; // 'seat' or 'cargo'
  
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const fetchBooking = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = bookingType === 'cargo' ? `/rides/cargo-bookings/${id}/` : `/rides/bookings/${id}/`;
      const res = await api.get(endpoint);
      setBooking(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load booking');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id, bookingType]);

  // Real-time updates via WebSocket notifications
  useEffect(() => {
    const handleNotification = (event: any) => {
      const data = event.detail?.data;
      if (data && id) {
        const actionUrl = String(data.action_url || '');
        if (actionUrl.includes(id)) {
          fetchBooking();
        }
      }
    };
    window.addEventListener('ws:notification', handleNotification);
    return () => window.removeEventListener('ws:notification', handleNotification);
  }, [id, bookingType]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-500">{error}</p>
          <Link to="/bookings" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      RESERVED: 'badge-warning',
      CONFIRMED: 'badge-info',
      BOARDED: 'badge-success',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
      NO_SHOW: 'badge-danger',
    };
    return statusClasses[status] || 'badge-info';
  };

  const handleCancel = async () => {
    if (!id) return;
    const reason = prompt('Please enter a reason for cancellation:');
    if (reason !== null) {
      try {
        const endpoint = bookingType === 'cargo' ? `/rides/cargo-bookings/${id}/cancel/` : `/rides/bookings/${id}/cancel/`;
        await api.post(endpoint, { reason });
        toast.success(isOwnerView ? 'Booking rejected successfully' : 'Booking cancelled successfully');
        fetchBooking();
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to cancel booking');
      }
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      const endpoint = bookingType === 'cargo' ? `/rides/cargo-bookings/${id}/confirm/` : `/rides/bookings/${id}/confirm/`;
      await api.post(endpoint);
      toast.success('Booking approved successfully');
      fetchBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve booking');
    }
  };

  if (isLoading || !booking || !booking.ride_details) {
    return <div className="animate-pulse card p-8 h-96" />;
  }

  const ride = booking.ride_details;
  const isOwnerView = Boolean(user?.id && ride.driver && user.id === ride.driver.id);
  const passengerUser = bookingType === 'cargo' ? booking.sender : booking.passenger;
  const counterparty = isOwnerView ? passengerUser : ride.driver;
  const counterpartyLabel = isOwnerView ? 'Message Customer' : 'Message Driver';

  return (
    <div>
      <Link to="/bookings" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
        ← Back to Bookings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {bookingType === 'cargo' ? 'Cargo Shipping' : 'Seat Reservation'}
                </h1>
                <p className="text-gray-500 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {ride.origin} to {ride.destination}
                </p>
              </div>
              <span className={`badge ${getStatusBadge(booking.status)} text-sm`}>
                {booking.status}
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {ride.photos?.[0] ? (
                  <img src={getMediaUrl(ride.photos[0].url)} alt="Ride" className="w-full h-full object-cover" />
                ) : (
                  bookingType === 'cargo' ? <Briefcase className="h-6 w-6 text-gray-400" /> : <Car className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium">{riseRouteName(ride)}</p>
                <p className="text-sm text-gray-500">
                  {isOwnerView ? `Booked by ${passengerUser?.first_name || 'Unknown'}` : `Driven by ${ride.driver?.first_name || 'Unknown'}`}
                </p>
                {isAuthenticated && user && counterparty && counterparty.id !== user.id && (
                  <ContactButton
                    targetUserId={counterparty.id}
                    label={counterpartyLabel}
                    threadType="RIDE"
                    rideId={ride.id}
                    subject={`Booking #${booking.id} - ${ride.origin} to ${ride.destination}`}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    initialMessage={`Hi, I am reaching out regarding booking #${booking.id}.`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Booking Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Departure</span>
                <span className="font-medium">{new Date(ride.departure_time).toLocaleDateString()} {new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              {bookingType === 'seat' && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Seat Number</span>
                  <span className="font-medium">{booking.seat_number > 0 ? booking.seat_number : 'Unassigned'}</span>
                </div>
              )}

              {bookingType === 'cargo' && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Weight</span>
                  <span className="font-medium">{booking.weight} kg/units</span>
                </div>
              )}

              <hr className="border-gray-200" />
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold">Total Price</span>
                <span className="font-bold text-primary-600"><Price amount={booking.price} /></span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {booking.payment && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`badge ${['VERIFIED', 'COMPLETED', 'SUCCESS'].includes(booking.payment.status?.toUpperCase() || '') ? 'badge-success' : 'badge-warning'}`}>
                    {booking.payment.status_display || booking.payment.status}
                  </span>
                </div>
                
                {booking.payment.payment_method_display && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-500">Method</span>
                    <span className="font-medium text-right max-w-[200px] truncate" title={booking.payment.payment_method_display}>
                      {booking.payment.payment_method_display}
                    </span>
                  </div>
                )}

                {isOwnerView && booking.payment.sender_phone && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-500">Sender Phone</span>
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">{booking.payment.sender_phone}</span>
                  </div>
                )}

                {isOwnerView && booking.payment.transaction_reference && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-500">Transaction Ref</span>
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">{booking.payment.transaction_reference}</span>
                  </div>
                )}
                
                {booking.payment.manual_receipt_url && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-gray-500 block mb-2 text-sm">Receipt / Proof of Payment</span>
                    <a href={getMediaUrl(booking.payment.manual_receipt_url)} target="_blank" rel="noopener noreferrer" className="block w-full h-32 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all">
                      <img src={getMediaUrl(booking.payment.manual_receipt_url)} alt="Payment Receipt" className="w-full h-full object-cover shadow-sm" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Status / Checkout */}
          {booking.status === 'RESERVED' && !isOwnerView && !booking.payment && (
            <div className="mb-6">
              <CheckoutPayment
                bookingId={booking.id}
                bookingType="RIDE"
                amount={booking.price}
                currency={booking.currency || 'TZS'}
                ownerId={ride.driver?.id}
                onSuccess={() => fetchBooking()}
              />
            </div>
          )}

          {booking.status === 'RESERVED' && !isOwnerView && booking.payment && (
            <div className="mb-6 card p-6 border-l-4 border-l-green-500 bg-green-50 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-2 rounded-full mt-1">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800 text-lg mb-1">Payment Submitted</h3>
                  <p className="text-sm text-green-700 mb-4">
                    Your payment receipt has been received and is currently waiting for the driver to verify and approve your booking.
                  </p>
                  <div className="flex gap-3">
                    <Link to="/profile?tab=rides" className="btn-primary text-sm py-2 px-4 shadow-sm bg-green-600 hover:bg-green-700 border-none">
                      Back to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isOwnerView && booking.status === 'RESERVED' && (
            <div className="card p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">Actions</h2>
              <button onClick={handleApprove} className="btn-success w-full font-bold shadow-sm">
                Approve Request
              </button>
              <button onClick={handleCancel} className="btn-danger w-full font-bold shadow-sm">
                Reject Request
              </button>
            </div>
          )}

          {!isOwnerView && (booking.status === 'RESERVED' || booking.status === 'CONFIRMED') && (
            <div className="card p-6">
              <button onClick={handleCancel} className="btn-danger w-full font-bold">
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function riseRouteName(ride: any) {
  if (ride.route_name) return ride.route_name;
  return `${ride.origin} to ${ride.destination}`;
}
