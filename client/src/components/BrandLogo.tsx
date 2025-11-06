import React from 'react';
import brandLogoDataUri from '@/assets/brand-logo.txt?raw';
import { cn } from '@/lib/utils';

type BrandLogoSize = 'sm' | 'md' | 'lg';

type BrandLogoProps = {
  /**
   * Visual size preset for the rendered logo.
   */
  size?: BrandLogoSize;
  /**
   * Accessible alternative text for the logo image.
   */
  alt?: string;
  className?: string;
};

const sizeClassMap: Record<BrandLogoSize, string> = {
  sm: 'h-12',
  md: 'h-20',
  lg: 'h-28',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  alt = 'Builder.Contractors logo',
  className,
}) => {
  return (
    <img
      src={brandLogoDataUri}
      alt={alt}
      className={cn('w-auto select-none', sizeClassMap[size], className)}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
};

export default BrandLogo;
