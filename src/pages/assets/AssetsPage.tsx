import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../app/store';
import { fetchAssets } from '../../features/assets/assetsSlice';
import { Home, MapPin, Star, Filter, Grid, List } from 'lucide-react';

export default function AssetsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { assets, isLoading, count } = useSelector((state: RootState) => state.assets);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const assetType = searchParams.get('asset_type') || undefined;
  const city = searchParams.get('city') || undefined;

  useEffect(() => {
    dispatch(fetchAssets({ asset_type: assetType, city }));
  }, [dispatch, assetType, city]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Assets</h1>
          <p className="text-gray-500 mt-1">{count} assets found</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={assetType || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('asset_type', e.target.value);
              } else {
                params.delete('asset_type');
              }
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
            placeholder="Search by city..."
            value={city || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('city', e.target.value);
              } else {
                params.delete('city');
              }
              setSearchParams(params);
            }}
            className="input flex-1"
          />
        </div>
      </div>

      {/* Asset Grid/List */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : assets.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {assets.map((asset) => (
            <Link key={asset.id} to={`/assets/${asset.id}`} className="card group hover:shadow-lg transition-shadow">
              <div className="aspect-video relative overflow-hidden rounded-t-xl">
                {asset.photos?.[0] ? (
                  <img
                    src={asset.photos[0].url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Home className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {asset.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {asset.city}, {asset.country}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-900">{asset.average_rating || 'N/A'}</span>
                    <span className="text-sm text-gray-500">({asset.total_reviews || 0})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary-600">
                      ${asset.pricing_rules?.[0]?.price || '0'}
                    </span>
                    <span className="text-sm text-gray-500">/{asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'hr'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
