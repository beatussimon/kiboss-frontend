import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import { setUserLocation, setLocationModalShown, setLocationPermissionGranted } from '../../features/location/locationSlice';

interface LocationModalProps {
  onClose?: () => void;
}

export default function LocationModal({ onClose }: LocationModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isLocationModalShown, userLocation, isLocationPermissionGranted } = useSelector(
    (state: RootState) => state.location
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if location was already granted
    if (userLocation || isLocationPermissionGranted) {
      dispatch(setLocationModalShown(false));
      return;
    }
    
    // Check if user previously denied or dismissed
    const locationDismissed = localStorage.getItem('locationModalDismissed');
    if (locationDismissed) {
      dispatch(setLocationModalShown(false));
      return;
    }

    // Show modal on mount
    dispatch(setLocationModalShown(true));
  }, [dispatch, userLocation, isLocationPermissionGranted]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsRequesting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        };
        
        // Save to localStorage for persistence
        localStorage.setItem('userLocation', JSON.stringify(locationData));
        
        dispatch(setUserLocation(locationData));
        dispatch(setLocationModalShown(false));
        setIsRequesting(false);
        
        if (onClose) onClose();
      },
      (err) => {
        setIsRequesting(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. You can still browse rides but nearby suggestions will be limited.');
            localStorage.setItem('locationModalDismissed', 'true');
            dispatch(setLocationPermissionGranted(false));
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please try again later.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An unknown error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  };

  const handleDismiss = () => {
    dispatch(setLocationModalShown(false));
    localStorage.setItem('locationModalDismissed', 'true');
    if (onClose) onClose();
  };

  const handleSkip = () => {
    dispatch(setLocationModalShown(false));
    localStorage.setItem('locationModalDismissed', 'true');
    if (onClose) onClose();
  };

  if (!isLocationModalShown) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleDismiss}></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-primary-100 rounded-full p-4">
            <svg 
              className="w-12 h-12 text-primary-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
          Enable Location Services
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-4">
          Allow KIBOSS to access your location to find rides with departure points near you. 
          This helps us show you the most relevant rides in order of proximity.
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={requestLocation}
            disabled={isRequesting}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isRequesting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Getting your location...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Enable Location
              </>
            )}
          </button>
          
          <button
            onClick={handleSkip}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Your location data is stored locally and only used to improve your ride suggestions. 
          We never share your precise location with other users.
        </p>
      </div>
    </div>
  );
}
