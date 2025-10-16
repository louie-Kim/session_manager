import * as React from 'react';

import { cn } from '@/lib/utils';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg';

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  default:
    'bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 focus-visible:outline-neutral-950 ' +
    'dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:focus-visible:outline-neutral-200',
  secondary:
    'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:outline-neutral-300 ' +
    'dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:outline-neutral-600',
  outline:
    'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 focus-visible:outline-neutral-500 ' +
    'dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900 dark:focus-visible:outline-neutral-600',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:outline-neutral-400 ' +
    'dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus-visible:outline-neutral-600',
  destructive:
    'bg-red-600 text-white shadow-sm hover:bg-red-500 focus-visible:outline-red-600 ' +
    'dark:bg-red-500 dark:text-red-50 dark:hover:bg-red-400 dark:focus-visible:outline-red-400',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 rounded-md px-3 text-xs',
  lg: 'h-11 rounded-lg px-6 text-base',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', loading = false, disabled, children, ...props },
  ref,
) {
  const isDisabled = disabled ?? loading;
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
      disabled={isDisabled}
      data-loading={loading ? 'true' : undefined}
      {...props}
    >
      {children}
    </button>
  );
});
