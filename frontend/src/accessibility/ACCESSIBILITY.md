# Módulo de Accesibilidad WCAG 2.1 + Mobile Responsive

## 📋 Descripción General

Este módulo implementa soporte completo para:
- **Accesibilidad WCAG 2.1 Level AA** (objetivo: Level AAA)
- **Mobile Responsive Design** (mobile, tablet, desktop)
- **Cumplimiento con estándares de navegación por teclado**
- **Soporte para lectores de pantalla**
- **Preferencias de usuario** (dark mode, reduced motion, high contrast)

## 🏗️ Estructura del Módulo

```
src/accessibility/
├── components/          # Componentes accesibles
│   ├── AccessibleModal.tsx
│   ├── AccessibleDropdown.tsx
│   ├── AccessibleTabs.tsx
│   ├── SkipToMainContent.tsx
│   └── ResponsiveProvider.tsx
├── hooks/              # Hooks personalizados
│   └── useA11y.ts
├── utils/              # Utilidades
│   └── a11y-helpers.ts
├── audit/              # Auditoría de accesibilidad
│   └── audit-report.ts
├── tests/              # Utilidades de testing
│   └── a11y-test-utils.ts
└── index.ts            # Exports principales
```

## 🚀 Componentes Accesibles

### 1. SkipToMainContent
Link para "saltar al contenido principal" - WCAG 2.4.1
```tsx
<SkipToMainContent mainContentId="main-content" />
```

### 2. AccessibleModal
Modal con manejo de foco y trap - WCAG 2.4.3
```tsx
<AccessibleModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirmar acción"
  description="¿Deseas continuar?"
>
  Contenido del modal
</AccessibleModal>
```

### 3. AccessibleDropdown
Dropdown accesible con navegación por teclado - WCAG 2.1.1
```tsx
<AccessibleDropdown
  trigger={<button>Menú</button>}
  items={[
    { id: '1', label: 'Opción 1', onClick: () => {} },
    { id: '2', label: 'Opción 2', onClick: () => {} },
  ]}
/>
```

### 4. AccessibleTabs
Tabs accesibles con ARIA - WCAG 2.1.1
```tsx
<AccessibleTabs
  tabs={[
    { id: 'tab1', label: 'Pestaña 1', content: <div>Contenido 1</div> },
    { id: 'tab2', label: 'Pestaña 2', content: <div>Contenido 2</div> },
  ]}
  onChange={(tabId) => console.log(tabId)}
/>
```

### 5. ResponsiveProvider
Provider para detectar breakpoints responsivos
```tsx
<ResponsiveProvider>
  <App />
</ResponsiveProvider>
```

## 🪝 Hooks Personalizados

### useA11y Hooks
```tsx
// Focus management
const { isFocusVisible, ref } = useFocusVisible();

// Focus trap
const containerRef = useFocusTrap(isDialogOpen);

// Announcements
const announce = useAnnouncement();
announce('Elemento guardado exitosamente');

// Preferencias del usuario
const prefersReduced = useReducedMotion();
const colorScheme = useColorScheme();
const prefersContrast = useHighContrast();

// ARIA states
const { isExpanded, toggle, ariaExpanded } = useAriaExpanded();
const { isSelected, ariaSelected } = useAriaSelected();
```

## 🛠️ Utilidades

### a11y-helpers.ts
```tsx
// Crear IDs únicos para ARIA
const id = createAriaId('button', 'submit');

// Anunciar a lectores de pantalla
announceToScreenReader('Acción completada');

// Verificar contraste
const ratio = getContrastRatio('#000000', '#FFFFFF');
// >= 7:1 para AAA, >= 4.5:1 para AA

// Navegación por teclado
handleArrowKeyNavigation(event, items, currentIndex, 'vertical');

// Skip link attributes
const skipAttrs = skipToMainAttrs();
```

## 📱 Mobile Responsive

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: >= 1024px

### Uso de ResponsiveProvider
```tsx
import { useResponsive } from '@/accessibility/components/ResponsiveProvider';

export function MyComponent() {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
  
  return (
    <div className={isMobile ? 'text-sm' : 'text-base'}>
      {isMobile && <MobileNav />}
      {isDesktop && <DesktopNav />}
    </div>
  );
}
```

