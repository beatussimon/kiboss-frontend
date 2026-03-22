import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function SmartBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Basic smart back logic - can be expanded based on history stack length
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Fallback logical paths if opened directly
      const pathparts = location.pathname.split('/').filter(Boolean);
      if (pathparts.length > 1) {
        navigate(`/${pathparts[0]}`);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <button
      onClick={handleBack}
      className="p-1.5 mr-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex-shrink-0"
      title="Go Back"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}
