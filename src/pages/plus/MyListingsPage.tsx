import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../../app/store';
import api from '../../services/api';
import { Briefcase, Plus, Trash2 } from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import { getMediaUrl } from '../../utils/media';
import toast from 'react-hot-toast';

export default function MyListingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

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

  useEffect(() => {
    if (user) fetchListings();
  }, [user]);

  const handleDeleteListing = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/assets/${deleteTarget.id}/`);
      toast.success('Listing removed');
      fetchListings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Cannot delete listing with active bookings');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary-600" />
            My Listings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your listed assets.</p>
        </div>
        <Link to="/assets/create" className="btn-primary whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" /> List Asset
        </Link>
      </div>

      <div className="card p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-2xl mb-3" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : assets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {assets.map((asset) => (
              <div key={asset.id} className="group relative">
                <Link to={`/assets/${asset.id}`} className="block">
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
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">
                      {asset.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{asset.city}, {asset.country}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm">
                      <span className="font-bold"><Price amount={asset.pricing_rules?.[0]?.price || '0'} /></span>
                      <span className="text-gray-500 dark:text-gray-400"> / {asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'hr'}</span>
                    </p>
                  </div>
                </Link>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.preventDefault(); setDeleteTarget(asset); }}
                    className="p-2 bg-white/90 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shadow-sm">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No listings yet</h3>
            <p className="text-gray-500 mb-6">Create your first listing to start earning on Kiboss.</p>
            <Link to="/assets/create" className="btn-primary">Create Listing</Link>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Listing</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to permanently delete "{deleteTarget.name}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDeleteListing} className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
