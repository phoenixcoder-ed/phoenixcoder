import React from 'react';
import { cn } from '../../utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'sm' | 'lg' | 'xl';
  variant?: 'circle' | 'square';
  src?: string;
  alt?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = 'default', variant = 'circle', src, alt, fallback, ...props }, ref) => {
    const avatarVariants = {
      size: {
        default: 'h-10 w-10',
        sm: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
      },
      variant: {
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    };

    const baseClasses = 'relative flex shrink-0 overflow-hidden';
    const sizeClasses = avatarVariants.size[size];
    const variantClasses = avatarVariants.variant[variant];

    return (
      <div
        ref={ref}
        className={cn(baseClasses, sizeClasses, variantClasses, className)}
        {...props}
      >
        {src ? (
          <AvatarImage src={src} alt={alt || ''} />
        ) : (
          <AvatarFallback>
            {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
          </AvatarFallback>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => (
    <img
      ref={ref}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  )
);

AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);

AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };