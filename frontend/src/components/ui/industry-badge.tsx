import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getIndustryLabel } from '@/lib/constants/industries';

interface IndustryBadgeProps {
  industry: string | null;
  variant?: 'default' | 'secondary' | 'outline';
}

export const IndustryBadge: React.FC<IndustryBadgeProps> = ({ 
  industry, 
  variant = 'outline' 
}) => {
  const label = getIndustryLabel(industry);
  
  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
};

export default IndustryBadge;
