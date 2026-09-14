import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
  secondary:
    'border border-border-subtle bg-surface-card text-content-primary hover:bg-surface-subtle',
  ghost: 'text-content-secondary hover:bg-surface-subtle hover:text-content-primary',
  danger: 'bg-danger text-white hover:brightness-95 active:brightness-90 shadow-sm',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-sm text-body-sm',
  md: 'h-10 px-md text-body-md',
  lg: 'h-12 px-lg text-body-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Sizes and states from PROJECT_MASTER.md section 7.
 * While loading the button keeps its width and stays disabled, so a form cannot
 * be double-submitted and the layout does not jump.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth,
    className,
    children,
    disabled,
    type,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-xs rounded-md font-heading font-semibold',
        'transition-colors duration-150 active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});
