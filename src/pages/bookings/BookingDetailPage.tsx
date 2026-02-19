import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchBooking, fetchBookingTimeline, cancelBooking, clearCurrentBooking, clearError } from '../../features/bookings/bookingsSlice';
import ContactButton from '../../components/messaging/ContactButton';
import { Calendar, MapPin, Clock, User, Shield, CreditCard, ArrowLeft, MessageCircle, FileText, Star } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';
import { createRating } from '../../features/ratings/ratingsSlice';
import toast from 'react-hot-toast';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentBooking: booking, timeline, isLoading, error } = useSelector((state: RootState) => state.bookings);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Validate booking ID
  if (id === 'new' || !id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Booking</h2>
          <p className="text-gray-500">The requested booking could not be found.</p>
          <Link to="/bookings" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            ← Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Clear previous error and booking data when ID changes
    dispatch(clearError());
    dispatch(clearCurrentBooking());
    
    if (id && id !== 'new') {
      dispatch(fetchBooking(id));
      dispatch(fetchBookingTimeline(id));
    }
    
    // Cleanup on unmount
    return () => {
      dispatch(clearError());
      dispatch(clearCurrentBooking());
    };
  }, [dispatch, id]);

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-500">{error || 'The requested booking could not be found or you do not have permission to view it.'}</p>
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
        toast.success('Booking cancelled successfully');
      } catch {
        toast.error('Failed to cancel booking');
      }
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
                <h1 className="text-2xl font-bold text-gray-900">{booking.asset.name}</h1>
                <p className="text-gray-500 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {booking.asset.address}, {booking.asset.city}, {booking.asset.country}
                </p>
              </div>
              <span className={`badge ${getStatusBadge(booking.status)} text-sm`}>
                {booking.status}
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {booking.asset.photos?.[0] ? (
                  <img
                    src={getMediaUrl(booking.asset.photos[0].url)}
                    alt={booking.asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Calendar className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium">{booking.asset.name}</p>
                <p className="text-sm text-gray-500">
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
                      <p className="font-medium text-gray-900">{event.description}</p>
                      <p className="text-sm text-gray-500">{new Date(event.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No timeline events yet</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Booking Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Check-in</span>
                <span className="font-medium">{new Date(booking.start_time).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Check-out</span>
                <span className="font-medium">{new Date(booking.end_time).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Quantity</span>
                <span className="font-medium">{booking.quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Price per unit</span>
                <span className="font-medium">${booking.unit_price}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">${booking.subtotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Service fee</span>
                <span className="font-medium">${booking.service_fee}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Taxes</span>
                <span className="font-medium">${booking.taxes}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary-600">${booking.total_price}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Payment</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`badge ${booking.payment?.status === 'ESCROW' ? 'badge-warning' : 'badge-success'}`}>
                  {booking.payment?.status || 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{booking.payment?.card_brand} ****{booking.payment?.card_last_four}</span>
              </div>
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
                <p className="text-sm text-gray-500">Version {booking.contract.version}</p>
                <p className="text-xs text-gray-400 font-mono">ID: {booking.contract.id.split('-')[0]}...</p>
              </div>
              <Link to={`/contracts/${booking.contract.id}`} className="btn-outline w-full flex items-center justify-center text-sm">
                <FileText className="h-4 w-4 mr-2" />
                View Full Agreement
              </Link>
            </div>
          )}

          {/* Actions */}
          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <div className="card p-6">
              <button onClick={handleCancel} className="btn-danger w-full">
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
