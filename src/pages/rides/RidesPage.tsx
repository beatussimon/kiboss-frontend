import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRides } from '../../features/rides/ridesSlice';
import { getDistanceToRide } from '../../utils/distance';
import { MapPin, ArrowRight, Users, Star, Navigation, Search, Eye, Clock, Loader2 } from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import { fetchAssets } from '../../features/assets/assetsSlice';

export default function RidesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { rides, isLoading, count } = useSelector((state: RootState) => state.rides);
  const { userLocation } = useSelector((state: RootState) => state.location);

  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    departure_date: '',
  });

  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);
  const hasMore = rides.length < count;

  const lastRideElementRef = useCallback((node: HTMLAnchorElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, { rootMargin: '200px' });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    dispatch(fetchRides({
      origin: searchParams.origin || undefined,
      destination: searchParams.destination || undefined,
      departure_date: searchParams.departure_date || undefined,
      page: 1,
    } as any));
  };

  const fetched = useRef(false);

  // Initial load
  useEffect(() => {
    if (!fetched.current) {
      dispatch(fetchRides({ page: 1 } as any));
      dispatch(fetchAssets({ asset_type: 'VEHICLE' }));
      fetched.current = true;
    }
  }, [dispatch]);

  // Load next pages
  useEffect(() => {
    if (page > 1) {
      dispatch(fetchRides({
        origin: searchParams.origin || undefined,
        destination: searchParams.destination || undefined,
        departure_date: searchParams.departure_date || undefined,
        page,
      } as any));
    }
  }, [page, dispatch]);

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

  const vehicles = useSelector((state: RootState) => state.assets.assets).filter(a => a.asset_type === 'VEHICLE');
  const isVerifiedDriver = vehicles.some(v => v.verification_status === 'VERIFIED') || user?.is_superuser;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Rides</h1>
        <div className="flex gap-2">
          <Link to="/vehicles" className="btn-secondary">
            Manage Vehicles
          </Link>
          {isVerifiedDriver && (
            <Link to="/rides/create" className="btn-primary">
              Offer a Ride
            </Link>
          )}
        </div>
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

      {isLoading && page === 1 && rides.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col md:flex-row gap-0 overflow-hidden animate-pulse">
              <div className="w-full md:w-1/2 rounded-2xl md:rounded-r-none bg-gray-200 aspect-[4/3]" />
              <div className="w-full md:w-1/2 p-4 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded w-full mt-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedRides && sortedRides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedRides.map((ride, index) => {
            const distance = getRideDistance(ride.stops);
            const isLastElement = index === sortedRides.length - 1;
            return (
              <Link key={ride.id} ref={isLastElement ? lastRideElementRef : null} to={`/rides/${ride.id}`} className="group cursor-pointer">
                <div className="flex overflow-hidden h-full rounded-2xl ring-1 ring-gray-100 hover:shadow-2xl transition-all hover:ring-primary-100 bg-white min-h-[280px]">
                  {/* Image Half */}
                  <div className="w-1/2 relative bg-gray-900 overflow-hidden shrink-0">
                    {/* Background Image Logic */}
                    {((ride as any).photos && (ride as any).photos.length > 0) ? (
                      <img
                        src={`http://localhost:8000${(ride as any).photos[0].url}`}
                        alt="Ride Cover"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : ((ride as any).vehicle_asset?.photos && (ride as any).vehicle_asset.photos.length > 0) ? (
                      <img
                        src={`http://localhost:8000${(ride as any).vehicle_asset.photos[0].url}`}
                        alt="Vehicle Cover"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 to-gray-900" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent" />

                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-right">
                      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest leading-tight">Departure</p>
                      <p className="text-sm font-black text-white">{new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[9px] font-black tracking-[0.2em] text-primary-400 mb-2 drop-shadow-md">RIDE TIMELINE</p>
                      <div className="space-y-3 relative bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(37,99,235,0.8)] shrink-0" />
                          <span className="text-xs font-bold truncate text-white drop-shadow-md">{ride.origin.split(',')[0]}</span>
                        </div>
                        <div className="absolute left-[15px] top-6 bottom-5 w-px bg-gradient-to-b from-primary-500 to-gray-400" />
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                          <span className="text-xs font-bold truncate text-gray-200">{ride.destination.split(',')[0]}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Half */}
                  <div className="w-1/2 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 pr-2 leading-tight">
                          {ride.route_name}
                        </h3>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-primary-600 leading-none"><Price amount={ride.seat_price} /></p>
                          <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-1">Per Seat</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <div className="h-6 w-6 rounded-full bg-primary-50 flex items-center justify-center text-[10px] font-black text-primary-700 shrink-0">
                          {(ride as any).driver?.first_name?.[0]}{(ride as any).driver?.last_name?.[0]}
                        </div>
                        <span className="text-xs font-bold text-gray-500 truncate">{(ride as any).driver?.first_name} {(ride as any).driver?.last_name}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Availability</p>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                            <Users className="h-3 w-3 text-primary-600" /> {ride.available_seats} Seats
                          </div>
                        </div>
                        {distance !== null ? (
                          <div className="flex flex-col gap-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Distance</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                              <Navigation className="h-3 w-3 text-primary-600" /> {distance.toFixed(1)} km
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                              <Clock className="h-3 w-3 text-primary-600" /> {new Date(ride.departure_time).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded inline-flex">
                          <Eye className="h-3 w-3" /> Popular Area
                        </div>
                        <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest group-hover:underline">View Journey →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
          {isLoading && page > 1 && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          )}
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
