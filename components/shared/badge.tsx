import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { Badge as ShadcnBadge } from '@/components/ui/badge';

interface BadgeProps {
  type: string;
  className?: string;
}

const Badge = ({ type, className = '' }: BadgeProps) => {
  // Badge configurations
  const badgeConfig: Record<string, { icon: React.ReactNode; text: string; className?: string }> = {
    rookie: {
      icon: <BadgeCheck className="h-3 w-3" />,
      text: 'Verified',
      className: 'bg-blue-500 text-white dark:bg-blue-600 gap-1'
    },
    // Add more badge types here in the future
  };

  const config = badgeConfig[type];
  
  if (!config) return null;

  return (
    <ShadcnBadge className={`${config.className} ${className}`}>
      {config.icon}
      <span>{config.text}</span>
    </ShadcnBadge>
  );
};

export default Badge;