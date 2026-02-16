import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRide, fetchSeatAvailability, bookSeat } from '../../features/rides/ridesSlice';
import { MapPin, Users, ArrowRight, Clock, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import VerificationBadge from '../../components/ui/VerificationBadge';
import ContactButton from '../../components/messaging/ContactButton';

export default function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentRide: ride, seatAvailability, isLoading, error } = useSelector((state: RootState) => state.rides);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchRide(id));
      dispatch(fetchSeatAvailability(id));
    }
  }, [dispatch, id]);

  const handleBookNow = async () => {
    if (!id || !selectedSeat) {
      toast.error('Please select a seat first');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login to book a seat');
      return;
    }

    setIsBooking(true);
    try {
      await dispatch(bookSeat({
        rideId: id,
        data: {
          seat_number: selectedSeat,
          payment_method: 'card'
        }
      })).unwrap();
      toast.success('Seat booked successfully!');
    } catch (err) {
      toast.error('Failed to book seat. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse card p-8 h-64" />;
  }

  if (error) {
    return (
      <div className="card p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/rides" className="text-primary-600 hover:text-primary-700">
          ← Back to Rides
        </Link>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="card p-8">
        <p className="text-gray-600 mb-4">Ride not found</p>
        <Link to="/rides" className="text-primary-600 hover:text-primary-700">
          ← Back to Rides
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/rides" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
        ← Back to Rides
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{ride.route_name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center text-gray-500">
                <MapPin className="h-5 w-5 mr-2" />
                {ride.origin}
              </div>
              <div className="flex-1 border-t-2 border-dashed border-gray-200" />
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="flex-1 border-t-2 border-dashed border-gray-200" />
              <div className="flex items-center text-gray-500">
                <MapPin className="h-5 w-5 mr-2" />
                {ride.destination}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(ride.departure_time).toLocaleString()}
              </span>
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {ride.available_seats} / {ride.total_seats} seats available
              </span>
            </div>

            {/* Driver Info - Clickable to profile */}
            <Link 
              to={`/users/${ride.driver.id}`} 
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {ride.driver.profile?.avatar ? (
                  <img 
                    src={ride.driver.profile.avatar} 
                    alt={ride.driver.first_name}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Star className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold flex items-center gap-2">
                  {ride.driver.first_name} {ride.driver.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  ⭐ {ride.driver.trust_score} · {ride.driver.total_ratings_count} rides
                </p>
              </div>
              <VerificationBadge 
                tier={ride.driver.verification_badge?.tier}
                color={ride.driver.verification_badge?.color}
                size="sm"
              />
            </Link>
          </div>

          {/* Vehicle Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Vehicle</h2>
            <p className="text-gray-600">
              {ride.vehicle_asset?.name || ride.vehicle_description || 'Vehicle info not available'} · {ride.vehicle_asset?.asset_type || ride.vehicle_color || ''}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Book a Seat</h2>
            <div className="text-3xl font-bold text-primary-600 mb-4">
              ${ride.seat_price}
              <span className="text-sm font-normal text-gray-500"> / seat</span>
            </div>
            
            {seatAvailability && (
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">Select a seat:</p>
                <div className="grid grid-cols-4 gap-2">
                  {seatAvailability.seats.map((seat) => (
                    <button
                      key={seat.seat_number}
                      disabled={seat.status !== 'AVAILABLE'}
                      onClick={() => setSelectedSeat(seat.seat_number)}
                      className={`p-2 rounded-lg text-sm font-medium ${
                        seat.status === 'AVAILABLE'
                          ? selectedSeat === seat.seat_number
                            ? 'bg-primary-600 text-white'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {seat.seat_number}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              className="btn-primary w-full"
              onClick={handleBookNow}
              disabled={!selectedSeat || isBooking || ride.available_seats === 0}
            >
              {isBooking ? 'Booking...' : 'Book Now'}
            </button>

            {/* Contact Driver Button */}
            {isAuthenticated && user?.id !== ride.driver?.id && ride.driver?.id && (
              <div className="mt-4">
                <ContactButton
                  targetUserId={ride.driver.id}
                  label="Message Driver"
                  threadType="RIDE"
                  rideId={ride.id}
                  subject={`Inquiry about ride: ${ride.route_name}`}
                  variant="outline"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
