# 🔧 Guía de Integración en Componentes Existentes

## Integración en AppShell

### Paso 1: Agregar SkipToMainContent
```tsx
// src/app/components/AppShell.tsx
import { SkipToMainContent, ResponsiveProvider } from '@/accessibility';

export const AppShell: React.FC = () => {
  return (
    <ResponsiveProvider>
      <SkipToMainContent mainContentId="main-content" />
      
      <BrowserRouter>
        <I18nProvider>
          <LayoutProvider>
            {/* Resto del componente */}
          </LayoutProvider>
        </I18nProvider>
      </BrowserRouter>
    </ResponsiveProvider>
  );
};
```

### Paso 2: Agregar id a main content
```tsx
<main id="main-content" tabIndex={-1}>
  {/* Contenido principal */}
</main>
```

## Integración en NavbarPro

### Mejorar aria-labels en botones
```tsx
// ❌ ANTES
<button onClick={toggleSidebar}>
  <MenuIcon />
</button>

// ✅ DESPUÉS
<button 
  onClick={toggleSidebar}
  aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
  aria-expanded={sidebarOpen}
>
  <MenuIcon />
</button>

// ✅ Para bell de notificaciones
<button
  aria-label={`${notificationCount} notificaciones nuevas`}
  aria-pressed={showNotifications}
>
  <BellIcon />
  {notificationCount > 0 && (
    <span className="sr-only">({notificationCount})</span>
  )}
</button>

// ✅ Para perfil
<button
  aria-label="Perfil de usuario"
  aria-haspopup="menu"
  aria-expanded={showProfile}
>
  <UserIcon />
</button>
```

## Integración en SidebarPro

### Mejorar navegación accesible
```tsx
import { useResponsive } from '@/accessibility';
import { handleArrowKeyNavigation } from '@/accessibility/utils/a11y-helpers';

export const SidebarPro: React.FC = () => {
  const { isMobile } = useResponsive();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = menuRef.current?.querySelectorAll('[role="menuitem"]') || [];
    const itemsArray = Array.from(items) as HTMLElement[];
    
    const newIndex = handleArrowKeyNavigation(
      e as any,
      itemsArray,
      selectedIndex,
      'vertical'
    );
    setSelectedIndex(newIndex);
  };

  return (
    <aside
      ref={menuRef}
      role="navigation"
      aria-label="Navegación principal"
      onKeyDown={handleKeyDown}
      className={`sidebar ${isMobile ? 'mobile' : 'desktop'}`}
    >
      {/* Items del menú con role="menuitem" */}
    </aside>
  );
};
```

## Integración en Formularios

### Template para inputs accesibles
```tsx
interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  error,
  required,
}) => {
  const inputId = useAriaId('input');
  const errorId = useAriaId('error');

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500" aria-label="requerido">*</span>}
      </label>
      
      <input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
```

## Integración en Modales

### Reemplazar modales existentes
```tsx
// ❌ ANTES
import { Dialog } from '@mui/material';

// ✅ DESPUÉS
import { AccessibleModal } from '@/accessibility';

export const MyModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Abrir</button>
      
      <AccessibleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirmar acción"
        description="¿Deseas continuar? Esta acción no puede deshacerse."
      >
        <p>Contenido del modal</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setIsOpen(false)}>Cancelar</button>
          <button onClick={handleConfirm}>Confirmar</button>
        </div>
      </AccessibleModal>
    </>
  );
};
```

## Integración en Tablas

### Hacer tablas accesibles
```tsx
import { AccessibleTabs } from '@/accessibility';

export const DataTable: React.FC = () => {
  return (
    <div className="overflow-x-auto">
      <table
        role="table"
        aria-label="Datos de usuarios"
        className="w-full"
      >
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Email</th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.email}</td>
              <td>
                <span 
                  className="px-2 py-1 rounded"
                  className={row.active ? 'bg-green-100' : 'bg-gray-100'}
                >
                  {/* No usar solo color */}
                  <span aria-label={`Estado: ${row.active ? 'activo' : 'inactivo'}`}>
                    {row.active ? '✓ Activo' : '○ Inactivo'}
                  </span>
                </span>
              </td>
              <td>
                <button aria-label={`Editar usuario ${row.name}`}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

## Integración con Preferencias del Usuario

### Respetar preferencias de usuario
```tsx
import { useReducedMotion, useColorScheme, useHighContrast } from '@/accessibility';

export const AnimatedComponent: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const colorScheme = useColorScheme();
  const prefersContrast = useHighContrast();

  return (
    <div
      className={`transition ${prefersReduced ? 'duration-0' : 'duration-300'}`}
      style={{
        color: prefersContrast ? '#000000' : '#333333',
        backgroundColor: colorScheme === 'dark' ? '#1f1f1f' : '#ffffff',
      }}
    >
      Contenido
    </div>
  );
};
```

## Integración con Notificaciones

### Anunciar mensajes a lectores de pantalla
```tsx
import { useAnnouncement } from '@/accessibility';

export const FormWithNotification: React.FC = () => {
  const announce = useAnnouncement();

  const handleSubmit = async () => {
    try {
      await saveData();
      announce('Datos guardados exitosamente', 'polite');
    } catch (error) {
      announce('Error al guardar: ' + error.message, 'assertive');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

## Responsive Design - Integración en Componentes

### SidebarPro responsive
```tsx
import { useResponsive } from '@/accessibility';

export const SidebarPro: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div className={`
      ${isMobile ? 'drawer drawer-mobile' : 'sidebar-fixed'}
      ${isTablet ? 'w-60' : 'w-80'}
    `}>
      {/* Contenido adaptado */}
    </div>
  );
};
```

## Plan de Rollout

### Semana 1
- [x] Crear módulo de accesibilidad
- [ ] Integrar SkipToMainContent en AppShell
- [ ] Mejorar aria-labels en NavbarPro

### Semana 2
- [ ] Mejorar formularios (FormInput accesible)
- [ ] Reemplazar modales con AccessibleModal
- [ ] Agregar ResponsiveProvider

### Semana 3
- [ ] Tablas accesibles
- [ ] Preferencias de usuario (reduced motion, high contrast)
- [ ] Testing con screen readers

### Semana 4
- [ ] Validación de accesibilidad
- [ ] Documentación para usuarios
- [ ] Auditoría final WCAG 2.1

## Testing durante Integración

```tsx
import { testA11y, testKeyboardNavigation } from '@/accessibility/tests/a11y-test-utils';

describe('MyComponent Accessibility', () => {
  it('should be WCAG 2.1 Level AA compliant', async () => {
    await testA11y(<MyComponent />);
  });

  it('should support keyboard navigation', () => {
    testKeyboardNavigation(
      <MyComponent />,
      ['button-1', 'button-2', 'input']
    );
  });
});
```
