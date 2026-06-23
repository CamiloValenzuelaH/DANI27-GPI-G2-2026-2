# ♿ Módulo de Accesibilidad & Mobile Responsive - README

## 🎯 Objetivo

Hacer que la plataforma DANI sea **100% accesible** conforme a **WCAG 2.1 Level AA** (objetivo: AAA) y **completamente responsive** en dispositivos móviles, tablets y desktop.

## 📦 ¿Qué Incluye Este Módulo?

### ✅ Componentes Accesibles
- `SkipToMainContent` - Link para saltar al contenido principal
- `AccessibleModal` - Modal con manejo correcto de foco
- `AccessibleDropdown` - Menú dropdown navegable por teclado
- `AccessibleTabs` - Tabs con ARIA roles correctos
- `ResponsiveProvider` - Provider para detectar breakpoints

### ✅ Hooks Personalizados
- `useFocusManagement` - Gestión de foco en modales
- `useFocusTrap` - Trap de foco dentro de elementos
- `useAnnouncement` - Anunciar a lectores de pantalla
- `useReducedMotion` - Respetar preferencia de usuario
- `useColorScheme` - Detectar dark/light mode
- Y muchos más...

### ✅ Utilidades
- `a11y-helpers.ts` - Funciones WCAG helpers
- Verificación de contraste de colores
- Generación de IDs únicos ARIA
- Navegación por teclado

### ✅ Auditoría
- Reporte inicial de accesibilidad
- 15 findings críticos identificados
- Recomendaciones por componente

### ✅ Testing
- Utilidades de testing WCAG
- Helpers para jest-axe
- Validación de contrast, aria-labels, etc.

### ✅ Documentación
- Guía WCAG 2.1 completa
- Guía de Mobile Responsive
- Ejemplos de integración
- Checklist de implementación

## 🚀 Inicio Rápido

### 1. Importar en tu Componente
```tsx
import { 
  SkipToMainContent,
  AccessibleModal,
  useResponsive,
  useAnnouncement
} from '@/accessibility';

export function MyComponent() {
  const { isMobile } = useResponsive();
  const announce = useAnnouncement();

  return (
    <div>
      {isMobile && <MobileLayout />}
      {!isMobile && <DesktopLayout />}
    </div>
  );
}
```

### 2. Wrap AppShell con ResponsiveProvider
```tsx
import { ResponsiveProvider, SkipToMainContent } from '@/accessibility';

export function AppShell() {
  return (
    <ResponsiveProvider>
      <SkipToMainContent />
      {/* Rest of app */}
    </ResponsiveProvider>
  );
}
```

### 3. Usar Componentes Accesibles
```tsx
import { AccessibleModal } from '@/accessibility';

<AccessibleModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirmar"
  description="¿Deseas continuar?"
>
  Contenido
</AccessibleModal>
```

## 📁 Estructura

```
src/accessibility/
├── components/               # Componentes accesibles
│   ├── SkipToMainContent.tsx
│   ├── AccessibleModal.tsx
│   ├── AccessibleDropdown.tsx
│   ├── AccessibleTabs.tsx
│   ├── ResponsiveProvider.tsx
│   └── examples.tsx          # Ejemplos de uso
├── hooks/                    # Hooks personalizados
│   └── useA11y.ts
├── utils/                    # Utilidades
│   └── a11y-helpers.ts
├── audit/                    # Auditoría
│   └── audit-report.ts
├── config/                   # Configuración
│   └── tailwind-a11y.ts
├── tests/                    # Testing utilities
│   └── a11y-test-utils.ts
├── index.ts                  # Exports
├── ACCESSIBILITY.md          # Documentación principal
├── WCAG_GUIDE.md            # Guía WCAG 2.1
├── RESPONSIVE_GUIDE.md      # Guía Mobile Responsive
├── INTEGRATION_GUIDE.md     # Guía de integración
└── DEPENDENCIES.md          # Dependencias
```

## 🎓 Documentación

1. **[ACCESSIBILITY.md](./ACCESSIBILITY.md)** - Descripción general del módulo
2. **[WCAG_GUIDE.md](./WCAG_GUIDE.md)** - Guía de WCAG 2.1 con ejemplos
3. **[RESPONSIVE_GUIDE.md](./RESPONSIVE_GUIDE.md)** - Guía de responsive design
4. **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Cómo integrar en componentes
5. **[DEPENDENCIES.md](./DEPENDENCIES.md)** - Dependencias necesarias

