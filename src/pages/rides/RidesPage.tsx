import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRides } from '../../features/rides/ridesSlice';
import { getDistanceToRide } from '../../utils/distance';
import { MapPin, ArrowRight, Users, Star, Navigation, Search, Eye, Clock, Loader2 } from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import { fetchAssets } from '../../features/assets/assetsSlice';
import { getMediaUrl } from '../../utils/media';
import RideCard from '../../components/rides/RideCard';
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
    }, { rootMargin: '50px' });
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find Rides</h1>
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
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mt-auto" />
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
              <RideCard
                key={ride.id}
                ride={ride}
                distance={distance}
                lastRideElementRef={isLastElement ? lastRideElementRef : undefined}
              />
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No rides available</h3>
          <p className="text-gray-500 dark:text-gray-400">Be the first to offer a ride!</p>
        </div>
      )}
    </div>
  );
}
