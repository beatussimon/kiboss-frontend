import { Shield, ShieldCheck, Award } from 'lucide-react';

interface VerificationBadgeProps {
  tier?: string;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg';
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
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getBadgeContent = () => {
    if (color === 'gold') {
      return (
        <div className="relative inline-flex" title="Gold Verified">
          <Award className={`${sizeClasses[size]} text-yellow-500 fill-yellow-500`} />
        </div>
      );
    }
    
    if (color === 'blue') {
      return (
        <div className="relative inline-flex" title="Verified">
          <ShieldCheck className={`${sizeClasses[size]} text-blue-500 fill-blue-500`} />
        </div>
      );
    }
    
    // Gray/basic verification
    return (
      <div className="relative inline-flex" title="Verified">
        <Shield className={`${sizeClasses[size]} text-gray-500 fill-gray-500`} />
      </div>
    );
  };

  const getLabel = () => {
    if (color === 'gold') return 'Gold';
    if (color === 'blue') return 'Verified';
    return 'Verified';
  };

  return (
    <span className="inline-flex items-center gap-1">
      {getBadgeContent()}
      {showLabel && (
        <span className={`${labelSizeClasses[size]} font-medium text-gray-600`}>
          {getLabel()}
        </span>
      )}
    </span>
  );
}
