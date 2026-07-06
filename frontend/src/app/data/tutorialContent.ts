// Estructura de datos para tutoriales
// Este archivo define el contenido detallado de cada tutorial

import type { IntlShape } from 'react-intl';

export type TutorialType = 'main' | 'settings';

export interface TutorialStep {
  id: string;
  path: string;
  icon: string;
  title: string;
  description: string;
  sections: TutorialSection[];
  nextPath?: string;
}

export interface TutorialSection {
  id: string;
  title: string;
  content: string;
  highlights?: string[]; // Selectores CSS de elementos a destacar
  tooltip?: string;
  action?: string; // Acción que user debe tomar
}

const legacyTutorialStepById: Record<string, number> = {
  dashboard: 1,
  understand: 2,
  assets: 3,
  documents: 4,
  risks: 5,
  evidence: 6,
  findings: 7,
  audit: 5,
  'self-assessment': 6,
};

function tutorialMessageId(stepId: string, sectionId: string | null, field: 'title' | 'description' | 'content' | 'action' | 'tooltip') {
  if (sectionId) {
    return `tutorial.steps.${stepId}.sections.${sectionId}.${field}`;
  }
  return `tutorial.steps.${stepId}.${field}`;
}

export function getLocalizedTutorials(intl: IntlShape): TutorialStep[] {
  const isSpanish = intl.locale.toLowerCase().startsWith('es');

  const formatWithFallback = (
    id: string,
    defaultMessage: string,
    legacyId?: string,
    legacyDefault?: string,
    useLegacyFallback = true,
  ) => {
    const localized = intl.formatMessage({ id, defaultMessage });
    if (isSpanish || localized !== defaultMessage || !legacyId || !useLegacyFallback) {
      return localized;
    }
    return intl.formatMessage({ id: legacyId, defaultMessage: legacyDefault ?? defaultMessage });
  };

  return mainTutorials.map((step) => ({
    ...step,
    title: formatWithFallback(
      tutorialMessageId(step.id, null, 'title'),
      step.title,
      legacyTutorialStepById[step.id] ? `tutorial.step${legacyTutorialStepById[step.id]}.title` : undefined,
      step.title,
    ),
    description: formatWithFallback(
      tutorialMessageId(step.id, null, 'description'),
      step.description,
      legacyTutorialStepById[step.id] ? `tutorial.step${legacyTutorialStepById[step.id]}.description` : undefined,
      step.description,
    ),
    sections: step.sections.map((section) => ({
      ...section,
      title: formatWithFallback(
        tutorialMessageId(step.id, section.id, 'title'),
        section.title,
        legacyTutorialStepById[step.id] ? `tutorial.step${legacyTutorialStepById[step.id]}.title` : undefined,
        section.title,
        false,
      ),
      content: formatWithFallback(
        tutorialMessageId(step.id, section.id, 'content'),
        section.content,
        legacyTutorialStepById[step.id] ? `tutorial.step${legacyTutorialStepById[step.id]}.description` : undefined,
        section.content,
        false,
      ),
      tooltip: section.tooltip
        ? formatWithFallback(
            tutorialMessageId(step.id, section.id, 'tooltip'),
            section.tooltip,
            legacyTutorialStepById[step.id] ? `tutorial.step${legacyTutorialStepById[step.id]}.description` : undefined,
            section.tooltip,
            false,
          )
        : undefined,
      action: section.action
        ? formatWithFallback(
            tutorialMessageId(step.id, section.id, 'action'),
            section.action,
            'tutorial.routeHint',
            section.action,
            false,
          )
        : undefined,
    })),
  }));
}

