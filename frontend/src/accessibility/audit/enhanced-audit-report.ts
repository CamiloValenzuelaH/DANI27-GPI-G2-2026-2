/**
 * Enhanced Accessibility Audit Report
 * Con criterios específicos para mobile, seguridad y Lighthouse >= 90
 */

export interface AuditFinding {
  id: string;
  component: string;
  level: 'critical' | 'major' | 'minor';
  criterion: string;
  issue: string;
  recommendation: string;
  status: 'not-started' | 'in-progress' | 'resolved';
  tags?: string[];
}

export const enhancedAccessibilityAudit: AuditFinding[] = [
  // Mobile-First Issues (320px minimum)
  {
    id: 'mobile-001',
    component: 'Global Layout',
    level: 'critical',
    criterion: 'Mobile-First - 320px minimum',
    issue: 'Content no es visible o usable en pantallas de 320px',
    recommendation:
      'Usar mobile-first approach, media queries min-width. Probar con DevTools a 320px ancho.',
    status: 'not-started',
    tags: ['mobile', 'responsive', 'critical'],
  },
  {
    id: 'mobile-002',
    component: 'Touch Targets',
    level: 'major',
    criterion: 'WCAG 2.5.5 Target Size - 44x44px',
    issue: 'Botones y elementos interactivos < 44x44px en mobile',
    recommendation:
      'Usar MobileOptimizedButton, asegurar h-11 w-11 en mobile (44px = 11 * 4px)',
    status: 'not-started',
    tags: ['mobile', 'touch', 'a11y'],
  },
  {
    id: 'mobile-003',
    component: 'Sidebar Navigation',
    level: 'critical',
    criterion: 'Mobile - Drawer Pattern',
    issue: 'Sidebar no es drawer en mobile',
    recommendation:
      'Usar MobileOptimizedDrawer component. Full-width drawer en mobile, sidebar en desktop.',
    status: 'not-started',
    tags: ['mobile', 'navigation'],
  },
  {
    id: 'mobile-004',
    component: 'Modals',
    level: 'major',
    criterion: 'Mobile - Full-Screen Modals',
    issue: 'Modals no adaptan al tamaño de pantalla en mobile',
    recommendation:
      'Usar MobileOptimizedModal. Full-screen bottom sheet en mobile, centered en desktop.',
    status: 'not-started',
    tags: ['mobile', 'modal'],
  },
  {
    id: 'mobile-005',
    component: 'Keyboard',
    level: 'critical',
    criterion: 'Mobile - Keyboard Viewport',
    issue: 'Teclado oculta inputs en mobile',
    recommendation:
      'Usar useKeyboardViewport hook. Auto-scroll input a vista cuando teclado aparece.',
    status: 'not-started',
    tags: ['mobile', 'keyboard', 'critical'],
  },
  {
    id: 'mobile-006',
    component: 'Scroll',
    level: 'major',
    criterion: 'Mobile - No Unwanted Horizontal Scroll',
    issue: 'Scroll horizontal involuntario en mobile',
    recommendation:
      'Usar usePreventHorizontalScroll hook. Permitir scroll horizontal solo en contenedores específicos.',
    status: 'not-started',
    tags: ['mobile', 'layout'],
  },
  {
    id: 'mobile-007',
    component: 'Tables',
    level: 'major',
    criterion: 'Mobile - Table Horizontal Scroll',
    issue: 'Tablas no son responsivas en mobile',
    recommendation:
      'Usar ResponsiveTable component con horizontal scroll en mobile. Card view como alternativa.',
    status: 'not-started',
    tags: ['mobile', 'table'],
  },

  // Security Issues
  {
    id: 'security-001',
    component: 'Modals',
    level: 'critical',
    criterion: 'Security - Modal Background Visibility',
    issue: 'Modal es visible en background cuando teclado se abre',
    recommendation:
      'Usar useModalBackdropSecurity hook. Backdrop cubre viewport completo incluso con teclado.',
    status: 'not-started',
    tags: ['security', 'modal', 'critical'],
  },
  {
    id: 'security-002',
    component: 'Navigation',
    level: 'major',
    criterion: 'Security - Drawer Auto-Close',
    issue: 'Drawer sidebar no cierra al navegar a otra página',
    recommendation:
      'Usar useCloseOnNavigation hook. Drawer se cierra automáticamente después de navegación.',
    status: 'not-started',
    tags: ['security', 'navigation'],
  },
  {
    id: 'security-003',
    component: 'Error Messages',
    level: 'critical',
    criterion: 'Security - Error Information Disclosure',
    issue:
      'Mensajes de error exponen info técnica en screen reader y UI (stack traces, paths)',
    recommendation:
      'Usar SecureErrorHandler. User message genérico, tech details solo en logs dev.',
    status: 'not-started',
    tags: ['security', 'errors', 'a11y', 'critical'],
  },
  {
    id: 'security-004',
    component: 'Forms',
    level: 'major',
    criterion: 'Security - Sensitive Data in Modals',
    issue:
      'Información sensible en modal es visible en background cuando teclado se abre',
    recommendation:
      'Usar MobileOptimizedModal con getModalSafeHeight. Modal adapta altura al teclado.',
    status: 'not-started',
    tags: ['security', 'modal', 'forms'],
  },

  // Accessibility - ARIA & Screen Readers
  {
    id: 'aria-001',
    component: 'Icons & Buttons',
    level: 'critical',
    criterion: 'WCAG 1.1.1 - ARIA Labels',
    issue: 'Botones icon-only sin aria-label',
    recommendation:
      'Todos los botones sin texto visible deben tener aria-label descriptivo.',
    status: 'not-started',
    tags: ['wcag', 'aria', 'critical'],
  },
  {
    id: 'aria-002',
    component: 'Announcements',
    level: 'major',
    criterion: 'WCAG 4.1.3 - Status Messages',
    issue: 'Acciones importantes no son anunciadas a screen readers',
    recommendation:
      'Usar useAnnouncement hook en: guardado, error, éxito, navegación.',
    status: 'not-started',
    tags: ['wcag', 'aria', 'screen-reader'],
  },
  {
    id: 'aria-003',
    component: 'Forms',
    level: 'critical',
    criterion: 'WCAG 1.3.1 - Labels',
    issue: 'Inputs sin labels asociados',
    recommendation:
      'Todos los inputs deben tener <label> o aria-label. Usar MobileOptimizedInput.',
    status: 'not-started',
    tags: ['wcag', 'forms', 'critical'],
  },
  {
    id: 'aria-004',
    component: 'Skip Links',
    level: 'major',
    criterion: 'WCAG 2.4.1 - Bypass Blocks',
    issue: 'No hay skip link al inicio de página',
    recommendation:
      'Agregar SkipToMainContent en inicio de layout. Saltable con Tab.',
    status: 'not-started',
    tags: ['wcag', 'navigation'],
  },

  // Keyboard Navigation
  {
    id: 'keyboard-001',
    component: 'Navigation',
    level: 'critical',
    criterion: 'WCAG 2.1.1 - Keyboard',
    issue: 'No se puede navegar completamente con teclado',
    recommendation:
      'Asegurar Tab order lógico, Enter/Space para botones, Arrow keys para menús.',
    status: 'not-started',
    tags: ['wcag', 'keyboard', 'critical'],
  },
  {
    id: 'keyboard-002',
    component: 'Modals & Drawers',
    level: 'critical',
    criterion: 'WCAG 2.1.2 - No Keyboard Trap',
    issue: 'Focus atrapado en modal/drawer',
    recommendation:
      'Usar useFocusTrap hook. Tab ciclado, Escape para salir, focus restoration.',
    status: 'not-started',
    tags: ['wcag', 'keyboard', 'modal', 'critical'],
  },
  {
    id: 'keyboard-003',
    component: 'Forms',
    level: 'major',
    criterion: 'WCAG 2.4.3 - Focus Order',
    issue: 'Tab order no es lógico',
    recommendation:
      'Mantener Tab order natural (izq a der, arriba a abajo). Usar tabIndex con cuidado.',
    status: 'not-started',
    tags: ['wcag', 'keyboard', 'forms'],
  },

  // Color & Contrast
  {
    id: 'contrast-001',
    component: 'Global',
    level: 'major',
    criterion: 'WCAG 1.4.3 - Contrast 4.5:1 (AA)',
    issue: 'Contraste insuficiente en modo claro u oscuro',
    recommendation:
      'Verificar contraste con getContrastRatio() >= 4.5:1 AA, >= 7:1 AAA.',
    status: 'not-started',
    tags: ['wcag', 'contrast'],
  },
  {
    id: 'contrast-002',
    component: 'Status Indicators',
    level: 'major',
    criterion: 'WCAG 1.4.1 - Use of Color',
    issue: 'Información transmitida solo por color',
    recommendation:
      'Agregar icono, texto o patrón además de color (ej: "✓ Activo" no solo verde).',
    status: 'not-started',
    tags: ['wcag', 'color'],
  },

  // Focus Visual Indicator
  {
    id: 'focus-001',
    component: 'Global',
    level: 'major',
    criterion: 'WCAG 2.4.7 - Focus Visible',
    issue: 'Focus ring no es visible o insuficiente',
    recommendation:
      'Todos los elementos interactivos deben tener focus:ring-2 focus:ring-blue-500.',
    status: 'not-started',
    tags: ['wcag', 'focus'],
  },

  // Lighthouse >= 90 (Accessibility)
  {
    id: 'lighthouse-001',
    component: 'Global',
    level: 'major',
    criterion: 'Lighthouse - Accessibility >= 90',
    issue: 'Lighthouse accessibility score < 90',
    recommendation:
      'Ejecutar Lighthouse en DevTools. Resolver issues de a11y reportados.',
    status: 'not-started',
    tags: ['lighthouse', 'a11y', 'performance'],
  },
];

