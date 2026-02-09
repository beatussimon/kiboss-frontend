import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRide, fetchSeatAvailability } from '../../features/rides/ridesSlice';
import { MapPin, Users, ArrowRight, Clock, Star } from 'lucide-react';

export default function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentRide: ride, seatAvailability, isLoading } = useSelector((state: RootState) => state.rides);

  useEffect(() => {
    if (id) {
      dispatch(fetchRide(id));
      dispatch(fetchSeatAvailability(id));
    }
  }, [dispatch, id]);

  if (isLoading || !ride) {
    return <div className="animate-pulse card p-8 h-64" />;
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

            {/* Driver Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <Star className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold">{ride.driver.first_name}</p>
                <p className="text-sm text-gray-500">
                  ⭐ {ride.driver.trust_score} · {ride.driver.total_ratings_count} rides
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Vehicle</h2>
            <p className="text-gray-600">
              {ride.vehicle.description} · {ride.vehicle.color}
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
                      className={`p-2 rounded-lg text-sm font-medium ${
                        seat.status === 'AVAILABLE'
                          ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {seat.seat_number}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary w-full">Book Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}