## ✅ Auditoría WCAG 2.1

### Estado Actual
Ver `src/accessibility/audit/audit-report.ts`

- **Critical**: 4 issues
- **Major**: 11 issues
- **Minor**: 1 issue

### Criterios WCAG Implementados

#### Perceivable (Perceptible)
- ✅ 1.1.1 Non-text Content (alt text, ARIA labels)
- ✅ 1.3.1 Info and Relationships (semantic HTML, ARIA)
- ✅ 1.4.1 Use of Color (no solo color)
- ⏳ 1.4.3 Contrast (4.5:1 AA / 7:1 AAA)
- ✅ 1.4.10 Reflow (responsive design)

#### Operable (Operativo)
- ✅ 2.1.1 Keyboard (navegación completa por teclado)
- ✅ 2.1.2 No Keyboard Trap (escape siempre disponible)
- ✅ 2.4.1 Bypass Blocks (skip link)
- ✅ 2.4.3 Focus Order (manejo de focus)
- ✅ 2.4.4 Link Purpose (texto de links descriptivo)
- ✅ 2.5.5 Target Size (44x44 px mínimo)

#### Understandable (Entendible)
- ✅ 3.3.1 Error Identification (aria-invalid)
- ✅ 3.3.4 Error Prevention (confirmaciones)

#### Robust (Robusto)
- ✅ 4.1.2 Name, Role, Value (ARIA roles)
- ✅ 4.1.3 Status Messages (aria-live)

## 🧪 Testing

### Utilidades de Testing
```tsx
import { testA11y, testContrast, testKeyboardNavigation } from '@/accessibility/tests/a11y-test-utils';

// Test general de a11y
await testA11y(<MyComponent />);

// Test de contraste
testContrast('#000000', '#FFFFFF', 'AA');

// Test de navegación por teclado
testKeyboardNavigation(<MyComponent />, ['button1', 'button2']);
```

## 📋 Checklist de Implementación

### Fase 1: Componentes Base (✅ Completado)
- [x] SkipToMainContent
- [x] AccessibleModal
- [x] AccessibleDropdown
- [x] AccessibleTabs
- [x] ResponsiveProvider

### Fase 2: Hooks y Utilidades (✅ Completado)
- [x] useA11y hooks
- [x] a11y-helpers
- [x] Testing utilities

### Fase 3: Integración en Componentes Existentes (⏳ Próximo)
- [ ] AppShell - Agregar SkipToMainContent
- [ ] NavbarPro - Mejorar aria-labels en botones
- [ ] SidebarPro - Navegación accesible
- [ ] Forms - Labels y validación accesible
- [ ] Modals - Usar AccessibleModal
- [ ] Responsive - ResponsiveProvider en AppShell

### Fase 4: Testing y Validación (⏳ Próximo)
- [ ] Auditoría automatizada (jest-axe)
- [ ] Testing manual con screen readers
- [ ] Testing en navegadores móviles
- [ ] Testing de contraste

### Fase 5: Documentación de Usuario (⏳ Próximo)
- [ ] Guía para desarrolladores
- [ ] Guía para usuarios
- [ ] Declaración de accesibilidad

## 🌐 Navegadores Soportados

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Android 90+

## 📚 Referencias

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

## 🤝 Contribuir

Al agregar nuevos componentes o características:

1. **Verificar WCAG 2.1 compliance**
2. **Incluir ARIA labels apropiados**
3. **Soportar navegación por teclado**
4. **Probar con screen readers** (NVDA, JAWS, VoiceOver)
5. **Verificar contraste de colores**
6. **Agregar tests de a11y**

## 📞 Soporte

Para preguntas o problemas de accesibilidad:
1. Revisar auditoría en `audit-report.ts`
2. Consultar documentación de componentes
3. Ejecutar tests de a11y
4. Reportar issues con contexto específico

---

**Última actualización**: 2026-06-13
**Versión**: 1.0.0
