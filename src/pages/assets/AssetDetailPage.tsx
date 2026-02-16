import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchAsset } from '../../features/assets/assetsSlice';
import ContactButton from '../../components/messaging/ContactButton';
import InlineMessagingPanel from '../../components/messaging/InlineMessagingPanel';
import { Home, MapPin, Star, Shield, Calendar, User, MessageCircle } from 'lucide-react';
import VerificationBadge from '../../components/ui/VerificationBadge';

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentAsset: asset, isLoading } = useSelector((state: RootState) => state.assets);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [showMessaging, setShowMessaging] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const handleThreadCreated = (threadId: string) => {
    // Navigate to the thread page instead of showing inline
    navigate(`/messages/${threadId}`);
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchAsset(id));
    }
  }, [dispatch, id]);

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

  return (
    <div>
      {/* Back Button */}
      <Link to="/assets" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
        ← Back to Assets
      </Link>

      {/* Image Gallery */}
      <div className="aspect-video rounded-xl overflow-hidden mb-6">
        {asset.photos?.[0] ? (
          <img src={asset.photos[0].url} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Home className="h-24 w-24 text-gray-400" />
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
          {/* Contact Owner Button */}
          {isAuthenticated && user?.id !== asset.owner?.id && asset.owner?.id && (
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
              <img src={asset.owner.profile.avatar} alt={asset.owner.first_name} className="w-full h-full object-cover" />
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

      {/* Book Now Button */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              ${asset.pricing_rules?.[0]?.price || '0'}
            </span>
            <span className="text-gray-500"> / {asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'hour'}</span>
          </div>
          <Link to={`/bookings/new?asset_id=${asset.id}`} className="btn-primary">
            <Calendar className="h-4 w-4 mr-2" />
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
