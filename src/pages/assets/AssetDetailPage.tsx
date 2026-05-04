import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// @ts-ignore
import { debounce } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchAsset } from '../../features/assets/assetsSlice';
import { toggleWishlist } from '../../features/wishlist/wishlistSlice';
import ContactButton from '../../components/messaging/ContactButton';
import InlineMessagingPanel from '../../components/messaging/InlineMessagingPanel';
import ImageModal from '../../components/ui/ImageModal';
import { getMediaUrl } from '../../utils/media';
import { Price } from '../../context/CurrencyContext';
import {
  Home, MapPin, Star, Shield, Calendar, User, MessageCircle, ArrowRight,
  Edit, Trash2, List, Heart, ChevronLeft, ChevronRight, Zap, CreditCard
} from 'lucide-react';
import VerificationBadge from '../../components/ui/VerificationBadge';
import { AssetPropertiesPanel } from '../../components/assets/AssetPropertiesPanel';
import { ReviewsSection } from '../../components/assets/ReviewsSection';

const isHotelType = (type: string) => ['HOTEL_ROOM', 'ENTIRE_HOME', 'PRIVATE_ROOM', 'SHARED_ROOM', 'GUEST_HOUSE'].includes(type);

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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestCount, setGuestCount] = useState(1);

  const today = new Date().toISOString().split('T')[0];
  const minCheckOut = checkInDate
    ? new Date(new Date(checkInDate).getTime() + 86400000).toISOString().split('T')[0]
    : today;

  const UNIT_TYPE_LABELS: Record<string, string> = { HOUR: 'per hour', DAY: 'per day', WEEK: 'per week', MONTH: 'per month', SEAT: 'per seat', FIXED: 'flat rate', UNIT: 'per item', KM: 'per km', MILE: 'per mile' };

  const handleThreadCreated = (threadId: string) => {
    navigate(`/messages/${threadId}`);
  };

  const debouncedToggleWishlist = debounce(() => {
    if (asset) dispatch(toggleWishlist(asset));
  }, 300);

  useEffect(() => {
    if (id) {
      dispatch(fetchAsset(id));
    }
  }, [dispatch, id]);

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (asset?.photos && asset.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % asset.photos.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (asset?.photos && asset.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + asset.photos.length) % asset.photos.length);
    }
  };

  if (isLoading || !asset) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="mt-6 space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  const isOwner = isAuthenticated && user?.id === asset.owner?.id;

  const imageModalPhotos = asset.photos ? asset.photos.map((p, i) => ({ id: p.id || i, url: getMediaUrl(p.url) })) : [];

  const buildBookingUrl = () => {
    const params = new URLSearchParams({ asset_id: asset.id });
    if (isHotelType(asset.asset_type) || asset.asset_type === 'ROOM') {
      if (checkInDate) params.append('check_in', checkInDate);
      if (checkOutDate) params.append('check_out', checkOutDate);
      if (guestCount) params.append('guests', guestCount.toString());
    }
    return `/bookings/new?${params}`;
  };

  return (
    <div>
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={imageModalPhotos}
        initialIndex={currentImageIndex}
      />

      <div className="flex justify-between items-center mb-4">
        <div />
        <div className="flex gap-2">
            {isOwner && (
              <>
                <Link to={`/assets/${asset.id}/edit`} className="btn-secondary py-2">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
                <Link to={`/assets/${asset.id}/bookings`} className="btn-secondary py-2">
                  <List className="h-4 w-4 mr-2" />
                  Bookings
                </Link>
              </>
            )}
            <button
              onClick={debouncedToggleWishlist}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all border font-bold shadow-sm ${isWishlisted ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isWishlisted ? 'Saved' : 'Save'}</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div
              className="aspect-[4/3] md:aspect-video relative rounded-xl md:rounded-[2rem] overflow-hidden bg-gray-900 group cursor-pointer shadow-xl border border-gray-800"
              onClick={() => setIsImageModalOpen(true)}
            >
              {asset.photos && asset.photos.length > 0 ? (
                <>
                  <img
                    src={getMediaUrl(asset.photos?.[currentImageIndex]?.url)}
                    alt={`${asset.name} - ${currentImageIndex + 1}`}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x450/e2e8f0/64748b?text=Image+Unavailable'; }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-transparent" />

                  {/* Navigation Arrows */}
                  {asset.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-gray-900 hover:bg-black rounded-full text-white transition-all opacity-0 group-hover:opacity-100 border border-gray-700 hover:scale-110 shadow-xl"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-gray-900 hover:bg-black rounded-full text-white transition-all opacity-0 group-hover:opacity-100 border border-gray-700 hover:scale-110 shadow-xl"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>

                      {/* Image Counter */}
                      <div className="absolute bottom-6 right-6 px-4 py-1.5 bg-gray-900 rounded-full text-white text-xs font-bold border border-gray-700 shadow-lg tracking-widest uppercase">
                        {currentImageIndex + 1} / {asset.photos.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="h-24 w-24 text-gray-700 dark:text-gray-200" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {asset.photos && asset.photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {asset.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all shadow-sm ${currentImageIndex === index ? 'ring-2 ring-primary-500 scale-105 shadow-primary-500/30' : 'opacity-60 hover:opacity-100 hover:scale-105 bg-gray-100'
                      }`}
                  >
                    <img src={getMediaUrl(photo?.url)} alt="" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/128x80/e2e8f0/64748b?text=NA'; }} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title Section */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-words">{asset.name}</h1>
              {asset.is_verified && (
                <span className="badge-success">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <MapPin className="h-4 w-4 mr-1" />
              {asset.address}, {asset.city}, {asset.country}
            </div>
          </div>

          {/* Mobile Booking Teaser (Visible only on Mobile) */}
          <div className="lg:hidden card p-4 flex items-center justify-between">
            <div>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                <Price amount={asset.pricing_rules?.[0]?.price || '0'} />
              </span>
              <span className="text-sm text-gray-400 ml-1">
                / {asset.pricing_rules?.[0] ? (UNIT_TYPE_LABELS[asset.pricing_rules[0].unit_type] || asset.pricing_rules[0].unit_type.toLowerCase()) : 'hour'}
              </span>
            </div>
            <a href="#book-now" className="btn-primary py-2.5 px-5 text-sm font-black">
              {isOwner ? 'Manage' : 'Reserve'}
            </a>
          </div>

          {/* Owner Info - Compact Row */}
          <Link to={`/users/${asset.owner.id}`}
            className="flex items-center gap-3 group bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              {asset.owner.profile?.avatar
                ? <img src={getMediaUrl(asset.owner.profile.avatar)} className="h-full w-full object-cover" />
                : <span className="h-full w-full flex items-center justify-center text-sm font-black text-gray-500">{asset.owner.first_name?.[0] || 'K'}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium">Hosted by</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center gap-1">
                {asset.owner.first_name} {asset.owner.last_name}
                <VerificationBadge tier={asset.owner.verification_badge?.tier} color={asset.owner.verification_badge?.color} size="xs" checkmarkData={(asset.owner as any).checkmark_data} />
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
          </Link>

          {/* Asset Properties */}
          <AssetPropertiesPanel assetType={asset.asset_type} properties={asset.properties} />

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{asset.description}</p>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Pricing</h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800">
              {asset.pricing_rules?.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{rule.name || 'Base rate'}</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    <Price amount={rule.price} /> 
                    <span className="text-gray-400 font-normal ml-1">{UNIT_TYPE_LABELS[rule.unit_type] || rule.unit_type.toLowerCase()}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Location Map */}
          {(asset as any).latitude && (asset as any).longitude && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-bold">Location</h2>
                <p className="text-sm text-gray-500">{asset.city}, {asset.country}</p>
              </div>
              <iframe
                title="Asset location"
                width="100%"
                height="300"
                style={{border: 0}}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number((asset as any).longitude)-0.01},${Number((asset as any).latitude)-0.01},${Number((asset as any).longitude)+0.01},${Number((asset as any).latitude)+0.01}&layer=mapnik&marker=${(asset as any).latitude},${(asset as any).longitude}`}
              />
            </div>
          )}

          {/* Reviews Section */}
          <ReviewsSection assetId={asset.id} averageRating={asset.average_rating || 0} totalReviews={asset.total_reviews || 0} />
        </div>

        {/* Right Column - Sticky Booking Card */}
        <div className="lg:col-span-1" id="book-now">
          <div className="lg:sticky lg:top-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-xl">
            {/* Price header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  <Price amount={asset.pricing_rules?.[0]?.price || '0'} />
                </span>
                <span className="text-gray-400 font-medium">
                  / {asset.pricing_rules?.[0] ? (UNIT_TYPE_LABELS[asset.pricing_rules[0].unit_type] || asset.pricing_rules[0].unit_type.toLowerCase()) : 'booking'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">{asset.average_rating || 'New'}</span>
                <span className="text-sm text-gray-400">({asset.total_reviews || 0} reviews)</span>
              </div>
            </div>
            
            {/* Booking form */}
            <div className="p-6">
              {(asset.asset_type === 'ROOM' || isHotelType(asset.asset_type)) ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Check-in</label>
                    <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="pl-3 py-3">
                        <Calendar className="h-4 w-4 text-primary-600" />
                      </div>
                      <input
                        type="date"
                        value={checkInDate}
                        min={today}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 p-3"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Check-out</label>
                    <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="pl-3 py-3">
                        <Calendar className="h-4 w-4 text-primary-600" />
                      </div>
                      <input
                        type="date"
                        value={checkOutDate}
                        min={minCheckOut}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 p-3"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Guests</label>
                    <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="pl-3 py-3">
                        <User className="h-4 w-4 text-primary-600" />
                      </div>
                      <select
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                        className="w-full bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 p-3 appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Select dates and time on the next screen to view total price.</p>
                </div>
              )}
              
              <Link
                to={buildBookingUrl()}
                className="w-full btn-primary py-3.5 text-base font-black rounded-xl mt-4 flex items-center justify-center gap-2 shadow-lg"
              >
                <Calendar className="h-5 w-5" />
                {isOwner ? 'View Bookings' : 'Reserve'}
              </Link>
              
              {!isOwner && (
                <p className="text-center text-xs text-gray-400 mt-3">No charge until confirmed</p>
              )}
            </div>
            
            {/* Contact owner */}
            {isAuthenticated && !isOwner && asset.owner?.id && (
              <div className="px-6 pb-6">
                <ContactButton
                  targetUserId={asset.owner.id}
                  label="Message Owner"
                  threadType="INQUIRY"
                  listingId={asset.id}
                  subject={`Inquiry about ${asset.name}`}
                  onThreadCreated={handleThreadCreated}
                  variant="outline"
                  className="w-full justify-center text-sm py-2.5"
                  initialMessage={`Hi, I'm interested in booking ${asset.name}.`}
                />
              </div>
            )}
            
            {!isAuthenticated && !isOwner && (
              <div className="px-6 pb-6">
                <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="btn-secondary w-full justify-center text-sm py-2.5">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message Owner
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Messaging Panel */}
      {showMessaging && activeThreadId && (
        <div className="fixed bottom-0 right-0 m-4 w-96 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <InlineMessagingPanel
            threadId={activeThreadId}
            onClose={() => setShowMessaging(false)}
          />
        </div>
      )}
    </div>
  );
}