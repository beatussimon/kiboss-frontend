import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRides } from '../../features/rides/ridesSlice';
import { MapPin, ArrowRight, Users, Star } from 'lucide-react';

export default function RidesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { rides, isLoading } = useSelector((state: RootState) => state.rides);

  useEffect(() => {
    dispatch(fetchRides({}));
  }, [dispatch]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Rides</h1>
        <Link to="/rides/create" className="btn-primary">
          Offer a Ride
        </Link>
      </div>

      {/* Search Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="From" className="input" />
          <input type="text" placeholder="To" className="input" />
          <input type="date" className="input" />
          <button className="btn-primary">Search</button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rides.length > 0 ? (
        <div className="space-y-4">
          {rides.map((ride) => (
            <Link key={ride.id} to={`/rides/${ride.id}`} className="card p-6 hover:shadow-md transition-shadow block">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                  <ArrowRight className="h-8 w-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{ride.route_name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {ride.origin} → {ride.destination}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      {new Date(ride.departure_time).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {ride.available_seats}/{ride.total_seats} seats
                      </span>
                      <span className="font-semibold text-primary-600">
                        ${ride.seat_price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <ArrowRight className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rides available</h3>
          <p className="text-gray-500">Be the first to offer a ride!</p>
        </div>
      )}
    </div>
  );
}
