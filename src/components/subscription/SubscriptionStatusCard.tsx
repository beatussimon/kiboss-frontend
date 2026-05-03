import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface Props {
  tier: 'FREE' | 'PLUS' | 'BUSINESS';
  expiresAt: string | null;
  isPending: boolean;
}

export function SubscriptionStatusCard({ tier, expiresAt, isPending }: Props) {
  const daysLeft = expiresAt ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

  return (
    <div className={`card p-6 border-2 ${tier === 'PLUS' ? 'border-purple-200 bg-purple-50 dark:bg-purple-900/20' : 'border-primary-200 bg-primary-50 dark:bg-primary-900/20'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Current Plan</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {tier === 'PLUS' ? '✦ Plus' : '◈ Business'}
          </p>
          {expiresAt && (
            <p className={`text-sm mt-1 font-medium ${isExpiringSoon ? 'text-red-600' : 'text-gray-500'}`}>
              {isPending ? 'Pending activation' : `Renews ${format(new Date(expiresAt), 'MMM d, yyyy')}`}
              {isExpiringSoon && !isPending && ` · ${daysLeft} days left`}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className={`text-xs font-black px-3 py-1 rounded-full ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
            {isPending ? 'PENDING' : 'ACTIVE'}
          </span>
        </div>
      </div>
      {isExpiringSoon && (
        <Link to="/upgrade" className="mt-4 block w-full py-2 text-center text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">
          Renew Now — expires in {daysLeft} days
        </Link>
      )}
      {tier === 'PLUS' && (
        <Link to="/upgrade" className="mt-3 block text-xs text-center text-purple-600 font-bold hover:underline">
          Upgrade to Business →
        </Link>
      )}
    </div>
  );
}
