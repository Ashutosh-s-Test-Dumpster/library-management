import { useEffect } from 'react';

interface UseKeyboardShortcutOptions {
  key: string;
  callback: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export function useKeyboardShortcut({
  key,
  callback,
  enabled = true,
  preventDefault = true,
  ctrlKey = false,
  metaKey = false,
  altKey = false,
}: UseKeyboardShortcutOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }

      // Check modifier keys
      if (e.ctrlKey !== ctrlKey || e.metaKey !== metaKey || e.altKey !== altKey) {
        return;
      }

      // Check if the key matches
      if (e.key.toLowerCase() === key.toLowerCase()) {
        if (preventDefault) {
          e.preventDefault();
        }
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, enabled, preventDefault, ctrlKey, metaKey, altKey]);
}

