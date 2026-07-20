import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, children, title, size = 'lg' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxW = size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} />
      <div
        className={`relative bg-white w-full ${maxW} max-h-[90vh] overflow-hidden shadow-panel border border-[var(--line)] animate-slideUp`}
      >
        <div className="h-1 w-full bg-gradient-to-l from-primary via-primary to-secondary" />
        <div className="sticky top-0 z-10 bg-white border-b border-[var(--line)] px-5 py-3.5 flex justify-between items-center">
          {title ? (
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
              <span className="w-1 h-5 bg-primary inline-block" />
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-ink-50 text-ink-400 hover:text-ink transition-colors"
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 md:p-6 overflow-y-auto max-h-[calc(90vh-4.5rem)]">{children}</div>
      </div>
    </div>
  );
}
