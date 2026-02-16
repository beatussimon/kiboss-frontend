import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRides } from '../../features/rides/ridesSlice';
import { fetchAssets } from '../../features/assets/assetsSlice';
import { fetchPublicProfile } from '../../features/social/socialSlice';
import { Search, MapPin, Home, Car, User } from 'lucide-react';

interface SearchResult {
  type: 'asset' | 'ride' | 'user';
  id: string;
  title: string;
  subtitle: string;
  price?: string;
  image?: string;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const dispatch = useDispatch<AppDispatch>();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'assets' | 'rides' | 'users'>('all');
  
  const { rides } = useSelector((state: RootState) => state.rides);
  const { assets } = useSelector((state: RootState) => state.assets);
  const { publicProfile } = useSelector((state: RootState) => state.social);

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      
      // Search assets
      dispatch(fetchAssets({ search: query }));
      
      // Search rides
      dispatch(fetchRides({ origin: query, destination: query }));
      
      // Note: User search would need a backend endpoint
      setIsLoading(false);
    }
  }, [query, dispatch]);

  useEffect(() => {
    const newResults: SearchResult[] = [];
    
    // Add asset results
    if (activeTab === 'all' || activeTab === 'assets') {
      assets.forEach((asset) => {
        newResults.push({
          type: 'asset',
          id: asset.id,
          title: asset.name,
          subtitle: `${asset.city}, ${asset.country}`,
          price: asset.pricing_rules?.[0] ? `$${asset.pricing_rules[0].price}/${asset.pricing_rules[0].unit_type.toLowerCase()}` : undefined,
          image: asset.photos?.[0]?.url,
        });
      });
    }
    
    // Add ride results
    if (activeTab === 'all' || activeTab === 'rides') {
      rides.forEach((ride) => {
        newResults.push({
          type: 'ride',
          id: ride.id,
          title: `${ride.origin} → ${ride.destination}`,
          subtitle: new Date(ride.departure_time).toLocaleString(),
          price: `$${ride.seat_price}/seat`,
        });
      });
    }
    
    setResults(newResults);
  }, [assets, rides, activeTab]);

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Search Results
        </h1>
        <p className="text-gray-600">
          Showing results for "{query}"
        </p>
      </div>

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
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  {result.image ? (
                    <img src={result.image} alt={result.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Icon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{result.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                </div>
                {result.price && (
                  <div className="text-primary-600 font-bold">{result.price}</div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No results found for "{query}"</p>
          <p className="text-sm text-gray-400 mt-2">Try different keywords or check your spelling</p>
        </div>
      )}
    </div>
  );
}
