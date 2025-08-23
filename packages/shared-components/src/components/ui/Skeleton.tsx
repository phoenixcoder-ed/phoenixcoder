import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', animation = 'pulse', ...props }, ref) => {
    const skeletonVariants = {
      variant: {
        default: 'rounded-md',
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
      },
      animation: {
        pulse: 'animate-pulse',
        wave: 'animate-pulse', // 可以扩展为波浪动画
        none: '',
      },
    };

    const baseClasses = 'bg-muted';
    const variantClasses = skeletonVariants.variant[variant];
    const animationClasses = skeletonVariants.animation[animation];

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses, animationClasses, className)}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };