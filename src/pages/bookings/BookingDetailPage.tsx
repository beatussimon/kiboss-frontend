import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchBooking, fetchBookingTimeline, cancelBooking, confirmBooking, clearCurrentBooking, clearError } from '../../features/bookings/bookingsSlice';
import ContactButton from '../../components/messaging/ContactButton';
import { Calendar, MapPin, Star, FileText, CheckCircle } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';
import { createRating } from '../../features/ratings/ratingsSlice';
import CheckoutPayment from '../../components/checkout/CheckoutPayment';
import { Price } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';
import { ServiceFeeTrigger } from '../../components/common/ServiceFeeModal';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentBooking: booking, timeline, isLoading, error } = useSelector((state: RootState) => state.bookings);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (id === 'new' || !id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Invalid Booking</h2>
          <p className="text-gray-500 dark:text-gray-400">The requested booking could not be found.</p>
          <Link to="/bookings" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearCurrentBooking());
    if (id && id !== 'new') {
      dispatch(fetchBooking(id));
      dispatch(fetchBookingTimeline(id));
    }
    return () => {
      dispatch(clearError());
      dispatch(clearCurrentBooking());
    };
  }, [dispatch, id]);

  // Real-time timeline updates via WebSocket notifications
  useEffect(() => {
    const handleNotification = (event: any) => {
      const data = event.detail?.data;
      if (data && id && id !== 'new') {
        const actionUrl = String(data.action_url || '');
        if (actionUrl.includes(id)) {
          dispatch(fetchBooking(id));
          dispatch(fetchBookingTimeline(id));
        }
      }
    };
    window.addEventListener('ws:notification', handleNotification);
    return () => window.removeEventListener('ws:notification', handleNotification);
  }, [dispatch, id]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Booking Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400">{error || 'The requested booking could not be found or you do not have permission to view it.'}</p>
          <Link to="/bookings" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      PENDING: 'badge-warning',
      CONFIRMED: 'badge-info',
      ACTIVE: 'badge-success',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
      EXPIRED: 'badge-warning',
      DISPUTED: 'badge-danger',
    };
    return statusClasses[status] || 'badge-info';
  };

  const handleCancel = async () => {
    if (!id) return;
    const reason = prompt('Please enter a reason for cancellation:');
    if (reason) {
      try {
        await dispatch(cancelBooking({ bookingId: id, reason })).unwrap();
        toast.success(isOwnerView ? 'Booking rejected successfully' : 'Booking cancelled successfully');
      } catch {
        toast.error(isOwnerView ? 'Failed to reject booking' : 'Failed to cancel booking');
      }
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await dispatch(confirmBooking(id)).unwrap();
      toast.success('Booking approved successfully');
    } catch {
      toast.error('Failed to approve booking');
    }
  };

  const handleRate = async () => {
    if (!booking) return;
    const rating = prompt('Enter rating (1-5):');
    const comment = prompt('Enter your review:');
    if (rating && comment) {
      try {
        const ratingVal = parseInt(rating);
        if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
          toast.error('Invalid rating. Must be 1-5.');
          return;
        }
        await dispatch(createRating({
          booking_id: booking.id,
          category: isOwnerView ? 'OWNER_TO_RENTER' : 'RENTER_TO_OWNER',
          overall_rating: ratingVal,
          reliability_rating: ratingVal,
          communication_rating: ratingVal,
          title: 'Booking Review',
          comment: comment
        })).unwrap();
        toast.success('Review submitted successfully');
      } catch (err: any) {
        toast.error(err || 'Failed to submit review');
      }
    }
  };

  if (isLoading || !booking || !booking.asset) {
    return <div className="animate-pulse card p-8 h-96" />;
  }

  const isOwnerView = Boolean(user?.id && booking.owner?.id && user.id === booking.owner.id);
  const counterparty = isOwnerView ? booking.renter : booking.owner;
  const counterpartyLabel = isOwnerView ? 'Message Renter' : 'Message Owner';

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{booking.asset.name}</h1>
                <p className="text-gray-500 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {booking.asset.address}, {booking.asset.city}, {booking.asset.country}
                </p>
              </div>
              <span className={`badge ${getStatusBadge(booking.status)} text-sm`}>
                {booking.status}
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {booking.asset.photos?.[0] ? (
                  <img src={getMediaUrl(booking.asset.photos[0].url)} alt={booking.asset.name} className="w-full h-full object-cover" />
                ) : (
                  <Calendar className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium">{booking.asset.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isOwnerView ? `Rented by ${booking.renter?.first_name || 'Unknown'}` : `Owned by ${booking.owner?.first_name || 'Unknown'}`}
                </p>
                {isAuthenticated && user && counterparty && counterparty.id !== user.id && (
                  <ContactButton
                    targetUserId={counterparty.id}
                    label={counterpartyLabel}
                    threadType="BOOKING"
                    bookingId={booking.id}
                    subject={`Booking #${booking.id} - ${booking.asset.name}`}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    initialMessage={`Hi, I am reaching out regarding booking #${booking.id} for ${booking.asset.name}.`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Booking Timeline</h2>
            {timeline.length > 0 ? (
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary-600 rounded-full" />
                      {index < timeline.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{event.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(event.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No timeline events yet</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Booking Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Check-in</span>
                <span className="font-medium">{new Date(booking.start_time).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Check-out</span>
                <span className="font-medium">{new Date(booking.end_time).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Quantity</span>
                <span className="font-medium">{booking.quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Price per unit</span>
                <span className="font-medium"><Price amount={booking.unit_price} /></span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="font-medium"><Price amount={booking.subtotal} /></span>
              </div>
              <div className="flex items-center justify-between">
                <ServiceFeeTrigger />
                <span className="font-medium"><Price amount={booking.service_fee} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Taxes</span>
                <span className="font-medium"><Price amount={booking.taxes} /></span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary-600"><Price amount={booking.total_price} /></span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Payment</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className={`badge ${['VERIFIED', 'COMPLETED', 'SUCCESS', 'ESCROW'].includes(booking.payment?.status?.toUpperCase() || '') ? 'badge-success' : 'badge-warning'}`}>
                  {booking.payment?.status_display || booking.payment?.status || 'Pending'}
                </span>
              </div>
              
              {booking.payment?.payment_method_display ? (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500 dark:text-gray-400">Method</span>
                  <span className="font-medium text-right max-w-[200px] truncate" title={booking.payment.payment_method_display}>
                    {booking.payment.payment_method_display}
                  </span>
                </div>
              ) : booking.payment?.card_brand && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500 dark:text-gray-400">Method</span>
                  <span className="font-medium">{booking.payment.card_brand} ****{booking.payment.card_last_four}</span>
                </div>
              )}

              {isOwnerView && booking.payment?.sender_phone && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500 dark:text-gray-400">Sender Phone</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">{booking.payment.sender_phone}</span>
                </div>
              )}

              {isOwnerView && booking.payment?.transaction_reference && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500 dark:text-gray-400">Transaction Ref</span>
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">{booking.payment.transaction_reference}</span>
                </div>
              )}

              {booking.payment?.manual_receipt_url && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-2 text-sm">Receipt / Proof of Payment</span>
                  <a href={getMediaUrl(booking.payment.manual_receipt_url)} target="_blank" rel="noopener noreferrer" className="block w-full h-32 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all">
                    <img src={getMediaUrl(booking.payment.manual_receipt_url)} alt="Payment Receipt" className="w-full h-full object-cover shadow-sm" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Contract Status */}
          {booking.contract && (
            <div className="card p-6 border-l-4 border-l-primary-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary-600" />
                  Contract
                </h2>
                <span className={`badge ${booking.contract.status === 'EXECUTED' ? 'badge-success' : 'badge-info'}`}>
                  {booking.contract.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Version {booking.contract.version}</p>
                <p className="text-xs text-gray-400 font-mono">ID: {booking.contract.id.split('-')[0]}...</p>
              </div>
              <Link to={`/contracts/${booking.contract.id}`} className="btn-outline w-full flex items-center justify-center text-sm">
                <FileText className="h-4 w-4 mr-2" />
                View Full Agreement
              </Link>
            </div>
          )}

          {/* Payment Checkout (Renter, PENDING booking) */}
          {booking.status === 'PENDING' && !isOwnerView && !booking.payment && (
            <div className="mb-6">
              <CheckoutPayment
                bookingId={booking.id}
                bookingType="ASSET"
                amount={booking.total_price}
                currency={booking.currency || 'TZS'}
                ownerId={booking.owner?.id}
                onSuccess={() => { if (id) { dispatch(fetchBooking(id)); dispatch(fetchBookingTimeline(id)); } }}
              />
            </div>
          )}

          {booking.status === 'PENDING' && !isOwnerView && booking.payment && (
            <div className="mb-6 card p-6 border-l-4 border-l-green-500 bg-green-50 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-2 rounded-full mt-1">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800 text-lg mb-1">Payment Submitted</h3>
                  <p className="text-sm text-green-700 mb-4">
                    Your payment receipt has been received and is currently waiting for the owner to verify and approve your booking.
                  </p>
                  <div className="flex gap-3">
                    <Link to="/bookings" className="btn-primary text-sm py-2 px-4 shadow-sm bg-green-600 hover:bg-green-700 border-none">
                      Back to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isOwnerView && booking.status === 'PENDING' && counterparty && (
            <div className="card p-6 space-y-3">
              <h2 className="text-lg font-semibold mb-2">Actions</h2>
              <button onClick={handleApprove} className="btn-success w-full font-bold shadow-sm">
                Approve Request
              </button>
              <button onClick={handleCancel} className="btn-danger w-full font-bold shadow-sm">
                Reject Request
              </button>
              <ContactButton
                targetUserId={counterparty.id}
                label="Request Modification"
                threadType="BOOKING"
                bookingId={booking.id}
                subject={`Modification Request - Booking #${booking.id}`}
                variant="outline"
                className="w-full justify-center !text-gray-700 !bg-gray-50 dark:bg-gray-900 border-gray-200 hover:!bg-gray-100 dark:bg-gray-800"
                initialMessage={`Hello, I'd like to request a modification to your booking request for ${booking.asset.name}.`}
              />
            </div>
          )}

          {!isOwnerView && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <div className="card p-6">
              <button onClick={handleCancel} className="btn-danger w-full font-bold">
                Cancel Booking
              </button>
            </div>
          )}

          {booking.status === 'COMPLETED' && (
            <div className="card p-6">
              <button onClick={handleRate} className="btn-primary w-full flex items-center justify-center">
                <Star className="h-4 w-4 mr-2" />
                Rate this Experience
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
