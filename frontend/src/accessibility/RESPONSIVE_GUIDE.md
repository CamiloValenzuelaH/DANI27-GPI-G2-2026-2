# 📱 Guía de Mobile Responsive Design

## Principios de Responsive Design

### 1. Mobile First
Diseña primero para mobile, luego expande a tablets y desktop.

```tsx
// ❌ EVITAR: Desktop first
const className = isDesktop ? 'w-full p-8' : 'w-auto p-2';

// ✅ HACER: Mobile first
const className = 'w-full p-2 md:p-4 lg:p-8';
```

### 2. Breakpoints
Usa los breakpoints estándar de Tailwind:
- `mobile`: < 768px
- `md`: 768px - 1023px (tablet)
- `lg`: 1024px+ (desktop)

## Patrones Comunes

### Navigation Responsive
```tsx
import { useResponsive } from '@/accessibility/components/ResponsiveProvider';

export function NavBar() {
  const { isMobile } = useResponsive();

  return (
    <nav className="bg-white shadow">
      {isMobile ? (
        <MobileNav />
      ) : (
        <DesktopNav />
      )}
    </nav>
  );
}
```

### Grid Responsive
```tsx
// En Tailwind CSS
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

### Touch Targets
En mobile, asegurar mínimo 44x44 pixels:

```tsx
// ❌ Muy pequeño para mobile
<button className="p-1">Acción</button>

// ✅ Adaptado para touch
<button className="p-2 md:p-1">Acción</button>
```

### Viewport Meta Tag
Ya debe estar en `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

## Testing de Responsive Design

### Breakpoints a Probar
- iPhone SE (375px)
- iPhone 12/13 (390px)
- iPad Mini (768px)
- iPad Pro (1024px)
- Desktop (1920px+)

### Tools
- Chrome DevTools Device Emulation
- Responsive Design Mode (Firefox)
- Actual devices

## Mejores Prácticas

1. **Flexibilidad de Layout**
   - Usar flexbox y grid
   - Evitar widths fijos
   - Usar max-width donde sea apropiado

2. **Imágenes Responsivas**
   ```tsx
   <img 
     src="image.jpg"
     srcSet="image-sm.jpg 480w, image-md.jpg 768w, image-lg.jpg 1024w"
     className="w-full h-auto"
   />
   ```

3. **Tipografía Flexible**
   - Usar em/rem en lugar de px
   - Escalar tamaños según viewport

4. **Performance en Mobile**
   - Lazy loading de imágenes
   - Code splitting
   - Minimizar bundles

## Debugging
```tsx
// Mostrar breakpoint actual (solo desarrollo)
<div className="fixed top-4 right-4 text-xs bg-black text-white p-2 z-50">
  <span className="md:hidden">mobile</span>
  <span className="hidden md:inline lg:hidden">tablet</span>
  <span className="hidden lg:inline">desktop</span>
</div>
```
