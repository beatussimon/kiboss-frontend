import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRides } from '../../features/rides/ridesSlice';
import { getDistanceToRide } from '../../utils/distance';
import { MapPin, ArrowRight, Users, Star, Navigation, Search, Eye, Clock } from 'lucide-react';
import { Price } from '../../context/CurrencyContext';

export default function RidesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { rides, isLoading } = useSelector((state: RootState) => state.rides);
  const { userLocation } = useSelector((state: RootState) => state.location);
  
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    departure_date: '',
  });

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(fetchRides({
      origin: searchParams.origin || undefined,
      destination: searchParams.destination || undefined,
      departure_date: searchParams.departure_date || undefined,
    }));
  };

  // Initial load
  useEffect(() => {
    dispatch(fetchRides({}));
  }, [dispatch]);

  // Sort rides by proximity if user location is available
  const sortedRides = useMemo(() => {
    if (!userLocation || !rides) return rides;
    
    return [...rides].sort((a, b) => {
      const distanceA = getDistanceToRide(
        userLocation.latitude,
        userLocation.longitude,
        a.stops
      );
      const distanceB = getDistanceToRide(
        userLocation.latitude,
        userLocation.longitude,
        b.stops
      );
      return distanceA - distanceB;
    });
  }, [rides, userLocation]);

  // Calculate distance for each ride for display
  const getRideDistance = (stops: any[]) => {
    if (!userLocation) return null;
    return getDistanceToRide(userLocation.latitude, userLocation.longitude, stops);
  };

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
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MapPin className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="From" 
                className="input pl-10"
                value={searchParams.origin}
                onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
              />
            </div>
            <div className="relative">
              <MapPin className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="To" 
                className="input pl-10"
                value={searchParams.destination}
                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
              />
            </div>
            <input 
              type="date" 
              className="input"
              value={searchParams.departure_date}
              onChange={(e) => setSearchParams({ ...searchParams, departure_date: e.target.value })}
            />
            <button type="submit" className="btn-primary flex items-center justify-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </form>
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
      ) : sortedRides && sortedRides.length > 0 ? (
        <div className="space-y-4">
          {sortedRides.map((ride) => {
            const distance = getRideDistance(ride.stops);
            return (
            <Link key={ride.id} to={`/rides/${ride.id}`} className="card p-0 overflow-hidden hover:shadow-xl transition-all block group border-l-4 border-l-transparent hover:border-l-primary-600">
              <div className="flex flex-col md:flex-row">
                {/* Visual Trip Indicator */}
                <div className="md:w-48 bg-gray-900 p-6 flex flex-col justify-between text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400 mb-4">Trip Details</p>
                    <div className="space-y-4 relative">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                        <span className="text-xs font-bold truncate">{ride.origin.split(',')[0]}</span>
                      </div>
                      <div className="absolute left-1 top-2 bottom-2 w-px bg-gradient-to-b from-primary-500 to-gray-700" />
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        <span className="text-xs font-bold truncate">{ride.destination.split(',')[0]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Departure</p>
                    <p className="text-sm font-black">{new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors">{ride.route_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-[8px] font-bold text-primary-700">
                          {(ride as any).driver?.first_name?.[0]}{(ride as any).driver?.last_name?.[0]}
                        </div>
                        <span className="text-xs font-bold text-gray-500">{(ride as any).driver?.first_name} {(ride as any).driver?.last_name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary-600"><Price amount={ride.seat_price} /></p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Per Seat</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-auto">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      <Users className="h-3 w-3" /> {ride.available_seats} Seats Left
                    </div>
                    {distance !== null && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-50 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary-600">
                        <Navigation className="h-3 w-3" /> {distance.toFixed(1)} km away
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 rounded-full text-[10px] font-bold uppercase tracking-wider text-orange-600">
                      <Clock className="h-3 w-3" /> {new Date(ride.departure_time).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                      <Eye className="h-3 w-3" /> {Math.floor(Math.random() * 100) + 10} Views
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )})}
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
