import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../../app/store';
import api from '../../services/api';
import { Briefcase, Plus } from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import { getMediaUrl } from '../../utils/media';

export default function MyListingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      try {
        const assetsRes = await api.get('/assets/?owner=me');
        setAssets(assetsRes.data.results || []);
      } catch (error) {
        console.error('Failed to fetch listings', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchListings();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary-600" />
            My Listings
          </h1>
          <p className="text-gray-500 mt-1">Manage your listed assets.</p>
        </div>
        <Link to="/assets/create" className="btn-primary whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" /> List Asset
        </Link>
      </div>

      <div className="card p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : assets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {assets.map((asset) => (
              <Link key={asset.id} to={`/assets/${asset.id}`} className="group cursor-pointer">
                <div className="aspect-[4/3] relative rounded-2xl overflow-hidden mb-3">
                  <img
                    src={asset.photos?.[0] ? getMediaUrl(asset.photos[0].url) : 'https://images.unsplash.com/photo-1460317442991-0ec209397118'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={asset.name}
                  />
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-bold ${asset.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {asset.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">
                    {asset.name}
                  </h3>
                  <p className="text-sm text-gray-500">{asset.city}, {asset.country}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm">
                    <span className="font-bold"><Price amount={asset.pricing_rules?.[0]?.price || '0'} /></span>
                    <span className="text-gray-500"> / {asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'hr'}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
            <p className="text-gray-500 mb-4">You haven't listed any assets.</p>
            <Link to="/assets/create" className="btn-primary inline-flex">
              List Your First Asset
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
