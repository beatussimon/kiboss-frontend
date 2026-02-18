import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRides } from '../../features/rides/ridesSlice';
import { fetchAssets } from '../../features/assets/assetsSlice';
import { Search, MapPin, Home, Car, User, Filter, X, DollarSign, Calendar, Sliders } from 'lucide-react';

interface SearchResult {
  type: 'asset' | 'ride' | 'user';
  id: string;
  title: string;
  subtitle: string;
  price?: string;
  image?: string;
  location?: string;
  date?: string;
}

interface SearchFilters {
  minPrice: string;
  maxPrice: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  category: string;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const dispatch = useDispatch<AppDispatch>();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'assets' | 'rides' | 'users'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    minPrice: '',
    maxPrice: '',
    location: '',
    dateFrom: '',
    dateTo: '',
    category: '',
  });
  
  const { rides } = useSelector((state: RootState) => state.rides);
  const { assets } = useSelector((state: RootState) => state.assets);

  const performSearch = useCallback(() => {
    if (!query) return;
    
    setIsLoading(true);
    
    // Build search params for assets
    const assetParams: Record<string, string | undefined> = {
      search: query,
      city: filters.location || undefined,
      min_price: filters.minPrice || undefined,
      max_price: filters.maxPrice || undefined,
      asset_type: filters.category || undefined,
    };
    
    // Build search params for rides
    const rideParams: Record<string, string | undefined> = {
      origin: query,
      destination: query,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
    };
    
    // Search assets
    dispatch(fetchAssets(assetParams));
    
    // Search rides
    dispatch(fetchRides(rideParams));
    
    setIsLoading(false);
  }, [query, dispatch, filters]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  useEffect(() => {
    const newResults: SearchResult[] = [];
    
    // Add asset results
    if (activeTab === 'all' || activeTab === 'assets') {
      assets.forEach((asset) => {
        // Apply client-side price filtering
        const price = asset.pricing_rules?.[0]?.price;
        if (filters.minPrice && price && price < parseFloat(filters.minPrice)) return;
        if (filters.maxPrice && price && price > parseFloat(filters.maxPrice)) return;
        
        newResults.push({
          type: 'asset',
          id: asset.id,
          title: asset.name,
          subtitle: `${asset.city}, ${asset.country}`,
          price: asset.pricing_rules?.[0] ? `$${asset.pricing_rules[0].price}/${asset.pricing_rules[0].unit_type.toLowerCase()}` : undefined,
          image: asset.photos?.[0]?.url,
          location: `${asset.city}, ${asset.country}`,
        });
      });
    }
    
    // Add ride results
    if (activeTab === 'all' || activeTab === 'rides') {
      rides.forEach((ride) => {
        // Apply client-side price filtering
        if (filters.minPrice && ride.seat_price < parseFloat(filters.minPrice)) return;
        if (filters.maxPrice && ride.seat_price > parseFloat(filters.maxPrice)) return;
        
        newResults.push({
          type: 'ride',
          id: ride.id,
          title: `${ride.origin} → ${ride.destination}`,
          subtitle: new Date(ride.departure_time).toLocaleString(),
          price: `$${ride.seat_price}/seat`,
          location: ride.origin,
          date: new Date(ride.departure_time).toLocaleDateString(),
        });
      });
    }
    
    setResults(newResults);
  }, [assets, rides, activeTab, filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      location: '',
      dateFrom: '',
      dateTo: '',
      category: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const getIcon = (type: string) => {
    switch (type) {
      case 'asset':
        return Home;
      case 'ride':
        return Car;
      case 'user':
        return User;
      default:
        return Search;
    }
  };

  const getLink = (result: SearchResult) => {
    switch (result.type) {
      case 'asset':
        return `/assets/${result.id}`;
      case 'ride':
        return `/rides/${result.id}`;
      case 'user':
        return `/users/${result.id}`;
      default:
        return '#';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get('search') as string;
    if (searchQuery) {
      setSearchParams({ q: searchQuery });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={query}
              placeholder="Search assets, rides, or users..."
              className="input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${hasActiveFilters ? 'ring-2 ring-primary-500' : ''}`}
          >
            <Sliders className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="input w-full"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="h-4 w-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                placeholder="City or region"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="input w-full"
              />
            </div>

            {/* Category (for assets) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Home className="h-4 w-4 inline mr-1" />
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input w-full"
              >
                <option value="">All categories</option>
                <option value="ROOM">Rooms</option>
                <option value="TOOL">Tools</option>
                <option value="VEHICLE">Vehicles</option>
                <option value="SEAT_SERVICE">Seat Services</option>
                <option value="TIME_SERVICE">Time Services</option>
              </select>
            </div>

            {/* Date Range (for rides) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="input w-full"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      {query && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results
          </h1>
          <p className="text-gray-600">
            Showing results for "{query}"
            {hasActiveFilters && ' with filters applied'}
          </p>
        </div>
      )}

      {/* Search Tabs */}
      <div className="flex border-b mb-6">
        {['all', 'assets', 'rides', 'users'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'all' && results.length > 0 && (
              <span className="ml-1 text-xs">({results.length})</span>
            )}
            {tab === 'assets' && assets.length > 0 && (
              <span className="ml-1 text-xs">({assets.length})</span>
            )}
            {tab === 'rides' && rides.length > 0 && (
              <span className="ml-1 text-xs">({rides.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 h-20" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => {
            const Icon = getIcon(result.type);
            return (
              <Link
                key={`${result.type}-${result.id}`}
                to={getLink(result)}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {result.image ? (
                    <img src={result.image} alt={result.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${result.type === 'asset' ? 'badge-info' : 'badge-success'} text-xs`}>
                      {result.type}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{result.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                  {result.location && (
                    <p className="text-xs text-gray-400 flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {result.location}
                    </p>
                  )}
                </div>
                {result.price && (
                  <div className="text-primary-600 font-bold text-lg">{result.price}</div>
                )}
              </Link>
            );
          })}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No results found for "{query}"</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-primary-600 hover:text-primary-700 mt-2"
            >
              Try clearing your filters
            </button>
          )}
          <p className="text-sm text-gray-400 mt-2">Try different keywords or check your spelling</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Enter a search term to find assets, rides, or users</p>
        </div>
      )}
    </div>
  );
}
