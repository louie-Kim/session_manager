import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  { className, orientation = 'horizontal', decorative = true, role, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role={decorative ? 'none' : role ?? 'separator'}
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-neutral-200 dark:bg-neutral-800',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
});

