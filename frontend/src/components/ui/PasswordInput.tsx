import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { Input, type InputProps } from './Input';

/**
 * Password field with a show/hide toggle, used by login, signup, reset, the
 * password gate, and security settings.
 *
 * The toggle is a real button with an aria-label rather than an icon on a span:
 * revealing a password is an action, and a keyboard user needs to reach it.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);
    const Icon = visible ? EyeOff : Eye;

    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="rounded-md p-2xs text-content-tertiary hover:text-content-primary"
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        }
        {...props}
      />
    );
  }
);
