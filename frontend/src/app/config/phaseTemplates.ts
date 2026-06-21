export type PhaseTemplate = {
  phaseId: string
  title?: string
  description?: string
  sections?: string[]
  controlRefs?: string[]
}

// Plantillas por fase. Añade/ajusta según necesidades del proyecto.
const phaseTemplates: Record<string, PhaseTemplate> = {
  '1': {
    phaseId: '1',
    title: 'Política y Alcance - Fase 1',
    description: 'Documento base que define alcance y responsabilidades de la fase 1.',
    sections: ['Objetivo', 'Alcance', 'Responsabilidades', 'Definiciones'],
    controlRefs: ['A.5', 'A.6'],
  },
  '2': {
    phaseId: '2',
    title: 'Gestión de Riesgos - Fase 2',
    description: 'Plantilla para identificar y gestionar riesgos relevantes en la fase 2.',
    sections: ['Identificación de Riesgos', 'Evaluación', 'Tratamiento', 'Seguimiento'],
    controlRefs: ['A.8', 'A.9'],
  },
}

export default phaseTemplates