// FLUJO PRINCIPAL - 7 PASOS
export const mainTutorials: TutorialStep[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    icon: '1️⃣',
    title: 'Panel de Control',
    description: 'Revisa el estado general de cumplimiento, alertas y progresos clave desde tu panel principal.',
    sections: [
      {
        id: 'intro',
    title: 'Qué verás aquí',
    content: `Este dashboard resume el estado actual de tu programa:
  - KPIs de documentación, implementación y efectividad
  - Score de salud y tendencia
  - Actividad reciente
  - Tareas próximas por vencer

  Es un panel de lectura rápida para priorizar, no un módulo de edición masiva.`,
    action: 'Recorre visualmente el panel principal'
      },
      {
    id: 'kpis',
    title: 'KPIs y score',
    content: `Las tarjetas muestran porcentajes actuales y variación reciente.

  Úsalo para detectar si vas mejorando o retrocediendo. En esta versión, estas tarjetas son informativas y no abren un detalle al hacer clic.`,
    action: 'Revisa valores y variaciones de las tarjetas'
      },
      {
    id: 'activity-tasks',
    title: 'Actividad y próximos pendientes',
    content: `Abajo verás dos bloques útiles:
  - Actividad reciente: cambios que ocurrieron en el sistema
  - Próximas tareas: items con prioridad/fecha para seguimiento

  Esto te ayuda a decidir qué atender primero cada día.`,
    action: 'Compara actividad reciente con tareas próximas'
      },
      {
    id: 'scope',
    title: 'Alcance real de este paso',
    content: `Lo que sí hace:
  - Mostrar estado agregado y tendencia
  - Mostrar actividad y tareas sugeridas

  Recomendación de uso:
  - Úsalo para priorizar en minutos qué atender primero
  - Luego profundiza en cada módulo para ejecutar acciones`,
    action: 'Ten claro que este paso es de monitoreo'
      },
      {
        id: 'conclusion',
    title: 'Siguiente paso',
    content: `Cuando detectes prioridades en el dashboard, pasa al análisis de brechas para entender por qué estás en ese estado y qué corregir primero.`,
        action: 'Haz clic en Siguiente para Gap Analysis'
      }
    ],
    nextPath: '/understand'
  },

  {
    id: 'understand',
    path: '/understand',
    icon: '2️⃣',
    title: 'Análisis de Brechas',
    description: 'Identifica exactamente qué brechas tienes entre tu estado actual y los requerimientos de compliance.',
    sections: [
      {
        id: 'intro',
        title: 'Análisis de Brechas (Gap Analysis)',
        content: `Estamos en la sección más importante: Gap Analysis.

Aquí vamos a:
1. Responder preguntas sobre tu organización
2. El sistema analiza tus respuestas
3. Te mostramos EXACTAMENTE qué te falta
4. Te damos un plan para cerrar brechas

Este es el corazón del compliance. Tómate tiempo aquí.`,
        action: 'Lee esta introducción'
      },
      {
        id: 'framework',
        title: '¿Qué Normativa Debes Cumplir?',
        content: `Puedes trabajar con uno o varios marcos:
- ISO 27001 (Seguridad de Información)
- ISO 27002 (Controles de Seguridad)
- GDPR (Protección de Datos - Europa)
- HIPAA (Salud - USA)
- NIST (Seguridad Nacional - USA)
- SOC 2 (Auditoría de Servicios)

Selecciona el que aplique a tu negocio.
Consejo: Muchas orgs usan ISO 27001 como base.`,
        highlights: ['.framework-selector', '.iso-options'],
        action: 'Selecciona el framework normativo que aplique'
      },
      {
        id: 'questionnaire',
        title: 'Responde Honestamente',
        content: `Verás preguntas como:
'¿Tienes una política de seguridad documentada?'
'¿Realizas capacitación anual en security?'
'¿Tienes un plan de incident response?'

Responde SÍ/NO/PARCIALMENTE (esto es confidencial)

No hay respuestas 'correctas'. La verdad es mejor.
Basado en esto, calcularemos tus brechas.`,
        highlights: ['.questionnaire-form', '.question-item'],
        action: 'Comienza a responder las preguntas'
      },
      {
        id: 'analysis',
        title: 'El Sistema Analiza...',
        content: `Déjanos un momento para procesar tus respuestas.

Estamos:
✓ Comparando tu estado con normas
✓ Calculando % de cumplimiento
✓ Priorizando brechas por riesgo
✓ Recomendando acciones

Esto puede tomar 10-30 segundos...`,
        action: 'Espera mientras procesamos el análisis'
      },
      {
        id: 'results',
        title: 'Aquí Están tus Brechas',
        content: `Ves 3 cosas:

1. BRECHA CRÍTICA (Rojo)
   - Impacto alto si no lo cierras
   - Debes hacer esto PRIMERO
   
2. BRECHA MAYOR (Naranja)
   - Importante pero no urgente
   - Planifica en próximos meses

3. BRECHA MENOR (Amarillo)
   - Impacto bajo
   - Útil tener pero no crítico

El % de cumplimiento está arriba.
Si es <70%, hay trabajo por hacer.`,
        highlights: ['.gaps-list', '.gap-item', '.compliance-score'],
        action: 'Examina tus brechas y su prioridad'
      },
      {
        id: 'action-plan',
        title: 'Crea tu Plan de Cierre',
        content: `Para cada brecha:
1. Haz clic en ella
2. Asigna un responsable
3. Establece una fecha límite
4. Describe qué harás para cerrarla

El sistema rastrea tu progreso.
Cada brecha cerrada = % cumplimiento sube

Ejemplo: 
"Brecha: 'No tenemos MFA habilitado'
Responsable: Juan Pérez (CISO)
Plazo: 30 de Marzo
Acción: Implementar Okta MFA en todos los accesos"`,
        highlights: ['.gap-action-plan', '.create-plan-btn'],
        action: 'Crea un plan de acción para una brecha'
      },
      {
        id: 'conclusion',
        title: '¡Análisis Completo!',
        content: `Felicitaciones, ya SABES qué te falta.

El resto es implementación:
- Paso 3: Documenta tus ACTIVOS (qué proteges)
- Paso 4: Sube políticas y DOCUMENTOS
- Paso 5: Identifica RIESGOS específicos
- Paso 6: Recopila EVIDENCIA de cumplimiento
- Paso 7: Compila HALLAZGOS para auditoría

Sigamos. Próximo: Assets (Inventario)`,
        action: 'Haz clic en Siguiente para continuar'
      }
    ],
    nextPath: '/assets'
  },

  {
    id: 'assets',
    path: '/assets',
    icon: '3️⃣',
    title: 'Inventario de Activos',
    description: 'Documenta todos tus activos (sistemas, datos, personas) que necesitan protección.',
    sections: [
      {
        id: 'intro',
        title: 'Qué hace este módulo',
        content: `Aquí registras activos de forma estructurada para tu gestión de riesgos.

Puedes crear, editar y eliminar activos, y clasificarlos por tipo y por impacto C-I-A (confidencialidad, integridad y disponibilidad).`,
        action: 'Revisa la tabla y el botón + New asset'
      },
      {
        id: 'create',
        title: 'Crear y clasificar',
        content: `Al crear un activo, defines nombre, tipo, ubicación y puntajes C-I-A.

Con esos valores, el sistema calcula criticidad para ayudarte a priorizar.`,
        action: 'Crea un activo y completa C-I-A'
      },
      {
        id: 'filters',
        title: 'Filtrar y revisar',
        content: `Puedes filtrar por tipo y por nivel de criticidad para revisar rápidamente qué activos requieren más atención.

También puedes abrir un activo existente para editar sus datos o eliminarlo.`,
        action: 'Prueba los filtros por tipo y nivel'
      },
      {
        id: 'scope',
        title: 'Enfoque del módulo',
        content: `El objetivo de este paso es mantener un inventario claro y accionable.

      Cuando los activos están bien clasificados y priorizados, el análisis de riesgos y la ejecución de controles se vuelven mucho más rápidos.`,
        action: 'Úsalo como inventario y clasificación de activos'
      },
      {
        id: 'conclusion',
        title: 'Siguiente paso',
        content: `Con el inventario base listo, el siguiente paso es centralizar documentos para soportar evidencia y reportes.`,
        action: 'Haz clic en Siguiente'
      }
    ],
    nextPath: '/documents'
  },

  {
    id: 'documents',
    path: '/documents',
    icon: '4️⃣',
    title: 'Gestión de Documentos',
    description: 'Compila, organiza y versionea todas tus políticas y procedimientos.',
    sections: [
      {
        id: 'intro',
        title: 'Qué hace este módulo',
        content: `Este módulo concentra trabajo documental en cinco pestañas:
- Ver documentos
- Editar contenido
- Generar documento con IA
- Exportar reporte
- Subir documento`,
        action: 'Identifica las pestañas disponibles'
      },
      {
        id: 'upload',
        title: 'Carga y consulta',
        content: `Puedes subir archivos o contenido textual, listarlos y abrir uno para verlo/editarlo.

También puedes eliminar documentos cargados cuando corresponda.`,
        action: 'Sube un documento y ábrelo desde la lista'
      },
      {
        id: 'ai-generation',
        title: 'Generación con IA',
        content: `La pestaña de generación permite crear borradores de documentos y luego subirlos al repositorio.

Es útil para arrancar rápido una política o procedimiento base.`,
        action: 'Prueba generar un borrador y revisarlo'
      },
      {
        id: 'reports',
        title: 'Exportación de reportes',
        content: `Desde la pestaña de reportes puedes lanzar una generación, ver su estado y descargar el resultado cuando esté listo.

La disponibilidad de formatos depende de configuración/API, pero el flujo de generación y descarga sí está implementado.`,
        action: 'Genera un reporte y revisa su estado'
      },
      {
        id: 'conclusion',
        title: 'Cierre del paso',
        content: `Con este flujo ya puedes centralizar documentos clave, iterarlos y generar reportes de soporte para tu proceso de compliance.

      El siguiente paso es conectar estos insumos con la gestión de riesgos.`,
        action: 'Haz clic en Siguiente'
      }
    ],
    nextPath: '/risks'
  },

  {
    id: 'risks',
    path: '/risks',
    icon: '5️⃣',
    title: 'Gestión de Riesgos',
    description: 'Identifica, evalúa y mitiga riesgos de compliance con una metodología estructurada.',
    sections: [
      {
        id: 'intro',
        title: 'Análisis de Riesgos',
        content: `Riesgo es la probabilidad de que algo malo suceda.

Risk Management responde:
1. ¿QUÉ podría salir mal?
2. ¿QUÉ TAN PROBABLE es?
3. ¿QUÉ TAN GRAVE sería?
4. ¿QUÉ HACEMOS al respecto?

Esto es lo que auditorios MÁS validan.
Hazlo bien.`,
        action: 'Comprende el análisis de riesgos'
      },
      {
        id: 'matrix',
        title: 'Cómo Medimos Riesgo',
        content: `RIESGO = PROBABILIDAD × IMPACTO

         PROBABILIDAD
         Baja  Media  Alta
IM  Alta  3     6     9
PA  Media 2     4     6  
CT Baja  1     2     3

Colores:
- Rojo (9): CRÍTICO - Actúa YA
- Naranja (6): ALTO - Próximas semanas
- Amarillo (4): MEDIO - Próximos meses
- Verde (2-1): BAJO - Seguimiento

El sistema calcula automáticamente.`,
        highlights: ['.risk-matrix', '.risk-heatmap'],
        action: 'Observa la matriz de riesgos'
      },
      {
        id: 'create',
        title: 'Registrar un Riesgo',
        content: `Haz clic en '+ Nuevo Riesgo'

Formulario:
NOMBRE: 'Pérdida de Datos por Ransomware'
DESCRIPCIÓN: 'Ataque de ransomware podría encriptar nuestra BD'
CATEGORÍA: Ciberseguridad / Operacional / Cumplimiento / Reputación
PROBABILIDAD: Baja/Media/Alta
IMPACTO: Bajo/Medio/Alto
PROPIETARIO: Juan Pérez
ACTIVOS AFECTADOS: Selecciona
CONTROLES EXISTENTES: 'Tenemos backup diario'

Guardar = Riesgo registrado + Score automático`,
        highlights: ['.new-risk-btn', '.risk-form'],
        action: 'Crea tu primer riesgo'
      },
      {
        id: 'evaluate',
        title: 'Ver tu Matriz de Riesgos',
        content: `Dashboard de riesgos te muestra:

MATRIZ VISUAL:
- Cada riesgo es un punto
- Rojo en esquina = crítico
- Verde en esquina = manejable
- Haz clic en punto para detalles

LISTA ORDENADA:
- Por riesgo (mayor primero)
- Nombre, Propietario, Status

MÉTRICAS:
- Total de riesgos: 24
- Críticos: 3 (acción inmediata)
- Altos: 7
- Medios: 10
- Bajos: 4`,
        highlights: ['.risks-overview', '.risk-list'],
        action: 'Examina tu matriz de riesgos'
      },
      {
        id: 'mitigation',
        title: 'Crear Plan de Acción',
        content: `Para cada riesgo, elige:

OPCIÓN 1: ACEPTAR
- El riesgo es asumible
- Documentar por qué

OPCIÓN 2: EVITAR
- Cambiar proceso para eliminar riesgo

OPCIÓN 3: MITIGAR
- Reducir probabilidad O impacto

OPCIÓN 4: TRANSFERIR
- Asegurar (seguros de cyber)

Plan CAPA (Corrective Action Plan):
- Acción específica
- Responsable
- Fecha límite
- Métricas de éxito`,
        highlights: ['.mitigation-plan', '.risk-actions'],
        action: 'Crea un plan de mitigación'
      },
      {
        id: 'controls',
        title: 'Implementar Controles',
        content: `Controles = medidas específicas

Ejemplo Riesgo: Pérdida de Datos
Controles:
✓ Control A: Backup automático diario
✓ Control B: Cifrado en reposo
✓ Control C: MFA para acceso a datos
✓ Control D: Monitoring 24/7

Para cada control:
- Asignar responsable
- Fecha de implementación
- Marcar como 'En Proceso' → 'Implementado' → 'Testado'
- Adjuntar evidencia

El sistema te notifica cuando vencen.`,
        highlights: ['.risk-controls', '.control-list'],
        action: 'Asigna controles a un riesgo'
      },
      {
        id: 'monitoring',
        title: 'Riesgos Nunca Duermen',
        content: `Mensualmente:
1. Revisar cada riesgo
2. ¿Cambió la probabilidad?
3. ¿Cambió el impacto?
4. ¿Los controles funcionan?
5. Actualizar score si es necesario

Anualmente:
- Auditoría completa de riesgos
- Evaluar nuevos riesgos
- Eliminar riesgos resueltos

El sistema rastrea historia:
- Riesgo X estaba 'Alto' en Jan
- Ahora es 'Medio' en March
- Evidencia de mejora = auditor feliz`,
        highlights: ['.risk-monitoring', '.risk-history'],
        action: 'Monitorea y actualiza tus riesgos'
      },
      {
        id: 'conclusion',
        title: 'Risk Register Completo',
        content: `¡Ahora tienes un Risk Register completo!

El sistema tiene:
✓ QUÉ FALTA (Gaps)
✓ QUÉ PROTEGES (Assets)
✓ TUS REGLAS (Documentos)
✓ QUÉ RIESGOS TIENES (Risks)

Próximo: EVIDENCIA
¿Cómo probamos que lo hicimos? Paso 6: Evidence`,
        action: 'Haz clic en Siguiente'
      }
    ],
    nextPath: '/evidence'
  },

  // Evidence y Findings continuarían con la misma estructura...
  // Para brevedad, agrego los stubs aquí

  {
    id: 'evidence',
    path: '/evidence',
    icon: '6️⃣',
    title: 'Recopilación de Evidencia',
    description: 'Centraliza y organiza todas las pruebas de que tus controles funcionan.',
    sections: [
      {
        id: 'intro',
        title: 'Qué sí hace esta pantalla',
        content: `Aquí puedes:
- Subir evidencia
- Buscar por texto (nombre/control/cláusula)
- Filtrar por tipo
- Ver estado de frescura (fresh, expiring, expired)
- Eliminar evidencia`,
        action: 'Ubica buscador, filtro y botón de carga'
      },
      {
        id: 'upload',
        title: 'Carga de evidencias',
        content: `La carga se realiza desde el uploader del sistema y luego verás el item clasificado dentro de su grupo.

Después puedes revisar su vigencia y mantener solo evidencias actuales.`,
        action: 'Sube tu primera evidencia'
      },
      {
        id: 'organize',
        title: 'Enfoque del paso',
        content: `La meta aquí es mantener evidencia vigente, localizable y lista para revisión.

      Con buscador, filtros y estados de frescura, puedes sostener la calidad de evidencia durante todo el ciclo.`,
        action: 'Usa este paso para cargar, filtrar y mantener evidencia al día'
      },
      {
        id: 'conclusion',
        title: 'Siguiente paso',
        content: `Con evidencias cargadas y clasificadas, pasa a CAPA/Findings para gestionar acciones correctivas y prioridades.`,
        action: 'Haz clic en Siguiente'
      }
    ],
    nextPath: '/findings'
  },

  {
    id: 'findings',
    path: '/findings',
    icon: '7️⃣',
    title: 'Reporte de Hallazgos',
    description: 'Compila hallazgos de auditoría y genera reportes finales para stakeholders.',
    sections: [
      {
        id: 'intro',
        title: 'Qué encontrarás realmente',
        content: `Esta pantalla funciona hoy como CAPA Tracker.

Aquí ves acciones correctivas, su estado, prioridad, fecha de vencimiento y progreso.`,
        action: 'Revisa KPIs y tabla de CAPAs'
      },
      {
        id: 'create',
        title: 'Crear CAPA',
        content: `Puedes crear una CAPA con título, prioridad, fuente, due date, progreso y control relacionado.

Después aparecerá en la tabla principal para seguimiento.`,
        action: 'Crea una CAPA de ejemplo'
      },
      {
        id: 'filters',
        title: 'Seguimiento y filtros',
        content: `Puedes filtrar por estado y prioridad, y abrir cada fila para ver detalle (descripción, control/owner, fuente y fechas).

También verás KPIs de abiertas, vencidas y cerradas.`,
        action: 'Aplica filtros y expande una fila'
      },
      {
        id: 'conclusion',
        title: 'Cierre del paso',
        content: `Con CAPAs bien definidas y monitoreadas, conviertes brechas en un plan ejecutable con responsables y fechas.

      Esto te deja listo para preparar auditoría con mayor control operativo.`,
        action: 'Haz clic en Siguiente'
      }
    ],
    nextPath: '/audit'
  },

  {
    id: 'audit',
    path: '/audit',
    icon: '8️⃣',
    title: 'Preparación de Auditoría',
    description: 'Prepara y ejecuta la auditoría externa de compliance con socios certificados.',
    sections: [
      {
        id: 'intro',
    title: 'Qué hace realmente este módulo',
    content: `Aquí tienes tres capacidades principales:
  - Validación de evidencia por texto
  - Validación granular de archivos
  - Checklist pre-auditoría con auto-guardado`,
    action: 'Ubica el validador, checklist y Audit Room'
      },
      {
    id: 'validation',
    title: 'Validación de contenido y archivo',
    content: `Puedes pegar evidencia textual o subir un archivo para que el sistema analice hallazgos y estado de cumplimiento.

  El resultado se muestra con progreso, severidades y observaciones.`,
    action: 'Ejecuta una validación de ejemplo'
      },
      {
        id: 'readiness',
    title: 'Checklist y Audit Room',
    content: `El checklist se guarda automáticamente y te permite controlar pendientes previos a auditoría.

  En Audit Room puedes seleccionar evidencias y generar un binder en PDF para descarga.`,
    action: 'Marca items del checklist y genera un binder'
      },
      {
        id: 'conclusion',
    title: 'Cierre del paso',
    content: `Con validación, checklist y binder PDF, este módulo te ayuda a llegar a revisión con evidencia ordenada y mejor preparada.

El siguiente paso es sostener ese nivel de forma continua con autoevaluación periódica.`,
        action: 'Haz clic en Siguiente'
      }
    ]
  },

  {
    id: 'self-assessment',
    path: '/assessment',
    icon: '9️⃣',
    title: 'Autoevaluación Continua',
    description: 'Realiza evaluaciones internas periódicas para mantener compliance entre auditorías.',
    sections: [
      {
        id: 'intro',
    title: 'Qué hace este módulo',
    content: `La autoevaluación actual es un cuestionario por fases.

  Respondes cada pregunta y el sistema guarda avance para que puedas continuar luego.`,
    action: 'Identifica fases y progreso lateral'
      },
      {
        id: 'self-assessment-form',
    title: 'Respuestas disponibles',
    content: `Las opciones de respuesta son: Yes, Partial, No y N/A.

  Puedes responder por pregunta y avanzar por fase desde el selector lateral.`,
    action: 'Responde al menos una pregunta de cada fase'
      },
      {
        id: 'evidence-review',
    title: 'Evidencia por pregunta',
    content: `Cada pregunta permite adjuntar evidencia.

  Regla importante: si una pregunta crítica se marca como "Yes", debes adjuntar evidencia para validarla correctamente.`,
    action: 'Adjunta evidencia en una pregunta crítica'
      },
      {
    id: 'persistence',
    title: 'Guardado y continuidad',
    content: `El avance se guarda automáticamente (local + backend) para que no pierdas respuestas al cambiar de fase o recargar.

  También verás barra de progreso por fase y progreso global respondido.`,
    action: 'Cambia de fase y confirma que el avance se conserva'
      },
      {
        id: 'conclusion',
    title: 'Cierre del paso',
    content: `Con respuestas, evidencia y guardado continuo por fases, puedes mantener un seguimiento estable del cumplimiento entre revisiones formales.

Esta disciplina mejora la trazabilidad y reduce sorpresas en ciclos de auditoría.`,
        action: 'Celebra tu logro'
      }
    ]
  },
];

export default mainTutorials;
