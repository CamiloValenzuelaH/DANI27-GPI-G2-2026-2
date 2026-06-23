/**
 * Mobile Viewport Keyboard Management
 * Previene que el teclado oculte inputs en mobile
 * Mantiene modales visibles con teclado abierto
 */

import { useEffect, useRef, useState } from 'react';

interface ViewportMetrics {
  windowHeight: number;
  viewportHeight: number;
  keyboardHeight: number;
  isKeyboardVisible: boolean;
}

/**
 * Hook para detectar apertura de teclado en mobile
 * y ajustar scroll automáticamente
 */
export const useKeyboardViewport = () => {
  const [metrics, setMetrics] = useState<ViewportMetrics>({
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    keyboardHeight: 0,
    isKeyboardVisible: false,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight);
      const isKeyboardVisible = keyboardHeight > 50; // Umbral para detectar teclado

      setMetrics({
        windowHeight,
        viewportHeight,
        keyboardHeight,
        isKeyboardVisible,
      });

      // Scroll del input enfocado a la vista cuando el teclado aparece
      if (isKeyboardVisible && inputRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          inputRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 200);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return {
    ...metrics,
    inputRef,
  };
};

/**
 * Hook para prevenir scroll horizontal no deseado
 */
export const usePreventHorizontalScroll = () => {
  useEffect(() => {
    const preventHorizontalScroll = (e: WheelEvent) => {
      // Permitir scroll horizontal solo con Shift o en áreas específicas
      if (!e.shiftKey && (e.target as HTMLElement)?.closest('[data-allow-horizontal]') === null) {
        // No hacer nada, dejar que funcione normalmente
        return;
      }
    };

    // Prevenir touch swipe que cause scroll horizontal
    let touchStartX = 0;
    const preventTouchScroll = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touchStartX) touchStartX = touch.clientX;

      const currentX = touch.clientX;
      const diff = Math.abs(currentX - touchStartX);

      // Si movimiento es muy horizontal (> 50px horizontal, < 10px vertical)
      if (diff > 50) {
        const targetElement = e.target as HTMLElement;
        // Permitir scroll horizontal solo en tablas y areas específicas
        if (!targetElement.closest('.horizontal-scroll-container')) {
          touchStartX = 0; // Reset
        }
      }
    };

    document.addEventListener('touchmove', preventTouchScroll, { passive: true });

    return () => {
      document.removeEventListener('touchmove', preventTouchScroll);
    };
  }, []);
};

/**
 * Hook para cerrar drawer/modal cuando cambia la ruta (navegación)
 */
export const useCloseOnNavigation = (
  isOpen: boolean,
  onClose: () => void,
  deps: any[] = []
) => {
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, deps);
};

/**
 * Utility para calcular altura segura del modal (evita teclado)
 */
export const getModalSafeHeight = (): {
  maxHeight: string;
  paddingBottom: string;
} => {
  if (typeof window === 'undefined') {
    return { maxHeight: '100vh', paddingBottom: '0' };
  }

  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const windowHeight = window.innerHeight;
  const keyboardHeight = Math.max(0, windowHeight - viewportHeight);

  return {
    maxHeight: `${viewportHeight - 60}px`, // 60px para header
    paddingBottom: `${Math.max(keyboardHeight, 16)}px`,
  };
};

/**
 * Prevenir que el modal sea visible en background cuando teclado se abre
 */
export const useModalBackdropSecurity = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight);

      // Si teclado está visible, asegurar que el backdrop cubra todo
      if (keyboardHeight > 50) {
        const backdrop = document.querySelector('[role="presentation"]');
        if (backdrop) {
          (backdrop as HTMLElement).style.minHeight = `${windowHeight}px`;
        }
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);
};

/**
 * Get safe viewport dimensions
 */
export const getSafeViewport = () => {
  if (typeof window === 'undefined') {
    return { width: 375, height: 667 };
  }

  return {
    width: window.visualViewport?.width || window.innerWidth,
    height: window.visualViewport?.height || window.innerHeight,
  };
};