/**
 * Criterios específicos de entrega
 */
export const deliveryCriteria = {
  mobile: {
    minWidth: 320,
    breakpoints: {
      mobile: '< 768px',
      tablet: '768px - 1023px',
      desktop: '>= 1024px',
    },
    requirements: [
      '✓ Sidebar como drawer en mobile',
      '✓ Header botones 44x44px',
      '✓ Tablas con scroll horizontal',
      '✓ Modales full-screen',
      '✓ Sin scroll horizontal no deseado',
      '✓ Teclado no oculta inputs',
    ],
  },
  accessibility: {
    wcagLevel: 'AA',
    minContrast: '4.5:1',
    requirements: [
      '✓ ARIA labels en elementos sin texto',
      '✓ Focus trap en modales',
      '✓ Skip links al inicio',
      '✓ Anuncios screen reader',
      '✓ Navegación completa teclado',
      '✓ Contraste 4.5:1 mínimo',
    ],
  },
  security: {
    requirements: [
      '✓ Modales no visibles con teclado abierto',
      '✓ Drawer cierra al navegar',
      '✓ Errores sin info técnica sensible',
      '✓ No info sensible en background',
    ],
  },
  performance: {
    lighthouseA11y: 90,
    criteria: [
      '✓ Lighthouse accessibility >= 90',
      '✓ Performance mobile >= 60',
      '✓ LCP < 2.5s',
      '✓ CLS < 0.1',
    ],
  },
};

/**
 * Generar resumen de auditoría
 */
export const getAuditSummary = () => {
  const byLevel = {
    critical: enhancedAccessibilityAudit.filter((f) => f.level === 'critical')
      .length,
    major: enhancedAccessibilityAudit.filter((f) => f.level === 'major').length,
    minor: enhancedAccessibilityAudit.filter((f) => f.level === 'minor').length,
  };

  const byTag = {
    mobile: enhancedAccessibilityAudit.filter((f) =>
      f.tags?.includes('mobile')
    ).length,
    security: enhancedAccessibilityAudit.filter((f) =>
      f.tags?.includes('security')
    ).length,
    wcag: enhancedAccessibilityAudit.filter((f) =>
      f.tags?.includes('wcag')
    ).length,
    keyboard: enhancedAccessibilityAudit.filter((f) =>
      f.tags?.includes('keyboard')
    ).length,
  };

  return {
    total: enhancedAccessibilityAudit.length,
    byLevel,
    byTag,
    percentageComplete: 0,
  };
};
