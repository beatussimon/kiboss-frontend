import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import { setUserLocation, setLocationModalShown, setLocationPermissionGranted } from '../../features/location/locationSlice';

interface LocationModalProps {
  onClose?: () => void;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  source?: string;
}

export default function LocationModal({ onClose }: LocationModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isLocationModalShown, userLocation, isLocationPermissionGranted } = useSelector(
    (state: RootState) => state.location
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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

  // Fallback location service using IP-based geolocation
  const fetchFallbackLocation = useCallback(async (): Promise<UserLocation | null> => {
    try {
      // Use a free IP geolocation API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (!data.latitude || !data.longitude) return null;
      
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: Date.now(),
        accuracy: 5000, // Approximate accuracy for IP-based location
        source: 'ipapi',
      };
    } catch (error) {
      console.error('Failed to fetch fallback location:', error);
      return null;
    }
  }, []);

  const handleLocationSuccess = useCallback((locationData: UserLocation) => {
    // Save to localStorage for persistence
    localStorage.setItem('userLocation', JSON.stringify(locationData));
    localStorage.removeItem('locationModalDismissed');
    
    dispatch(setUserLocation(locationData));
    dispatch(setLocationPermissionGranted(true));
    dispatch(setLocationModalShown(false));
    setIsRequesting(false);
    setError(null);
    
    if (onClose) onClose();
  }, [dispatch, onClose]);

  const handleLocationError = useCallback(async (err: GeolocationPositionError, currentRetry: number) => {
    setIsRequesting(false);
    
    // Handle different error types with more specific messages
    if (err.code === err.PERMISSION_DENIED) {
      setError('Location permission denied. You can still browse rides but nearby suggestions will be limited.');
      localStorage.setItem('locationModalDismissed', 'true');
      dispatch(setLocationPermissionGranted(false));
      return;
    }
    
    if (err.code === err.POSITION_UNAVAILABLE) {
      setError('Location information is unavailable. Trying fallback location service...');
      
      // Try fallback location service
      const fallbackLocation = await fetchFallbackLocation();
      if (fallbackLocation) {
        handleLocationSuccess(fallbackLocation);
        return;
      }
      
      setError('Location information is unavailable and fallback location service failed. Please check your device settings and try again.');
      return;
    }
    
    if (err.code === err.TIMEOUT) {
      // Implement retry logic for timeout errors
      if (currentRetry < 2) {
        setRetryCount(currentRetry + 1);
        setError('Location request timed out. Retrying...');
        // Retry after a short delay
        setTimeout(() => {
          requestLocationWithRetry(currentRetry + 1);
        }, 2000);
        return;
      } else {
        setError('Location request timed out after multiple attempts. Trying fallback location service...');
        
        // Try fallback location service
        const fallbackLocation = await fetchFallbackLocation();
        if (fallbackLocation) {
          handleLocationSuccess(fallbackLocation);
          return;
        }
        
        setError('Location request timed out. Please check your connection and try again, or use the fallback location.');
      }
      return;
    }
    
    // Unknown error
    setError('An unknown error occurred while getting your location. Trying fallback location service...');
    
    // Try fallback location service
    const fallbackLocation = await fetchFallbackLocation();
    if (fallbackLocation) {
      handleLocationSuccess(fallbackLocation);
      return;
    }
    
    setError('Unable to determine your location. Please try again later.');
  }, [dispatch, fetchFallbackLocation, handleLocationSuccess]);

  const requestLocationWithRetry = useCallback(async (currentRetry: number = 0) => {
    if (!navigator.geolocation) {
      // Try fallback location service
      const fallbackLocation = await fetchFallbackLocation();
      if (fallbackLocation) {
        handleLocationSuccess(fallbackLocation);
        return;
      }
      setError('Geolocation is not supported by your browser and fallback location service failed.');
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      // Use Promise-based approach for better error handling
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: currentRetry === 0, // Try high accuracy first, fallback to low on retry
            timeout: currentRetry === 0 ? 15000 : 10000, // Reduce timeout on retry
            maximumAge: 300000, // 5 minutes cache
          }
        );
      });

      const locationData: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      };

      handleLocationSuccess(locationData);

    } catch (err: unknown) {
      if (err instanceof GeolocationPositionError) {
        handleLocationError(err, currentRetry);
      } else {
        setIsRequesting(false);
        setError('An unexpected error occurred. Please try again.');
      }
    }
  }, [fetchFallbackLocation, handleLocationSuccess, handleLocationError]);

  const requestLocation = useCallback(() => {
    setRetryCount(0);
    requestLocationWithRetry(0);
  }, [requestLocationWithRetry]);

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

  const handleUseFallback = async () => {
    setIsRequesting(true);
    setError(null);
    
    const fallbackLocation = await fetchFallbackLocation();
    if (fallbackLocation) {
      handleLocationSuccess(fallbackLocation);
    } else {
      setIsRequesting(false);
      setError('Unable to get location from IP. Please enable location services or try again.');
    }
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
          
          {/* Fallback option */}
          <button
            onClick={handleUseFallback}
            disabled={isRequesting}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Use Approximate Location
          </button>
          
          <button
            onClick={handleSkip}
            className="w-full text-gray-500 py-2 px-4 rounded-lg font-medium hover:text-gray-700 transition-colors"
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
