<<<<<<< HEAD
Assessment ISO‑27001 — Feature

Archivos añadidos:
- `frontend/src/data/example-data.json` — datos de ejemplo (2 fases)
- `frontend/src/app/components/assessment/*` — componentes principales
- `frontend/src/app/hooks/useAutosave.ts` — hook de debounce para autosave
- `frontend/src/app/lib/storage.ts` — persistencia local (localForage fallback)

Instalación y ejecución (desde `frontend`):

```bash
pnpm install
pnpm dev
```

Notas:
- Esta implementación usa `localStorage` por defecto. Instala `localforage` si quieres usar IndexedDB:

```bash
pnpm add localforage
```

- Componente principal: `AssessmentPage` (puedes importarlo en tu `App.tsx`).
- Autosave: guarda automáticamente 2s después de la última interacción.
=======
Assessment ISO‑27001 — Feature

Archivos añadidos:
- `frontend/src/data/example-data.json` — datos de ejemplo (2 fases)
- `frontend/src/app/components/assessment/*` — componentes principales
- `frontend/src/app/hooks/useAutosave.ts` — hook de debounce para autosave
- `frontend/src/app/lib/storage.ts` — persistencia local (localForage fallback)

Instalación y ejecución (desde `frontend`):

```bash
pnpm install
pnpm dev
```

Notas:
- Esta implementación usa `localStorage` por defecto. Instala `localforage` si quieres usar IndexedDB:

```bash
pnpm add localforage
```

- Componente principal: `AssessmentPage` (puedes importarlo en tu `App.tsx`).
- Autosave: guarda automáticamente 2s después de la última interacción.
>>>>>>> Chat-bot
