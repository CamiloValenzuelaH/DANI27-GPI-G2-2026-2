# 🔧 Guía de Implementación Paso a Paso

## ✋ ANTES DE EMPEZAR

1. Leer: `ACCESSIBILITY_MODULE_SUMMARY.md` (este archivo)
2. Revisar: `frontend/src/accessibility/README.md`
3. Entender: Los 3 tipos de cambios que harás:
   - **ARIA Attributes**: Propiedades para screen readers
   - **Keyboard Navigation**: Acceso con teclado
   - **Responsive Layout**: Mobile/tablet/desktop

## 📝 Ejemplo Práctico 1: Botón Icon-Only

### ❌ ANTES (No accesible)
```tsx
<button onClick={handleClose}>
  <XIcon size={24} />
</button>
```

**Problemas**:
- Screen reader no sabe qué hace el botón
- Sin focus ring
- Sin aria-label

### ✅ DESPUÉS (Accesible)
```tsx
import { useAriaId } from '@/accessibility/hooks/useA11y';

<button 
  onClick={handleClose}
  aria-label="Cerrar diálogo"
  className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-gray-100"
>
  <XIcon size={24} />
</button>
```

**Cambios**:
1. ✅ Agregado `aria-label` descriptivo
2. ✅ Agregadas clases de focus ring
3. ✅ Mejor padding (touch target)

---

## 📝 Ejemplo Práctico 2: Input de Formulario

### ❌ ANTES (No accesible)
```tsx
<div>
  <input 
    type="email"
    placeholder="Email"
  />
</div>
```

**Problemas**:
- Sin label asociado
- Screen reader no sabe qué espera
- Sin validación a11y

### ✅ DESPUÉS (Accesible)
```tsx
import { useAriaId } from '@/accessibility/hooks/useA11y';

const [email, setEmail] = useState('');
const [error, setError] = useState('');
const inputId = useAriaId('email-input');
const errorId = useAriaId('email-error');

<div className="space-y-1">
  <label htmlFor={inputId} className="block text-sm font-medium">
    Correo Electrónico <span className="text-red-600">*</span>
  </label>
  
  <input 
    id={inputId}
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    aria-invalid={!!error}
    aria-describedby={error ? errorId : undefined}
    required
    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 aria-invalid:border-red-500"
  />
  
  {error && (
    <p id={errorId} role="alert" className="text-sm text-red-600">
      {error}
    </p>
  )}
</div>
```

**Cambios**:
1. ✅ Label explícito con `htmlFor`
2. ✅ `aria-invalid` cuando hay error
3. ✅ `aria-describedby` link a error
4. ✅ `role="alert"` en mensaje de error
5. ✅ Clases de focus ring

---

## 📝 Ejemplo Práctico 3: Modal Dialog

### ❌ ANTES (No accesible)
```tsx
import { Dialog } from '@mui/material';

<Dialog open={isOpen} onClose={handleClose}>
  <div className="p-6">
    <h2>Confirmar Acción</h2>
    <p>¿Deseas continuar?</p>
    <div className="flex gap-2">
      <button onClick={handleClose}>Cancelar</button>
      <button onClick={handleConfirm}>Confirmar</button>
    </div>
  </div>
</Dialog>
```

**Problemas**:
- Sin focus management
- Sin aria-modal
- Sin escape key handling

### ✅ DESPUÉS (Accesible)
```tsx
import { AccessibleModal } from '@/accessibility/components/AccessibleModal';

<AccessibleModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirmar Acción"
  description="¿Deseas continuar? Esta acción no puede deshacerse."
>
  <div className="space-y-4">
    <p>¿Realmente deseas continuar?</p>
    
    <div className="flex gap-2">
      <button 
        onClick={handleClose}
        className="px-4 py-2 border rounded hover:bg-gray-50"
      >
        Cancelar
      </button>
      
      <button 
        onClick={handleConfirm}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Confirmar
      </button>
    </div>
  </div>
</AccessibleModal>
```

**Cambios**:
1. ✅ Reemplazado con `AccessibleModal` (focus trap incluido)
2. ✅ Title y description accesibles
3. ✅ Escape key automático
4. ✅ Focus restoration

---

## 📝 Ejemplo Práctico 4: Navegación Responsive

### ❌ ANTES (No responsive)
```tsx
<nav className="flex gap-4 p-4">
  {items.map(item => (
    <a href={item.href} className="text-blue-600">
      {item.label}
    </a>
  ))}
</nav>
```

**Problemas**:
- No se adapta a móvil
- Texto muy pequeño en móvil
- Sin hamburger menu

### ✅ DESPUÉS (Responsive)
```tsx
import { useResponsive } from '@/accessibility/components/ResponsiveProvider';

export function Navigation() {
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav aria-label="Navegación principal">
      {isMobile ? (
        // Mobile: Hamburger menu
        <div className="flex items-center justify-between p-4">
          <button 
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            {isOpen ? '✕' : '☰'}
          </button>
          
          {isOpen && (
            <div className="absolute top-16 left-0 right-0 bg-white shadow-lg z-50">
              {items.map(item => (
                <a 
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-blue-600 hover:bg-gray-50 border-b"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Desktop: Horizontal nav
        <div className="flex gap-6 p-4">
          {items.map(item => (
            <a 
              key={item.href}
              href={item.href}
              className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
```

