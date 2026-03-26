import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { fetchAssets } from '../features/assets/assetsSlice';
import { fetchRides } from '../features/rides/ridesSlice';
import { motion } from 'framer-motion';
import {
  Home as HomeIcon, MapPin, Star, ArrowRight, Search, Shield, Clock, CreditCard,
  Car, Briefcase, Zap, Heart, Camera, Coffee, Laptop, Utensils, Eye, Users, Bookmark, Plus
} from 'lucide-react';
import { getMediaUrl } from '../utils/media';
import { Price } from '../context/CurrencyContext';
import RideCard from '../components/rides/RideCard';
import VerificationBadge from '../components/ui/VerificationBadge';

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { assets, isLoading: assetsLoading } = useSelector((state: RootState) => state.assets);
  const { rides, isLoading: ridesLoading } = useSelector((state: RootState) => state.rides);
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

  const fetched = useRef(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    if (!fetched.current) {
      dispatch(fetchAssets({ page_size: 8 }));
      dispatch(fetchRides({}));
      fetched.current = true;
    }

    // Fetch admin-configured hero image
    fetch('/api/v1/core/settings/')
      .then(r => r.json())
      .then(data => { if (data.hero_image) setHeroImage(data.hero_image); })
      .catch(() => { /* silently fall back to default */ });
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="-mt-8 space-y-12 pb-16">
      {/* Hero Search Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=2070'}
            className="w-full h-full object-cover"
            alt="Hero background"
          />
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-4xl px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl tracking-tight"
          >
            Rent <span className="text-primary-400">Anything</span>, <br className="hidden md:block" />
            Everywhere.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-2xl text-white/90 mb-10 font-medium drop-shadow-lg"
          >
            Share your stuff, earn extra cash. <br className="md:hidden" />
            Join thousands of owners earning today.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col gap-6 items-center"
          >
            <form onSubmit={handleSearch} className="bg-white p-2 rounded-full shadow-2xl flex items-center w-full max-w-2xl">
              <div className="flex-1 flex items-center px-4">
                <MapPin className="h-5 w-5 text-primary-600 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:ring-transparent focus:border-transparent text-gray-900 font-bold placeholder:text-gray-400 placeholder:font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="bg-primary-600 text-white p-4 rounded-full hover:bg-primary-700 transition-all flex items-center justify-center shadow-lg shadow-primary-600/20">
                <Search className="h-6 w-6" />
              </button>
            </form>

            <Link
              to="/assets/create"
              className="group flex items-center gap-2 text-white font-black  tracking-widest text-xs bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              Start Listing Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Assets */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Listings</h2>
            <p className="text-gray-500">Explore the best rentals in your area</p>
          </div>
          <Link to="/assets" className="text-primary-600 font-bold flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {assetsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-3">
                <div className="aspect-[4/3] bg-gray-200 rounded-2xl" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {assets.slice(0, 8).map((asset) => (
              <Link key={asset.id} to={`/assets/${asset.id}`} className="group cursor-pointer">
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden mb-3">
                  <img
                    src={asset.photos?.[0] ? getMediaUrl(asset.photos[0].url) : "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&q=80&w=1000"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={asset.name}
                  />
                  <button className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all">
                    <Heart className="h-5 w-5" />
                  </button>
                  {asset.is_verified && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-primary-700 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> VERIFIED
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 leading-tight group-hover:text-primary-600 transition-colors truncate text-sm md:text-base">
                      {asset.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{asset.city}, {asset.country}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold shrink-0">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span>{asset.average_rating || '5.0'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-gray-400 tracking-widest">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {(asset as any).views_count || Math.floor(Math.random() * 500) + 50}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-3 w-3" /> {(asset as any).wishlist_count || Math.floor(Math.random() * 50) + 5}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {asset.total_bookings || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 gap-2">
                  {/* Left: Price */}
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-sm font-bold text-gray-900 truncate">
                      <Price amount={asset.pricing_rules?.[0]?.price || '0'} />
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">/{asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'day'}</span>
                  </div>
                  {/* Right: Host Name + Badge */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-600 truncate max-w-[80px] md:max-w-[120px]">
                      {asset.owner?.first_name} {asset.owner?.last_name}
                    </span>
                    <VerificationBadge
                      tier={(asset as any).owner?.verification_badge?.tier}
                      color={(asset as any).owner?.verification_badge?.color}
                      size="xs"
                      checkmarkData={(asset as any).owner?.checkmark_data}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Latest Rides */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Latest Rides</h2>
            <p className="text-gray-500">Share a journey and save costs</p>
          </div>
          <Link to="/rides" className="text-primary-600 font-bold flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {ridesLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse h-64 bg-gray-100 rounded-[2rem]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rides.slice(0, 4).map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
