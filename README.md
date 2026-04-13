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