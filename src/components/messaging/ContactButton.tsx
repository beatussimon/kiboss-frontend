import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { createContextualThread, fetchThreadMessages } from '../../features/messaging/messagingSlice';
import { MessageCircle, Loader2 } from 'lucide-react';

interface ContactButtonProps {
  /** The owner/seller user ID to contact */
  targetUserId: string;
  /** Display text for the button */
  label?: string;
  /** Thread type - defaults to INQUIRY for listings */
  threadType?: 'INQUIRY' | 'BOOKING' | 'RIDE' | 'DISPUTE' | 'DIRECT';
  /** Optional listing/asset ID */
  listingId?: string;
  /** Optional booking ID */
  bookingId?: string;
  /** Optional ride ID */
  rideId?: string;
  /** Optional subject line */
  subject?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Whether to show a full messaging panel instead of navigating */
  showInlinePanel?: boolean;
  /** Callback when thread is created - receives thread ID */
  onThreadCreated?: (threadId: string) => void;
}

export default function ContactButton({
  targetUserId,
  label = 'Contact Seller',
  threadType = 'INQUIRY',
  listingId,
  bookingId,
  rideId,
  subject,
  variant = 'primary',
  size = 'md',
  className = '',
  onThreadCreated,
}: ContactButtonProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.messaging);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showError, setShowError] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (!targetUserId) {
      setShowError(true);
      console.error('Failed to create thread: target_user_id is required');
      return;
    }

    try {
      setShowError(false);
      
      // Create or get the contextual thread
      const result = await dispatch(createContextualThread({
        target_user_id: targetUserId,
        thread_type: threadType,
        subject,
        listing_id: listingId,
        booking_id: bookingId,
        ride_id: rideId,
      })).unwrap();

      // If callback provided, call it with thread ID
      if (onThreadCreated) {
        onThreadCreated(result.id);
      } else {
        // Navigate to the thread
        navigate(`/messages/${result.id}`);
      }
    } catch (err) {
      setShowError(true);
      console.error('Failed to create thread:', err);
    }
  };

  // Button styles based on variant
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        {label}
      </button>
      
      {showError && error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
