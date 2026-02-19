import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchAsset } from '../../features/assets/assetsSlice';
import { toggleWishlist } from '../../features/wishlist/wishlistSlice';
import ContactButton from '../../components/messaging/ContactButton';
import InlineMessagingPanel from '../../components/messaging/InlineMessagingPanel';
import { getMediaUrl } from '../../utils/media';
import { Price } from '../../context/CurrencyContext';
import { 
  Home, MapPin, Star, Shield, Calendar, User, MessageCircle, 
  Edit, Trash2, List, Heart, ChevronLeft, ChevronRight, Zap, CreditCard
} from 'lucide-react';
import VerificationBadge from '../../components/ui/VerificationBadge';

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentAsset: asset, isLoading } = useSelector((state: RootState) => state.assets);
  const { items: wishlistItems } = useSelector((state: RootState) => state.wishlist);
  const isWishlisted = asset && wishlistItems?.some((item: any) => item.id === asset.id);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [showMessaging, setShowMessaging] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleThreadCreated = (threadId: string) => {
    // Navigate to the thread page instead of showing inline
    navigate(`/messages/${threadId}`);
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchAsset(id));
    }
  }, [dispatch, id]);

  const nextImage = () => {
    if (asset?.photos && asset.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % asset.photos.length);
    }
  };

  const prevImage = () => {
    if (asset?.photos && asset.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + asset.photos.length) % asset.photos.length);
    }
  };

  if (isLoading || !asset) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-xl" />
        <div className="mt-6 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Check if current user is the owner
  const isOwner = isAuthenticated && user?.id === asset.owner?.id;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Link to="/assets" className="text-primary-600 hover:text-primary-700 flex items-center">
          ← Back to Assets
        </Link>
        <button 
          onClick={() => asset && dispatch(toggleWishlist(asset))}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            isWishlisted ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
          <span className="text-sm font-bold">{isWishlisted ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Image Gallery */}
      <div className="space-y-4 mb-8">
        <div className="aspect-video relative rounded-2xl overflow-hidden bg-gray-900 group">
          {asset.photos && asset.photos.length > 0 ? (
            <>
              <img 
                src={getMediaUrl(asset.photos[currentImageIndex].url)} 
                alt={`${asset.name} - ${currentImageIndex + 1}`} 
                className="w-full h-full object-contain" 
              />
              
              {/* Navigation Arrows */}
              {asset.photos.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-bold">
                    {currentImageIndex + 1} / {asset.photos.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-24 w-24 text-gray-700" />
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {asset.photos && asset.photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {asset.photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                  currentImageIndex === index ? 'ring-2 ring-primary-600 opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={getMediaUrl(photo.url)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title Section */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
            {asset.is_verified && (
              <span className="badge-success">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </span>
            )}
          </div>
          <div className="flex items-center text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            {asset.address}, {asset.city}, {asset.country}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Owner Actions */}
          {isOwner && (
            <>
              <Link to={`/assets/${asset.id}/edit`} className="btn-secondary">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
              <Link to={`/assets/${asset.id}/bookings`} className="btn-secondary">
                <List className="h-4 w-4 mr-2" />
                View Bookings
              </Link>
            </>
          )}
          {/* Contact Owner Button - only for non-owners */}
          {isAuthenticated && !isOwner && asset.owner?.id && (
            <ContactButton
              targetUserId={asset.owner.id}
              label="Contact Owner"
              threadType="INQUIRY"
              listingId={asset.id}
              subject={`Inquiry about ${asset.name}`}
              onThreadCreated={handleThreadCreated}
              variant="secondary"
            />
          )}
          {!isAuthenticated && (
            <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="btn-secondary">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Owner
            </Link>
          )}
        </div>
      </div>

      {/* Inline Messaging Panel */}
      {showMessaging && activeThreadId && (
        <div className="mb-6">
          <InlineMessagingPanel
            threadId={activeThreadId}
            onClose={() => setShowMessaging(false)}
          />
        </div>
      )}

      {/* Room Features (for Hotels/Rooms) */}
      {asset.asset_type === 'ROOM' && (
        <div className="flex flex-wrap gap-6 py-6 border-y border-gray-100 mb-6 text-gray-600">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium">{(asset.properties as any)?.guests || 2} guests</span>
          </div>
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium">{(asset.properties as any)?.bedrooms || 1} bedroom</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium">{(asset.properties as any)?.beds || 1} bed</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium">{(asset.properties as any)?.baths || 1} private bath</span>
          </div>
        </div>
      )}

      {/* Rating & Reviews */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          <span className="ml-1 font-semibold">{asset.average_rating || 'N/A'}</span>
          <span className="ml-1 text-gray-500">({asset.total_reviews || 0} reviews)</span>
        </div>
        {/* Owner Profile Link with Verification Badge */}
        <Link to={`/users/${asset.owner.id}`} className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {asset.owner.profile?.avatar ? (
              <img src={getMediaUrl(asset.owner.profile.avatar)} alt={asset.owner.first_name} className="w-full h-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-gray-500" />
            )}
          </div>
          <span>{asset.owner.first_name}</span>
          <VerificationBadge 
            tier={asset.owner.verification_badge?.tier}
            color={asset.owner.verification_badge?.color}
            size="sm"
          />
        </Link>
      </div>

      {/* Description */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Description</h2>
        <p className="text-gray-600 whitespace-pre-wrap">{asset.description}</p>
      </div>

      {/* Pricing */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Pricing</h2>
        <div className="space-y-3">
          {asset.pricing_rules?.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>{rule.name}</span>
              <span className="font-semibold">${rule.price}/{rule.unit_type.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Book Now Button - only for non-owners */}
      {!isOwner && (
        <div className="card p-6 border-l-4 border-l-primary-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-2xl font-bold text-gray-900">
                <Price amount={asset.pricing_rules?.[0]?.price || '0'} />
              </span>
              <span className="text-gray-500"> / {asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'hour'}</span>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {isAuthenticated && user && asset?.owner?.id && (
                <ContactButton
                  targetUserId={asset.owner.id}
                  label="Message Owner"
                  threadType="INQUIRY"
                  listingId={asset.id}
                  subject={`Inquiry about ${asset.name}`}
                  onThreadCreated={handleThreadCreated}
                  variant="outline"
                  className="flex-1 md:flex-none justify-center"
                />
              )}
              <Link to={`/bookings/new?asset_id=${asset.id}`} className="btn-primary flex-1 md:flex-none flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" />
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hotel-style Booking Section (if ROOM) */}
      {!isOwner && asset.asset_type === 'ROOM' && (
        <div className="card p-8 border-t-4 border-t-primary-600 shadow-xl mb-12 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Check-in</label>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Calendar className="h-4 w-4 text-primary-600 mr-2" />
                <span className="text-sm font-bold text-gray-700">Add Date</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Check-out</label>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Calendar className="h-4 w-4 text-primary-600 mr-2" />
                <span className="text-sm font-bold text-gray-700">Add Date</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Guests</label>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <User className="h-4 w-4 text-primary-600 mr-2" />
                <span className="text-sm font-bold text-gray-700">1 Guest</span>
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <Link 
                to={`/bookings/new?asset_id=${asset.id}`}
                className="btn-primary w-full py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 flex items-center justify-center"
              >
                Check Availability
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-xs font-bold text-gray-500">Free Cancellation</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold text-gray-500">Secure Payment</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Starting from</p>
              <p className="text-2xl font-black text-primary-600"><Price amount={asset.pricing_rules?.[0]?.price || '0'} /></p>
            </div>
          </div>
        </div>
      )}

      {/* Owner Info Card */}
      {isOwner && (
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">This is your listing</h3>
          <p className="text-blue-600 mb-4">You can edit this listing or view its bookings from the buttons above.</p>
          <div className="flex gap-4">
            <Link to={`/assets/${asset.id}/edit`} className="btn-primary">
              <Edit className="h-4 w-4 mr-2" />
              Edit Listing
            </Link>
            <Link to={`/assets/${asset.id}/bookings`} className="btn-secondary">
              <List className="h-4 w-4 mr-2" />
              View Bookings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
