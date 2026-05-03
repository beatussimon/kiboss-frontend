import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { closeUpgradeModal } from '../../features/assets/assetsSlice';
import { Link } from 'react-router-dom';
import { Crown, Building2, X, AlertTriangle, ArrowRight } from 'lucide-react';

export function UpgradeRequiredModal() {
  const dispatch = useDispatch();
  const { showUpgradeModal, upgradeModalMessage, upgradeRequiredTier } = useSelector((state: RootState) => state.assets);

  if (!showUpgradeModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button
          onClick={() => dispatch(closeUpgradeModal())}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-black text-center text-gray-900 dark:text-white mb-2">Limit Reached</h2>
        <p className="text-center text-gray-500 mb-8">{upgradeModalMessage || `You need the ${upgradeRequiredTier} plan to perform this action.`}</p>

        <div className={`rounded-2xl p-6 border-2 mb-6 ${upgradeRequiredTier === 'PLUS' ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20' : 'bg-primary-50 border-primary-200 dark:bg-primary-900/20'}`}>
          <div className="flex items-center gap-3 mb-4">
            {upgradeRequiredTier === 'PLUS' ? <Crown className="h-6 w-6 text-purple-600" /> : <Building2 className="h-6 w-6 text-primary-600" />}
            <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-widest">{upgradeRequiredTier} Plan Required</h3>
          </div>
          <ul className="space-y-2 mb-6 text-sm font-medium text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">✓ Increased listing limits</li>
            <li className="flex items-center gap-2">✓ Advanced analytics dashboard</li>
            <li className="flex items-center gap-2">✓ Premium support</li>
          </ul>
          <Link
            to="/upgrade"
            onClick={() => dispatch(closeUpgradeModal())}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-white ${upgradeRequiredTier === 'PLUS' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            View Plans & Upgrade <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <button
          onClick={() => dispatch(closeUpgradeModal())}
          className="w-full py-3 font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
