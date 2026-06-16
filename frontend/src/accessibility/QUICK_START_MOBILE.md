# 📱 Guía Rápida - Mobile, Seguridad & Accesibilidad Mejorada

## 🎯 Criterios de Entrega

```
✅ Mobile: 320px mínimo
✅ Sidebar: Drawer en mobile
✅ Header: Botones 44px
✅ Tablas: Scroll horizontal
✅ Modales: Full-screen mobile
✅ Sin scroll horizontal no deseado
✅ Teclado no oculta inputs

✅ Accesibilidad: ARIA labels, focus trap, skip links
✅ Anuncios screen reader
✅ Navegación teclado completa
✅ Contraste 4.5:1

✅ Seguridad: Modales no visibles con teclado
✅ Drawer auto-close
✅ Errores sin info sensible

✅ Performance: Lighthouse a11y >= 90
```

---

## 🚀 Implementación Rápida

### 1. Header Touch-Friendly (44px)

```tsx
import { MobileOptimizedButton } from '@/accessibility/components/MobileOptimized';

export function Header() {
  return (
    <header className="bg-white shadow">
      <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
        <h1 className="text-lg font-semibold">DANI</h1>
        
        {/* Botones 44px automáticamente */}
        <div className="flex gap-2">
          <MobileOptimizedButton
            onClick={handleMenu}
            ariaLabel="Abrir menú"
          >
            ☰
          </MobileOptimizedButton>
          
          <MobileOptimizedButton
            onClick={handleNotifications}
            ariaLabel="Notificaciones"
          >
            🔔
          </MobileOptimizedButton>
        </div>
      </div>
    </header>
  );
}
```

### 2. Sidebar Como Drawer

```tsx
import { MobileOptimizedDrawer } from '@/accessibility/components/MobileOptimized';
import { useCloseOnNavigation } from '@/accessibility/hooks/useMobileViewport';
import { useLocation } from 'react-router-dom';

export function Layout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  // Cerrar drawer al navegar
  useCloseOnNavigation(isDrawerOpen, () => setIsDrawerOpen(false), [
    location.pathname,
  ]);

  return (
    <>
      <MobileOptimizedDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Menú"
      >
        <nav className="space-y-2">
          <a href="/dashboard">Dashboard</a>
          <a href="/assessments">Evaluaciones</a>
          {/* ... */}
        </nav>
      </MobileOptimizedDrawer>

      <main>Contenido</main>
    </>
  );
}
```

### 3. Inputs Sin Teclado Oculto

```tsx
import { MobileOptimizedInput } from '@/accessibility/components/MobileOptimized';
import { useKeyboardViewport } from '@/accessibility/hooks/useMobileViewport';

export function LoginForm() {
  const { inputRef } = useKeyboardViewport();
  const [email, setEmail] = useState('');

  return (
    <MobileOptimizedInput
      label="Email"
      value={email}
      onChange={setEmail}
      // inputRef incluido automáticamente
      // scroll automático cuando teclado aparece
    />
  );
}
```

### 4. Tablas Responsivas

```tsx
import { ResponsiveTable } from '@/accessibility/components/ResponsiveTable';

const columns = [
  { key: 'name', header: 'Nombre', width: '150px' },
  { key: 'email', header: 'Email', width: '180px' },
  { key: 'status', header: 'Estado', width: '100px' },
];

export function UsersTable() {
  return (
    <ResponsiveTable
      columns={columns}
      data={users}
      ariaLabel="Lista de usuarios"
    />
  );
}
```

### 5. Modales Full-Screen Mobile

```tsx
import { MobileOptimizedModal } from '@/accessibility/components/MobileOptimized';

export function ConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MobileOptimizedModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Confirmar"
      fullScreenMobile={true}
    >
      <p>¿Deseas continuar?</p>
      <div className="flex gap-2 mt-4">
        <MobileOptimizedButton onClick={() => setIsOpen(false)}>
          Cancelar
        </MobileOptimizedButton>
        <MobileOptimizedButton onClick={handleConfirm} variant="primary">
          Confirmar
        </MobileOptimizedButton>
      </div>
    </MobileOptimizedModal>
  );
}
```

### 6. Mensajes de Error Seguros

```tsx
import SecureErrorHandler from '@/accessibility/utils/secure-errors';

export function handleSaveError(error: Error) {
  const secureError = SecureErrorHandler.createSecureError(
    error,
    'No pudimos guardar los cambios. Por favor intenta de nuevo.'
  );

  // Mostrar mensaje seguro al usuario
  showNotification(SecureErrorHandler.getUserMessage(secureError));

  // Screen reader: mensaje seguro
  announce(SecureErrorHandler.getAccessibleMessage(secureError), 'polite');

  // Log técnico solo en desarrollo
  SecureErrorHandler.logTechnical(secureError);
}
```

---

## 🧪 Testing

### Test 320px Mobile

```tsx
import { testMobileViewport320px } from '@/accessibility/tests/mobile-security-tests';

it('debe ser usable en 320px', () => {
  testMobileViewport320px();
});
```

### Test Touch Targets

```tsx
import { testTouchTargets } from '@/accessibility/tests/mobile-security-tests';

it('botones deben ser >= 44px', () => {
  testTouchTargets();
});
```

### Test Sin Scroll Horizontal

```tsx
import { testNoUnwantedHorizontalScroll } from '@/accessibility/tests/mobile-security-tests';

it('no debe haber scroll horizontal', () => {
  testNoUnwantedHorizontalScroll();
});
```

### Test Keyboard Viewport

