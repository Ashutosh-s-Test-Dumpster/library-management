import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  characterCount?: number;
  maxCharacters?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      characterCount,
      maxCharacters,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-text-primary text-sm font-medium mb-2 uppercase tracking-wider font-mono">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`flat-input w-full resize-none ${error ? 'border-accent-error' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-accent-error text-xs mt-1 font-mono">{error}</p>
        )}
        {(helperText || (characterCount !== undefined && maxCharacters)) && !error && (
          <p className="text-text-tertiary text-xs mt-1 font-mono">
            {characterCount !== undefined && maxCharacters
              ? `${characterCount}/${maxCharacters} characters`
              : helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;

