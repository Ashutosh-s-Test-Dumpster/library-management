import { ReactNode, useEffect } from 'react';
import Portal from '@/components/Portal';
import { BACKDROP_CLASSES, MODAL_ANIMATION } from '@/constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className = '',
  closeOnBackdropClick = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className={`absolute inset-0 ${BACKDROP_CLASSES}`}
          onClick={closeOnBackdropClick ? onClose : undefined}
        />
        <div className={`relative w-full max-w-lg flat-card border-2 border-border-accent p-4 md:p-8 overflow-y-auto max-h-[90vh] ${MODAL_ANIMATION} ${className}`}>
          {children}
        </div>
      </div>
    </Portal>
  );
}

