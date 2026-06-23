# ♿ Guía de Accesibilidad WCAG 2.1

## Criterios Críticos

### 1. Navegación por Teclado (WCAG 2.1.1)
Todos los elementos interactivos deben ser accesibles via teclado.

```tsx
// ✅ CORRECTO: Input con label accesible
<label htmlFor="email">Email:</label>
<input 
  id="email"
  type="email"
  aria-label="Correo electrónico"
/>

// ✅ CORRECTO: Botón con aria-label descriptivo
<button 
  aria-label="Cerrar diálogo"
  onClick={onClose}
>
  ✕
</button>

// ❌ EVITAR: Sin label accesible
<input type="email" />
<button onClick={onClose}>X</button>
```

### 2. Focus Visible (WCAG 2.4.7)
El foco debe ser siempre visible.

```tsx
// ✅ CORRECTO: Focus ring visible
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500">
  Acción
</button>

// ❌ EVITAR: Sin focus visible
<button style={{ outline: 'none' }}>Acción</button>
```

### 3. Contraste de Color (WCAG 1.4.3)
Mínimo 4.5:1 para texto normal, 3:1 para texto grande (18pt+).

```tsx
// Usar helper para verificar
import { getContrastRatio } from '@/accessibility/utils/a11y-helpers';

const ratio = getContrastRatio('#333333', '#FFFFFF'); // 10.5:1 ✅ AAA
```

### 4. Etiquetas de Formularios (WCAG 1.3.1)
Todos los inputs deben tener etiquetas asociadas.

```tsx
// ✅ CORRECTO: Label explícito
<label htmlFor="name">Nombre:</label>
<input id="name" />

// ✅ CORRECTO: aria-label implícito
<input 
  type="search"
  aria-label="Buscar"
/>

// ✅ CORRECTO: aria-describedby para errores
<input 
  id="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
<span id="email-error" role="alert">
  Email inválido
</span>
```

### 5. Navegación (WCAG 2.4.1, 2.4.2)
Agregar skip link y estructura de headings coherente.

```tsx
import { SkipToMainContent } from '@/accessibility/components/SkipToMainContent';

export function Layout() {
  return (
    <>
      <SkipToMainContent />
      <header>...</header>
      <main id="main-content" tabIndex={-1}>
        Contenido principal
      </main>
      <footer>...</footer>
    </>
  );
}

// ✅ Estructura de headings correcta
<h1>Título Principal</h1>
<h2>Sección 1</h2>
<h3>Subsección 1.1</h3>
<h2>Sección 2</h2>

// ❌ EVITAR: Headings desordenados
<h1>Título</h1>
<h4>Sección</h4>
```

### 6. Imágenes (WCAG 1.1.1)
Todas las imágenes deben tener alt text descriptivo.

```tsx
// ✅ CORRECTO: Alt text descriptivo
<img 
  src="dashboard.png"
  alt="Dashboard mostrando gráficos de uso semanal"
/>

// ✅ CORRECTO: Imagen decorativa
<img 
  src="decoration.png"
  alt=""
  role="presentation"
/>

// ❌ EVITAR: Alt genérico
<img src="chart.png" alt="Imagen" />
```

### 7. Uso de Color (WCAG 1.4.1)
No conveys información únicamente por color.

```tsx
// ❌ EVITAR: Solo rojo para error
<input 
  style={{ borderColor: 'red' }}
/>

// ✅ CORRECTO: Ícono + color + texto
<div className="flex items-center gap-2 text-red-600">
  <AlertIcon />
  <span>Error: Campo requerido</span>
</div>
```

## ARIA (Accessible Rich Internet Applications)

### Roles
```tsx
// Navegación
<nav role="navigation">...</nav>

// Alerta
<div role="alert">Error importante</div>

// Estatus
<div role="status" aria-live="polite">Guardando...</div>

// Búsqueda
<form role="search">...</form>
```

### Propiedades
```tsx
// aria-label: Etiqueta para elementos sin texto visible
<button aria-label="Cerrar">×</button>

// aria-labelledby: Referencia a elemento que etiqueta
<h2 id="dialog-title">Confirmar</h2>
<div aria-labelledby="dialog-title">...</div>

// aria-describedby: Descripción adicional
<input aria-describedby="password-hint" />
<p id="password-hint">Mínimo 8 caracteres</p>

// aria-expanded: Estado expandido
<button aria-expanded={isOpen} onClick={toggleMenu}>
  Menú
</button>

// aria-disabled: Elemento deshabilitado
<button aria-disabled={isDisabled}>Acción</button>

// aria-invalid: Campo inválido
<input aria-invalid={hasError} />

// aria-live: Región dinámica
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>
```

## Screen Reader Testing

### NVDA (Windows)
- Gratuito
- Descargar: https://www.nvaccess.org/

### JAWS (Windows/Mac)
- Profesional
- Prueba disponible (40 minutos)

### VoiceOver (Mac/iOS)
- Built-in
- Cmd + F5 para activar

### Testing Básico
1. Navegar solo con teclado (Tab, Enter, Arrow keys)
2. Activar screen reader
3. Verificar que todo se anuncie correctamente
4. Probar con diferentes velocidades de lectura

## Checklist Rápido

- [ ] Navegación completa con teclado (Tab, Enter, Escape)
- [ ] Focus ring visible en todo
- [ ] Contraste >= 4.5:1 (AA) o 7:1 (AAA)
- [ ] Todos los inputs tienen labels
- [ ] Headings en orden correcto
- [ ] Imágenes tienen alt text
- [ ] Colores no son única forma de información
- [ ] Modales usan focus trap
- [ ] Status messages son anunciados
- [ ] Touch targets >= 44x44px

## Recursos

- [WCAG 2.1 Checklist](https://www.w3.org/WAI/test-evaluate/preliminary/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [Deque University](https://dequeuniversity.com/)

## Ejemplos en el Proyecto

Ver componentes accesibles:
- `AccessibleModal` - Manejo de focus
- `AccessibleDropdown` - Navegación por teclado
- `AccessibleTabs` - ARIA roles corretos
- `SkipToMainContent` - Bypass blocks
