import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../app/store';
import { fetchAssets } from '../../features/assets/assetsSlice';
import { toggleWishlist } from '../../features/wishlist/wishlistSlice';
import { getMediaUrl } from '../../utils/media';
import { AssetType } from '../../types';
import { Home, Star, Grid, List, Loader2, Users, Heart, Shield, Search } from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import VerificationBadge from '../../components/ui/VerificationBadge';

export default function AssetsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { assets, isLoading, count, next } = useSelector((state: RootState) => state.assets);
  const { items: wishlistItems } = useSelector((state: RootState) => state.wishlist);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const assetType = searchParams.get('asset_type') as AssetType | undefined;
  const city = searchParams.get('city') || undefined;
  const owner = searchParams.get('owner') || undefined;
  const search = searchParams.get('search') || undefined;

  const fetchedDependencies = useRef('');

  useEffect(() => {
    const currentDependencies = `${assetType}-${city}-${owner}-${search}`;
    if (fetchedDependencies.current !== currentDependencies) {
      setPage(1);
      dispatch(fetchAssets({ asset_type: assetType, city, owner, search, page: 1 }));
      fetchedDependencies.current = currentDependencies;
    }
  }, [dispatch, assetType, city, owner, search]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !next) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      await dispatch(fetchAssets({ asset_type: assetType, city, owner, search, page: nextPage }));
      setPage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [dispatch, assetType, city, owner, search, page, isLoadingMore, next]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && next && !isLoadingMore) handleLoadMore();
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [handleLoadMore, next, isLoadingMore]);

  const handleSearchChange = (value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) { params.set('search', value); } else { params.delete('search'); }
      setSearchParams(params);
    }, 500);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Assets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{count} assets found</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Grid className="h-5 w-5" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, description, city..."
              defaultValue={search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input w-full pl-9"
            />
          </div>
          <select
            value={assetType || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) { params.set('asset_type', e.target.value); } else { params.delete('asset_type'); }
              setSearchParams(params);
            }}
            className="input w-auto"
          >
            <option value="">All Types</option>
            <option value="ROOM">Rooms</option>
            <option value="TOOL">Tools</option>
            <option value="VEHICLE">Vehicles</option>
            <option value="SEAT_SERVICE">Seat Services</option>
            <option value="TIME_SERVICE">Time Services</option>
          </select>
          <input
            type="text"
            placeholder="Filter by city..."
            value={city || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) { params.set('city', e.target.value); } else { params.delete('city'); }
              setSearchParams(params);
            }}
            className="input w-44"
          />
        </div>
      </div>

      {isLoading && assets.length === 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-4'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : assets && assets.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6 bg-gray-100 dark:bg-gray-800/50 -mx-4 md:-mx-6' : 'space-y-4'}>
          {assets.map((asset) => {
            const isWishlisted = wishlistItems?.some((item: any) => item.id === asset.id);
            return (
              <Link key={asset.id} to={`/assets/${asset.id}`} className="group cursor-pointer flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 p-3">
                {/* Image */}
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden mb-3">
                  <img
                    src={asset.photos?.[0] ? getMediaUrl(asset.photos[0].url) : 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&q=80&w=1000'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={asset.name}
                  />
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); dispatch(toggleWishlist(asset)); }}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-all z-10 shadow-md ${isWishlisted ? 'bg-red-500 text-white' : 'bg-gray-900 hover:bg-black text-white'}`}
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  {asset.is_verified && (
                    <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 px-2 py-1 rounded-lg text-[10px] font-bold text-primary-700 dark:text-primary-400 flex items-center gap-1 shadow-sm border border-gray-100 dark:border-gray-800">
                      <Shield className="h-3 w-3" /> VERIFIED
                    </div>
                  )}
                </div>

                {/* Title & Rating Row */}
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors truncate text-sm md:text-base">
                      {asset.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold shrink-0">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span>{asset.average_rating || '5.0'}</span>
                    <span className="text-xs text-gray-500 pl-0.5">({asset.total_reviews || 0})</span>
                  </div>
                </div>

                {/* Location - justified */}
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{asset.city}, {asset.country}</p>

                {/* Price & Host Row */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-gray-700 gap-2">
                  {/* Left: Price */}
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      <Price amount={asset.pricing_rules?.[0]?.price || '0'} />
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">/{asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'hr'}</span>
                  </div>
                  {/* Right: Host Name + Badge */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[80px] md:max-w-[120px]">
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
            );
          })}
          <div ref={loadMoreRef} className="col-span-full flex justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assets found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
}
