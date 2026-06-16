# 📦 Dependencias Requeridas para Accesibilidad

## Actualizar package.json

Agrega estas dependencias al `package.json` de tu proyecto:

```json
{
  "devDependencies": {
    "jest-axe": "^8.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "axe-core": "^4.7.2"
  }
}
```

## Instalación

```bash
# Con npm
npm install jest-axe @testing-library/jest-dom axe-core --save-dev

# Con pnpm
pnpm add -D jest-axe @testing-library/jest-dom axe-core

# Con yarn
yarn add -D jest-axe @testing-library/jest-dom axe-core
```

## Configuración de Jest/Vitest

En `jest.setup.ts` o `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
```

## Herramientas Externas Recomendadas

### Para Testing Manual

1. **axe DevTools** (Chrome/Edge)
   - https://www.deque.com/axe/devtools/
   - Escaneo automático de WCAG en DevTools

2. **WAVE** (Firefox/Chrome)
   - https://wave.webaim.org/extension/
   - Evaluación visual de accesibilidad

3. **Lighthouse** (Built-in)
   - Chrome DevTools → Lighthouse
   - Auditoría de accesibilidad y performance

### Para Screen Readers

1. **NVDA** (Windows) - Gratuito
   - https://www.nvaccess.org/

2. **VoiceOver** (Mac/iOS) - Built-in
   - Cmd + F5

3. **JAWS** (Windows) - Profesional
   - https://www.freedomscientific.com/products/software/jaws/

## Verificar Instalación

```bash
# Verificar que las herramientas están disponibles
npm list jest-axe @testing-library/jest-dom axe-core
```

## Tareas Recomendadas en package.json

Agrega scripts útiles:

```json
{
  "scripts": {
    "test:a11y": "jest --testPathPattern=a11y",
    "audit:a11y": "axe https://localhost:3000",
    "dev": "vite",
    "build": "vite build",
    "test": "jest"
  }
}
```

## Validadores Online

- https://www.w3.org/WAI/test-evaluate/
- https://wave.webaim.org/
- https://www.deque.com/axe/

## Referencia Rápida de Versiones

```
jest-axe: ^8.0.0
axe-core: ^4.7.2
@testing-library/jest-dom: ^6.1.0
```

Todas las herramientas ya están incluidas en `src/accessibility/` módulo.
No necesitas descargas externas adicionales.