```tsx
import { testKeyboardViewportHandling } from '@/accessibility/tests/mobile-security-tests';

it('teclado no debe ocultar inputs', async () => {
  await testKeyboardViewportHandling();
});
```

### Test Seguridad Errores

```tsx
import { testSecureErrorMessages } from '@/accessibility/tests/mobile-security-tests';

it('errores no deben exponer info técnica', () => {
  testSecureErrorMessages();
});
```

---

## ✅ Checklist de Implementación

### Fase 1: Header & Navigation
- [ ] Botones header son 44x44px (usar `MobileOptimizedButton`)
- [ ] Header es sticky y visible en mobile
- [ ] Hamburger menu abre drawer
- [ ] Focus ring visible en botones

### Fase 2: Sidebar & Drawers
- [ ] Sidebar es drawer fullwidth en mobile
- [ ] Drawer cierra al navegar
- [ ] Drawer tiene focus trap
- [ ] Escape key cierra drawer
- [ ] aria-label="Cerrar menú" en botón close

### Fase 3: Formularios
- [ ] Inputs usan `MobileOptimizedInput`
- [ ] Inputs tienen height: 44px en mobile (h-11)
- [ ] Teclado no oculta inputs (useKeyboardViewport)
- [ ] Labels son accesibles
- [ ] Errores tienen aria-describedby

### Fase 4: Tablas
- [ ] Tablas usan `ResponsiveTable`
- [ ] Scroll horizontal contenido en mobile
- [ ] Headers tienen scope="col"
- [ ] aria-label descriptivo

### Fase 5: Modales
- [ ] Modales usan `MobileOptimizedModal`
- [ ] Full-screen en mobile
- [ ] Focus trap funcionando
- [ ] Backdrop cubre todo con teclado visible
- [ ] Escape key cierra

### Fase 6: Seguridad
- [ ] Errores usan `SecureErrorHandler`
- [ ] Sin info técnica en mensajes
- [ ] Drawer auto-close en navegación
- [ ] Modales no visibles en background

### Fase 7: Validación
- [ ] Lighthouse a11y >= 90
- [ ] Responsive en 320px
- [ ] Touch targets >= 44px
- [ ] Sin scroll horizontal
- [ ] Teclado no oculta inputs
- [ ] Navegación completa con teclado
- [ ] Contraste >= 4.5:1

---

## 📊 Validación Lighthouse

```bash
# Chrome DevTools → Lighthouse
# Auditar para: Accessibility

Objetivos:
✓ Accessibility Score >= 90
✓ ARIA: Sin issues
✓ Labels: Todo etiquetado
✓ Contrast: >= 4.5:1
✓ Focus: Visible
✓ Navigation: Teclado completo
```

---

## 🔧 Configuración Tailwind

Asegurar que `tailwind.config.ts` incluya:

```typescript
import { mobileTailwindConfig, mobileA11yClasses } from '@/accessibility/config/mobile-tailwind-a11y';

export default {
  theme: {
    extend: {
      ...mobileTailwindConfig,
    },
  },
};
```

---

## 📁 Nuevo Contenido del Módulo

```
src/accessibility/
├── hooks/
│   ├── useA11y.ts                    (existente)
│   └── useMobileViewport.ts          ✨ NUEVO
├── components/
│   ├── MobileOptimized.tsx           ✨ NUEVO
│   ├── ResponsiveTable.tsx           ✨ NUEVO
│   └── ... (existentes)
├── utils/
│   ├── a11y-helpers.ts              (existente)
│   └── secure-errors.ts             ✨ NUEVO
├── config/
│   ├── tailwind-a11y.ts             (existente)
│   └── mobile-tailwind-a11y.ts      ✨ NUEVO
├── audit/
│   ├── audit-report.ts              (existente)
│   └── enhanced-audit-report.ts     ✨ NUEVO
└── tests/
    ├── a11y-test-utils.ts           (existente)
    └── mobile-security-tests.ts     ✨ NUEVO
```

---

## 🎯 Criterios de Éxito

- ✅ 320px mínimo: Testear con DevTools a 320px de ancho
- ✅ Touch 44px: Verificar todos los botones >= 44x44px
- ✅ Sin scroll horizontal: Verificar en mobile DevTools
- ✅ Teclado: Escribir en input, no debe ocultarse
- ✅ Lighthouse: Score >= 90
- ✅ WCAG AA: Contraste 4.5:1, navegación teclado, ARIA labels

---

## 📚 Referencia Rápida

| Componente | Uso | Reemplazo |
|------------|-----|-----------|
| `MobileOptimizedButton` | Botones 44px | Button HTML |
| `MobileOptimizedInput` | Inputs seguros | Input HTML |
| `MobileOptimizedDrawer` | Sidebar mobile | Sidebar fijo |
| `MobileOptimizedModal` | Modal responsive | Dialog MUI |
| `ResponsiveTable` | Tabla mobile | Table HTML |
| `SecureErrorHandler` | Errores seguros | console.error |
| `useKeyboardViewport` | Teclado mobile | Manual |
| `usePreventHorizontalScroll` | Sin scroll H | Manual |
| `useCloseOnNavigation` | Drawer auto-close | Manual |

---

## 🚀 Próximos Pasos

1. Reemplazar componentes existentes con versiones mobile-optimized
2. Ejecutar tests de mobile-security-tests.ts
3. Validar en Lighthouse (a11y >= 90)
4. Testing manual en dispositivos reales (iPhone SE)
5. Go-live con todos los criterios cumplidos

---

¿Preguntas? Revisa los comentarios en el código y los archivos de documentación.