**Cambios**:
1. ✅ `useResponsive` para detectar mobile/desktop
2. ✅ Hamburger menu en mobile
3. ✅ `aria-expanded` en botón
4. ✅ Mejor padding en mobile
5. ✅ Focus rings en links

---

## 📝 Ejemplo Práctico 5: Tabla Accesible

### ❌ ANTES (No accesible)
```tsx
<table>
  <tr>
    <td>Juan</td>
    <td>juan@email.com</td>
    <td>Activo</td>
  </tr>
</table>
```

**Problemas**:
- Sin headers
- Sin scope
- Estado solo por color

### ✅ DESPUÉS (Accesible)
```tsx
<div className="overflow-x-auto">
  <table className="w-full border-collapse" role="table" aria-label="Lista de usuarios">
    <thead>
      <tr className="bg-gray-100">
        <th scope="col" className="px-4 py-2 text-left font-semibold">Nombre</th>
        <th scope="col" className="px-4 py-2 text-left font-semibold">Email</th>
        <th scope="col" className="px-4 py-2 text-left font-semibold">Estado</th>
        <th scope="col" className="px-4 py-2">Acciones</th>
      </tr>
    </thead>
    <tbody>
      {users.map(user => (
        <tr key={user.id} className="border-b hover:bg-gray-50">
          <td className="px-4 py-2">{user.name}</td>
          <td className="px-4 py-2">{user.email}</td>
          <td className="px-4 py-2">
            {/* No solo color */}
            <span 
              className={user.active ? 'text-green-600' : 'text-gray-500'}
              aria-label={user.active ? 'Activo' : 'Inactivo'}
            >
              {user.active ? '✓ Activo' : '○ Inactivo'}
            </span>
          </td>
          <td className="px-4 py-2">
            <button 
              onClick={() => editUser(user.id)}
              aria-label={`Editar usuario ${user.name}`}
              className="text-blue-600 hover:underline"
            >
              Editar
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Cambios**:
1. ✅ Headers con `<th scope="col">`
2. ✅ `role="table"` + `aria-label`
3. ✅ Estado con icono + texto (no solo color)
4. ✅ `aria-label` descriptivos en botones

---

## 📋 Checklist de Implementación

### Para Cada Componente

- [ ] **ARIA Labels**
  - [ ] Botones icon-only tienen aria-label
  - [ ] Inputs tienen labels <label> o aria-label
  - [ ] Imágenes tienen alt text
  - [ ] Iconos de estado tienen aria-label

- [ ] **Navegación por Teclado**
  - [ ] Tab order es lógico
  - [ ] Focus rings visibles
  - [ ] Escape cierra dialogs/popovers
  - [ ] Enter/Space activan botones

- [ ] **Responsive**
  - [ ] Mobile < 768px
  - [ ] Tablet 768-1023px
  - [ ] Desktop >= 1024px
  - [ ] Touch targets >= 44x44px

- [ ] **Contraste**
  - [ ] Texto >= 4.5:1 (AA) / 7:1 (AAA)
  - [ ] Botones visibles en focus
  - [ ] No solo color para información

- [ ] **Screen Readers**
  - [ ] Roles ARIA correctos
  - [ ] Aria-live para cambios dinámicos
  - [ ] Aria-describedby para errores
  - [ ] Aria-invalid para validación

---

## 🚀 Checklist de Rollout

### Semana 1: Foundation
- [ ] ResponsiveProvider en AppShell
- [ ] SkipToMainContent agregado
- [ ] NavbarPro: aria-labels mejorads
- [ ] SidebarPro: navegación accesible

### Semana 2: Components
- [ ] Formularios accesibles
- [ ] Modales con AccessibleModal
- [ ] Tablas accesibles
- [ ] Dropdowns accesibles

### Semana 3: Testing
- [ ] Test automatizado (jest-axe)
- [ ] Testing con NVDA/VoiceOver
- [ ] Mobile testing (iPhone, iPad)
- [ ] Validación de contraste

### Semana 4: Validación
- [ ] Auditoría WCAG final
- [ ] Performance mobile
- [ ] Documentación usuario
- [ ] Go-live

---

## 📞 Ayuda Rápida

### ¿Cómo agregar aria-label a un botón?
```tsx
<button aria-label="Cerrar">✕</button>
```

### ¿Cómo hacer un input accesible?
```tsx
<label htmlFor="email">Email:</label>
<input id="email" type="email" />
```

### ¿Cómo hacer un componente responsive?
```tsx
import { useResponsive } from '@/accessibility';
const { isMobile } = useResponsive();
// Renderizar diferente según isMobile
```

### ¿Cómo verificar contraste?
```tsx
import { getContrastRatio } from '@/accessibility/utils/a11y-helpers';
const ratio = getContrastRatio('#000000', '#FFFFFF'); // 21:1 ✅
```

---

## 📚 Más Información

- Guía completa: `frontend/src/accessibility/README.md`
- Criterios WCAG: `frontend/src/accessibility/WCAG_GUIDE.md`
- Mobile responsive: `frontend/src/accessibility/RESPONSIVE_GUIDE.md`
- Ejemplos: `frontend/src/accessibility/components/examples.tsx`
- Auditoría: `frontend/src/accessibility/audit/audit-report.ts`

---

**¡Listo para empezar!** 🚀

Comienza con la Fase 1 en `ACCESSIBILITY_IMPLEMENTATION_PLAN.md`