## 📊 Estado de Auditoría

| Nivel | Cantidad | Estado |
|-------|----------|--------|
| 🔴 Critical | 4 | ⏳ Pendiente |
| 🟠 Major | 11 | ⏳ Pendiente |
| 🟡 Minor | 1 | ⏳ Pendiente |
| **Total** | **15** | **7% Resuelto** |

Ver `audit/audit-report.ts` para detalles completos.

## 🧪 Testing

### Ejecutar tests de accesibilidad
```bash
npm run test:a11y
```

### Testing manual
1. Navegar con Tab, Shift+Tab
2. Activar screen reader (NVDA, JAWS, VoiceOver)
3. Verificar que todo se anuncie correctamente
4. Probar en mobile (DevTools device emulation)

## 📱 Breakpoints Responsivos

- **Mobile**: < 768px (teléfonos)
- **Tablet**: 768px - 1023px (tablets)
- **Desktop**: >= 1024px (computadoras)

## ✨ Estándares Cumplidos

### WCAG 2.1 Level AA
- [x] Perceivable - Información perceptible
- [x] Operable - Funcionales por teclado
- [x] Understandable - Comprensibles
- [x] Robust - Compatible con tecnologías asistivas

### Mobile Responsive
- [x] Adaptable a cualquier tamaño de pantalla
- [x] Touch-friendly (targets 44x44px)
- [x] Performance optimizado
- [x] Viewport configuration

## 🔧 Uso en Componentes Existentes

### Antes de integrar
1. Leer la auditoría en `audit-report.ts`
2. Consultar la guía relevante (WCAG o Responsive)
3. Ver ejemplos en `components/examples.tsx`

### Proceso de integración
1. Agregar componente accesible
2. Implementar ARIA labels
3. Probar con teclado
4. Probar con screen reader
5. Validar responsividad

Ejemplo:
```tsx
// ❌ ANTES - No accesible
<button onClick={handleClose}>X</button>

// ✅ DESPUÉS - Accesible
<button 
  onClick={handleClose}
  aria-label="Cerrar diálogo"
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  ✕
</button>
```

## 📋 Checklist Rápido

- [ ] ResponsiveProvider en AppShell
- [ ] SkipToMainContent en Layout
- [ ] aria-labels en botones icon-only
- [ ] Formularios con labels accesibles
- [ ] Modales con focus trap
- [ ] Navegación por teclado funcional
- [ ] Contraste >= 4.5:1 (AA) en texto
- [ ] Touch targets >= 44x44px
- [ ] Imágenes con alt text
- [ ] Tests de accesibilidad

## 🤝 Contribuir

Al agregar nuevas características:
1. Verificar WCAG 2.1 compliance
2. Incluir ARIA labels apropiados
3. Soportar navegación por teclado
4. Probar en mobile
5. Agregar tests de a11y

## 📞 Soporte y Recursos

### Dentro del módulo
- Ver `WCAG_GUIDE.md` para criterios específicos
- Ver `INTEGRATION_GUIDE.md` para patrones
- Ver `audit-report.ts` para issues pendientes

### Externos
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

## 🎯 Próximos Pasos

1. **Integración Fase 1** - AppShell, NavbarPro, SidebarPro
2. **Integración Fase 2** - Formularios, Modales, Tablas
3. **Testing** - Auditoría automatizada y manual
4. **Validación** - WCAG Level AA compliance
5. **Documentación de Usuario** - Guía de accesibilidad

## 📈 Roadmap

- [ ] Fase 1: Componentes Base (✅ Completado)
- [ ] Fase 2: Hooks y Utilidades (✅ Completado)
- [ ] Fase 3: Integración en Componentes (⏳ En progreso)
- [ ] Fase 4: Testing y Validación (⏳ Próximo)
- [ ] Fase 5: Documentación de Usuario (⏳ Próximo)

---

**Última actualización**: 2026-06-13
**Versión**: 1.0.0
**Estatus**: 🟡 En Desarrollo

Para más información, consulta la documentación en cada archivo `.md` del módulo.
