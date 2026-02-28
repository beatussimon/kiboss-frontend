import { Shield, ShieldCheck, Award, Briefcase, BadgeCheck } from 'lucide-react';

interface VerificationBadgeProps {
  tier?: string;
  color?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function VerificationBadge({
  tier = 'none',
  color,
  size = 'md',
  showLabel = false
}: VerificationBadgeProps) {
  // If no color/tier, don't show anything
  if (!color || tier === 'none') {
    return null;
  }

  const sizeClasses = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const labelSizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
  };

  const getBadgeContent = () => {
    // 1. Corporate Business Tier
    if (color === 'indigo' || tier === 'business') {
      return (
        <div className="relative inline-flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100" title="Verified Business">
          <Briefcase className={`${sizeClasses[size]} text-indigo-600`} strokeWidth={2.5} />
          {showLabel && <span className={`${labelSizeClasses[size]} text-indigo-700`}>Business</span>}
        </div>
      );
    }

    // 2. Gold / Top Tier
    if (color === 'gold' || tier === 'gold') {
      return (
        <div className="relative inline-flex items-center gap-1" title="Gold Verified">
          <Award className={`${sizeClasses[size]} text-yellow-500 fill-yellow-500`} />
          {showLabel && <span className={`${labelSizeClasses[size]} text-yellow-700`}>Gold</span>}
        </div>
      );
    }

    // 3. Plus Tier or Standard Premium
    if (color === 'blue' || tier === 'premium') {
      return (
        <div className="relative inline-flex items-center gap-1" title="Plus Verified">
          <BadgeCheck className={`${sizeClasses[size]} text-blue-500 fill-blue-500`} />
          {showLabel && <span className={`${labelSizeClasses[size]} text-blue-700`}>Plus</span>}
        </div>
      );
    }

    // 4. Gray/Basic Verification
    return (
      <div className="relative inline-flex items-center gap-1" title="Verified">
        <ShieldCheck className={`${sizeClasses[size]} text-gray-500 fill-gray-500`} />
        {showLabel && <span className={`${labelSizeClasses[size]} text-gray-600`}>Verified</span>}
      </div>
    );
  };

  return (
    <span className="inline-flex items-center">
      {getBadgeContent()}
    </span>
  );
}
