<<<<<<< HEAD
# Arquitectura Frontend - Plataforma DANI (ISO 27001)

Este proyecto utiliza una arquitectura modular basada en **Feature-Sliced Design (FSD)**.

## 📁 Árbol de Carpetas (Boilerplate)

\`\`\`text
src/
├── assets/        # Recursos estáticos globales
├── components/    # Componentes UI puros y reutilizables 
├── features/      # Módulos de negocio aislados:
│   ├── auth/            # Lógica de login
│   ├── audit-room/      # Vista de auditor
│   ├── dashboard/       # Métricas generales
│   ├── evidence-center/ # Carga masiva
│   └── risk-map/        # Matriz térmica
├── hooks/         # Custom Hooks globales
├── i18n/          # Diccionarios de internacionalización (ES, EN, FR)
├── layouts/       # Estructuras de página
├── pages/         # Componentes de enrutamiento principal
├── services/      # Configuración de API
├── store/         # Estados globales
└── utils/         # Funciones puras de ayuda
\`\`\`

## 🧩 Lógica de Checklist de Auditoría

La vista de auditoría implementa una autoevaluación interactiva con persistencia real en backend.

- La interfaz carga el checklist con `GET /audit/checklist`.
- Cada cambio en estado o notas marca el checklist como modificado.
- El auto-guardado se ejecuta con debounce y persiste los cambios con `PUT /audit/checklist`.
- También existe un guardado manual con el botón `Guardar ahora`.
- La persistencia se hace por organización en la tabla `audit_checklists`.
- Si todavía no existe un registro, el backend devuelve el checklist por defecto.

Esto permite validar el avance de la autoevaluación sin perder cambios al recargar la página.

## 📤 Validación de Archivos con Agente

En la pantalla de Auditoría hay una sección dedicada para subir archivos y validarlos con el agente:

- Ubicación: Panel principal, debajo del título "Auditoría de Cumplimiento"
- Formatos soportados: PDF, Word (.doc, .docx), Excel (.xlsx, .xls), Texto (.txt), Imágenes (.jpg, .png)
- Tamaño máximo: 10MB por archivo
- El agente analiza la calidad de evidencia buscando: fechas, responsables, firmas, verificaciones
- Devuelve un score de cumplimiento (0-100%) con estado (Conforme, Revisar, No Conforme)
- Muestra hallazgos específicos con severidad y recomendaciones
- Endpoint backend: `POST /audit/validate-file` con multipart form-data
 
 ***14-05-2026 CHECK***
=======
# Arquitectura Frontend - Plataforma DANI (ISO 27001)

Este proyecto utiliza una arquitectura modular basada en **Feature-Sliced Design (FSD)**.

## 📁 Árbol de Carpetas (Boilerplate)

\`\`\`text
src/
├── assets/        # Recursos estáticos globales
├── components/    # Componentes UI puros y reutilizables 
├── features/      # Módulos de negocio aislados:
│   ├── auth/            # Lógica de login
│   ├── audit-room/      # Vista de auditor
│   ├── dashboard/       # Métricas generales
│   ├── evidence-center/ # Carga masiva
│   └── risk-map/        # Matriz térmica
├── hooks/         # Custom Hooks globales
├── i18n/          # Diccionarios de internacionalización (ES, EN, FR)
├── layouts/       # Estructuras de página
├── pages/         # Componentes de enrutamiento principal
├── services/      # Configuración de API
├── store/         # Estados globales
└── utils/         # Funciones puras de ayuda
\`\`\`

## 🧩 Lógica de Checklist de Auditoría

La vista de auditoría implementa una autoevaluación interactiva con persistencia real en backend.

- La interfaz carga el checklist con `GET /audit/checklist`.
- Cada cambio en estado o notas marca el checklist como modificado.
- El auto-guardado se ejecuta con debounce y persiste los cambios con `PUT /audit/checklist`.
- También existe un guardado manual con el botón `Guardar ahora`.
- La persistencia se hace por organización en la tabla `audit_checklists`.
- Si todavía no existe un registro, el backend devuelve el checklist por defecto.

Esto permite validar el avance de la autoevaluación sin perder cambios al recargar la página.

## 📤 Validación de Archivos con Agente

En la pantalla de Auditoría hay una sección dedicada para subir archivos y validarlos con el agente:

- Ubicación: Panel principal, debajo del título "Auditoría de Cumplimiento"
- Formatos soportados: PDF, Word (.doc, .docx), Excel (.xlsx, .xls), Texto (.txt), Imágenes (.jpg, .png)
- Tamaño máximo: 10MB por archivo
- El agente analiza la calidad de evidencia buscando: fechas, responsables, firmas, verificaciones
- Devuelve un score de cumplimiento (0-100%) con estado (Conforme, Revisar, No Conforme)
- Muestra hallazgos específicos con severidad y recomendaciones
- Endpoint backend: `POST /audit/validate-file` con multipart form-data
 
>>>>>>> Chat-bot
