/**
 * Mobile-Optimized Accessible Components
 * 320px minimum, touch-friendly, keyboard-safe
 */

import React, { useState, useRef, useEffect } from 'react';
import { useFocusTrap, useAnnouncement } from '../hooks/useA11y';
import { getModalSafeHeight, useModalBackdropSecurity, useKeyboardViewport } from '../hooks/useMobileViewport';

interface MobileOptimizedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  minWidth?: number; // Para testing responsividad
}

/**
 * Input optimizado para mobile
 * - Touch target 44px
 * - Evita que teclado oculte input
 * - Accesible
 */
export const MobileOptimizedInput: React.FC<MobileOptimizedInputProps> = ({
  label,
  value,
  onChange,
  error,
  type = 'text',
  required,
  minWidth = 320,
}) => {
  const { inputRef } = useKeyboardViewport();
  const errorId = `error-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2 min-w-screen" style={{ minWidth: `${minWidth}px` }}>
      <label htmlFor={label} className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>

      <input
        ref={inputRef}
        id={label}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        required={required}
        // Touch-friendly: 44px mínimo height
        className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base aria-invalid:border-red-500 aria-invalid:ring-red-500 sm:h-10"
      />

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-600 mt-1"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

interface MobileOptimizedButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  ariaLabel?: string;
  fullWidth?: boolean;
}

/**
 * Botón optimizado para mobile
 * - Touch target 44x44px mínimo
 * - Accesible con aria-label
 * - Feedback visual
 */
export const MobileOptimizedButton: React.FC<MobileOptimizedButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  ariaLabel,
  fullWidth = false,
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      // Touch target: 44x44px mínimo
      className={`
        h-11 px-4 rounded-lg font-medium text-base
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        active:scale-95 transition-transform
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : 'min-w-[44px]'}
        sm:h-10 sm:px-3 sm:text-sm
      `}
    >
      {children}
    </button>
  );
};

interface MobileOptimizedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeLabel?: string;
}

/**
 * Drawer (sidebar) optimizado para mobile
 * - Full-width en mobile
 * - Lateral en desktop
 * - Focus trap
 * - Cierra al navegar
 */
export const MobileOptimizedDrawer: React.FC<MobileOptimizedDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeLabel = 'Cerrar menú',
}) => {
  const drawerRef = useFocusTrap(isOpen);
  const announce = useAnnouncement();

  useModalBackdropSecurity(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    // Anunciar a screen readers
    announce(`${title} abierto`, 'polite');

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        announce(`${title} cerrado`, 'polite');
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, title, announce]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0D16] shadow-lg lg:static lg:w-auto lg:shadow-none overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#0A0D16]">
          <h2 id="drawer-title" className="font-semibold text-lg text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </>
  );
};

interface MobileOptimizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  fullScreenMobile?: boolean;
}

/**
 * Modal optimizado para mobile
 * - Full-screen en mobile
 * - Centrado en desktop
 * - Teclado no oculta contenido
 */
export const MobileOptimizedModal: React.FC<MobileOptimizedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  fullScreenMobile = true,
}) => {
  const modalRef = useFocusTrap(isOpen);
  const announce = useAnnouncement();
  const { safeHeight, safeBottomPadding } = useMobileModalDimensions(isOpen);

  useModalBackdropSecurity(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    announce(`${title} abierto`, 'polite');

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        announce(`${title} cerrado`, 'polite');
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, title, announce]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
        style={{ minHeight: '100vh' }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        role="presentation"
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`
            bg-white w-full rounded-t-lg sm:rounded-lg shadow-lg
            max-w-md sm:max-w-lg
            overflow-y-auto
          `}
          style={{
            maxHeight: safeHeight,
            paddingBottom: safeBottomPadding,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h2 id="modal-title" className="font-semibold text-lg">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Cerrar diálogo"
              className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4">{children}</div>
        </div>
      </div>
    </>
  );
};

/**
 * Hook para calcular dimensiones seguras del modal en mobile
 */
function useMobileModalDimensions(isOpen: boolean) {
  const [dimensions, setDimensions] = useState({
    safeHeight: '100vh',
    safeBottomPadding: '0px',
  });

  useEffect(() => {
    if (!isOpen) return;

    const updateDimensions = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight);

      setDimensions({
        safeHeight: `${viewportHeight - 60}px`, // 60px para header
        safeBottomPadding: `${Math.max(keyboardHeight, 16)}px`,
      });
    };

    window.visualViewport?.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => {
      window.visualViewport?.removeEventListener('resize', updateDimensions);
    };
  }, [isOpen]);

  return dimensions;
}
