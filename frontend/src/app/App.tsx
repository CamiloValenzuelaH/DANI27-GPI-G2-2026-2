<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, X, MessageCircle, Send } from 'lucide-react';
import AuditPage from './pages/AuditPage';
import Card from './components/common/Card';

type Page = 'dashboard' | 'understand' | 'documents' | 'risks' | 'evidence' | 'findings' | 'audit' | 'integrity' | 'regfeed' | 'dora' | 'euai' | 'escalation' | 'integrations' | 'settings';
type NavView = 'process' | 'module';
type Profile = 'foundational' | 'established' | 'advanced' | 'mature';
type Language = 'en' | 'es' | 'pt' | 'de' | 'fr';
type DateFormat = 'dmy' | 'mdy' | 'ymd';

interface ChatMessage {
  id: number;
  text: string;
  isAi: boolean;
  timestamp: Date;
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [navView, setNavView] = useState<NavView>('process');
  const [profile, setProfile] = useState<Profile>('established');
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: '¡Hola! Soy Dani, tu asistente de cumplimiento. ¿En qué puedo ayudarte hoy?',
      isAi: true,
      timestamp: new Date(),
    },
  ]);

  // Settings states
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const [dateFormat, setDateFormat] = useState<DateFormat>('dmy');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  // Chat scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  // Translations
  const translations = {
    en: {
      // Navigation
      dashboard: 'Dashboard',
      understand: 'Understand My Situation',
      documents: 'Document Controls',
      risks: 'Manage Risks',
      evidence: 'Collect Evidence',
      findings: 'Manage Findings',
      audit: 'Prepare for Audit',
      integrity: 'Compliance Integrity',
      regfeed: 'Regulatory Feed',
      settings: 'Settings',
      escalation: 'Escalation Rules',
      integrations: 'Integrations',

      // Common
      searchPlaceholder: 'Search controls or evidence...',
      administrator: 'Administrator',
      chatPlaceholder: 'Type a message...',
      send: 'Send',

      // Dashboard
      profile: 'Profile',
      exportReport: 'Export Report',
      addFramework: 'Add Framework',
      overallCompliance: 'Overall Compliance Health',
      documentation: 'Documentation',
      implementation: 'Implementation',
      tested: 'Tested / Effective',
      autoTracked: 'Auto-tracked',
      reviewNeeded: 'Review needed',
      humanRequired: 'Human required',
      fromLastMonth: 'from last month',
      docsPending: 'docs pending review',
      controlsUnverified: 'controls unverified',
      controlsUntested: 'controls untested',
      complianceAlerts: 'Compliance Integrity Alerts',
      viewAll: 'View all',
      alerts: 'alerts',
      regulatoryFeed: 'Regulatory Feed',
      controlStatus: 'Control Status — Cross-Framework View',
      viewSOA: 'View SOA',
      control: 'Control',
      description: 'Description',
      documented: 'Documented',
      implemented: 'Implemented',
      frameworks: 'Frameworks',
      priorityActions: 'Priority Actions',
      preAuditAssessment: 'Pre-Audit Self-Assessment',
      estimatedReadiness: 'Estimated Audit Readiness',
      highRiskAreas: 'high-risk non-conformity areas detected',
      likelyFindings: 'Likely Audit Findings',
      decisionLegend: 'Decision Level Legend:',
      systemExecutes: 'System executes without intervention',
      aiProposes: 'AI proposes, human validates',
      requiresHuman: 'Requires human decision',

      // Gap Analysis
      gapAnalysis: 'Gap Analysis',
      totalGaps: 'Total Gaps Identified',
      criticalGaps: 'Critical Gaps',
      gapsClosed: 'Gaps Closed',
      acrossFrameworks: 'Across all frameworks',
      requireAction: 'Require immediate action',
      progress: 'progress',

      // Documents
      documentGenerator: 'Document Generator',
      generateDocument: 'Generate Document',
      policyLibrary: 'Policy & Procedure Library',

      // Risks
      riskMap: 'Risk Map',
      addRisk: 'Add Risk',
      totalRisks: 'Total Risks',
      highCritical: 'High / Critical',
      withTreatment: 'With Treatment Plans',
      acrossCategories: 'Across 4 categories',
      needTreatment: 'need immediate treatment',
      coverage: 'coverage',
      riskRegister: 'Risk Register',

      // Evidence
      evidenceCenter: 'Evidence Center',
      uploadEvidence: 'Upload Evidence',
      totalEvidence: 'Total Evidence Items',
      autoCollected: 'Auto-Collected',
      effectivenessEvidence: 'Effectiveness Evidence',
      acrossControls: 'Across 93 controls',
      fromSources: 'From AWS, Azure, Okta',
      penTests: 'Pen tests, tabletops, drills',
      evidenceByType: 'Evidence by Type',

      // Findings
      capaTracker: 'CAPA Tracker',
      newCAPA: 'New CAPA',
      openCAPAs: 'Open CAPAs',
      overdue: 'overdue',
      avgResolution: 'Avg. Resolution Time',
      targetDays: 'Target: 30 days',
      closedQuarter: 'Closed This Quarter',
      vsLast: 'vs. 11 last quarter',
      openActions: 'Open Corrective Actions',

      // Audit
      auditRoom: 'Audit Room',
      generatePreAudit: 'Generate Pre-Audit Report',
      auditReadiness: 'Audit Readiness',
      targetBefore: 'Target: 85% before audit',
      evidenceCoverage: 'Evidence Coverage',
      controlsMissing: 'of controls missing evidence',
      openNonConformities: 'Open Non-Conformities',
      highRisk: 'High risk for audit findings',
      predictedFindings: 'Predicted Audit Findings',
      auditTimeline: 'Audit Timeline',

      // Settings
      languageRegion: 'Language & Region',
      interfaceLanguage: 'Interface Language',
      controlsUI: 'Controls the language of the entire platform UI',
      dateFormat: 'Date Format',
      howDisplayed: 'How dates are displayed',
      timezone: 'Timezone',
      yourTimezone: 'Your local timezone',
      appearance: 'Appearance',
      darkMode: 'Dark Mode',
      toggleTheme: 'Toggle dark theme',
      compactView: 'Compact View',
      reduceSpacing: 'Reduce spacing in tables',
      showLabels: 'Show Sidebar Labels',
      displayText: 'Display text in navigation',
      notifications: 'Notifications',
      emailNotifications: 'Email Notifications',
      receiveAlerts: 'Receive compliance alerts via email',
      capaReminders: 'CAPA Reminders',
      overdueNotif: 'Notifications for overdue CAPAs',
      regulatoryUpdates: 'Regulatory Updates',
      alertChanges: 'Alert on new regulatory changes',
      auditDeadlines: 'Audit Deadlines',
      remindersBefore: 'Reminders before audit dates',
      system: 'System',
      autoSave: 'Auto-Save',
      autoSaveChanges: 'Automatically save changes',
      offlineMode: 'Offline Mode',
      enableOffline: 'Enable offline access to data',
      exportFormat: 'Data Export Format',
      defaultFormat: 'Default format for reports',
    },
    es: {
      // Navigation
      dashboard: 'Panel de Control',
      understand: 'Entender Mi Situación',
      documents: 'Controles de Documentos',
      risks: 'Gestionar Riesgos',
      evidence: 'Recopilar Evidencia',
      findings: 'Gestionar Hallazgos',
      audit: 'Preparar Auditoría',
      integrity: 'Integridad de Cumplimiento',
      regfeed: 'Noticias Regulatorias',
      settings: 'Configuración',
      escalation: 'Reglas de Escalación',
      integrations: 'Integraciones',

      // Common
      searchPlaceholder: 'Buscar controles o evidencia...',
      administrator: 'Administrador',
      chatPlaceholder: 'Escribe un mensaje...',
      send: 'Enviar',

      // Dashboard
      profile: 'Perfil',
      exportReport: 'Exportar Reporte',
      addFramework: 'Agregar Framework',
      overallCompliance: 'Estado General de Cumplimiento',
      documentation: 'Documentación',
      implementation: 'Implementación',
      tested: 'Probado / Efectivo',
      autoTracked: 'Auto-rastreado',
      reviewNeeded: 'Revisión necesaria',
      humanRequired: 'Humano requerido',
      fromLastMonth: 'desde el mes pasado',
      docsPending: 'docs pendientes de revisión',
      controlsUnverified: 'controles sin verificar',
      controlsUntested: 'controles sin probar',
      complianceAlerts: 'Alertas de Integridad de Cumplimiento',
      viewAll: 'Ver todos',
      alerts: 'alertas',
      regulatoryFeed: 'Noticias Regulatorias',
      controlStatus: 'Estado de Controles — Vista Multi-Framework',
      viewSOA: 'Ver SOA',
      control: 'Control',
      description: 'Descripción',
      documented: 'Documentado',
      implemented: 'Implementado',
      frameworks: 'Frameworks',
      priorityActions: 'Acciones Prioritarias',
      preAuditAssessment: 'Autoevaluación Pre-Auditoría',
      estimatedReadiness: 'Preparación Estimada para Auditoría',
      highRiskAreas: 'áreas de no conformidad de alto riesgo detectadas',
      likelyFindings: 'Hallazgos Probables de Auditoría',
      decisionLegend: 'Leyenda de Nivel de Decisión:',
      systemExecutes: 'El sistema ejecuta sin intervención',
      aiProposes: 'IA propone, humano valida',
      requiresHuman: 'Requiere decisión humana',

      // Gap Analysis
      gapAnalysis: 'Análisis de Brechas',
      totalGaps: 'Total de Brechas Identificadas',
      criticalGaps: 'Brechas Críticas',
      gapsClosed: 'Brechas Cerradas',
      acrossFrameworks: 'En todos los frameworks',
      requireAction: 'Requieren acción inmediata',
      progress: 'progreso',

      // Documents
      documentGenerator: 'Generador de Documentos',
      generateDocument: 'Generar Documento',
      policyLibrary: 'Biblioteca de Políticas y Procedimientos',

      // Risks
      riskMap: 'Mapa de Riesgos',
      addRisk: 'Agregar Riesgo',
      totalRisks: 'Total de Riesgos',
      highCritical: 'Alto / Crítico',
      withTreatment: 'Con Planes de Tratamiento',
      acrossCategories: 'En 4 categorías',
      needTreatment: 'necesitan tratamiento inmediato',
      coverage: 'cobertura',
      riskRegister: 'Registro de Riesgos',

      // Evidence
      evidenceCenter: 'Centro de Evidencias',
      uploadEvidence: 'Subir Evidencia',
      totalEvidence: 'Total de Elementos de Evidencia',
      autoCollected: 'Auto-Recopilado',
      effectivenessEvidence: 'Evidencia de Efectividad',
      acrossControls: 'En 93 controles',
      fromSources: 'De AWS, Azure, Okta',
      penTests: 'Pruebas de penetración, simulacros',
      evidenceByType: 'Evidencia por Tipo',

      // Findings
      capaTracker: 'Seguimiento de CAPA',
      newCAPA: 'Nuevo CAPA',
      openCAPAs: 'CAPAs Abiertos',
      overdue: 'vencidos',
      avgResolution: 'Tiempo Promedio de Resolución',
      targetDays: 'Objetivo: 30 días',
      closedQuarter: 'Cerrados Este Trimestre',
      vsLast: 'vs. 11 trimestre pasado',
      openActions: 'Acciones Correctivas Abiertas',

      // Audit
      auditRoom: 'Sala de Auditoría',
      generatePreAudit: 'Generar Reporte Pre-Auditoría',
      auditReadiness: 'Preparación para Auditoría',
      targetBefore: 'Objetivo: 85% antes de auditoría',
      evidenceCoverage: 'Cobertura de Evidencia',
      controlsMissing: 'de controles faltan evidencia',
      openNonConformities: 'No Conformidades Abiertas',
      highRisk: 'Alto riesgo para hallazgos de auditoría',
      predictedFindings: 'Hallazgos Predichos de Auditoría',
      auditTimeline: 'Cronograma de Auditoría',

      // Settings
      languageRegion: 'Idioma y Región',
      interfaceLanguage: 'Idioma de la Interfaz',
      controlsUI: 'Controla el idioma de toda la plataforma',
      dateFormat: 'Formato de Fecha',
      howDisplayed: 'Cómo se muestran las fechas',
      timezone: 'Zona Horaria',
      yourTimezone: 'Tu zona horaria local',
      appearance: 'Apariencia',
      darkMode: 'Modo Oscuro',
      toggleTheme: 'Alternar tema oscuro',
      compactView: 'Vista Compacta',
      reduceSpacing: 'Reducir espaciado en tablas',
      showLabels: 'Mostrar Etiquetas del Menú',
      displayText: 'Mostrar texto en navegación',
      notifications: 'Notificaciones',
      emailNotifications: 'Notificaciones por Email',
      receiveAlerts: 'Recibir alertas de cumplimiento por email',
      capaReminders: 'Recordatorios de CAPA',
      overdueNotif: 'Notificaciones para CAPAs vencidos',
      regulatoryUpdates: 'Actualizaciones Regulatorias',
      alertChanges: 'Alertar sobre nuevos cambios regulatorios',
      auditDeadlines: 'Plazos de Auditoría',
      remindersBefore: 'Recordatorios antes de fechas de auditoría',
      system: 'Sistema',
      autoSave: 'Guardado Automático',
      autoSaveChanges: 'Guardar cambios automáticamente',
      offlineMode: 'Modo Sin Conexión',
      enableOffline: 'Habilitar acceso sin conexión a datos',
      exportFormat: 'Formato de Exportación de Datos',
      defaultFormat: 'Formato predeterminado para reportes',
    },
    pt: {
      // Navigation
      dashboard: 'Painel',
      understand: 'Entender Minha Situação',
      documents: 'Controles de Documentos',
      risks: 'Gerenciar Riscos',
      evidence: 'Coletar Evidências',
      findings: 'Gerenciar Achados',
      audit: 'Preparar Auditoria',
      integrity: 'Integridade de Conformidade',
      regfeed: 'Feed Regulatório',
      settings: 'Configurações',
      escalation: 'Regras de Escalação',
      integrations: 'Integrações',

      // Common
      searchPlaceholder: 'Pesquisar controles ou evidências...',
      administrator: 'Administrador',
      chatPlaceholder: 'Digite uma mensagem...',
      send: 'Enviar',

      // Dashboard
      profile: 'Perfil',
      exportReport: 'Exportar Relatório',
      addFramework: 'Adicionar Framework',
      overallCompliance: 'Saúde Geral de Conformidade',
      documentation: 'Documentação',
      implementation: 'Implementação',
      tested: 'Testado / Efetivo',
      autoTracked: 'Auto-rastreado',
      reviewNeeded: 'Revisão necessária',
      humanRequired: 'Humano necessário',
      fromLastMonth: 'do mês passado',
      docsPending: 'docs pendentes de revisão',
      controlsUnverified: 'controles não verificados',
      controlsUntested: 'controles não testados',
      complianceAlerts: 'Alertas de Integridade de Conformidade',
      viewAll: 'Ver todos',
      alerts: 'alertas',
      regulatoryFeed: 'Feed Regulatório',
      controlStatus: 'Status de Controle — Visão Multi-Framework',
      viewSOA: 'Ver SOA',
      control: 'Controle',
      description: 'Descrição',
      documented: 'Documentado',
      implemented: 'Implementado',
      frameworks: 'Frameworks',
      priorityActions: 'Ações Prioritárias',
      preAuditAssessment: 'Autoavaliação Pré-Auditoria',
      estimatedReadiness: 'Prontidão Estimada para Auditoria',
      highRiskAreas: 'áreas de não conformidade de alto risco detectadas',
      likelyFindings: 'Achados Prováveis de Auditoria',
      decisionLegend: 'Legenda de Nível de Decisão:',
      systemExecutes: 'Sistema executa sem intervenção',
      aiProposes: 'IA propõe, humano valida',
      requiresHuman: 'Requer decisão humana',

      // Gap Analysis
      gapAnalysis: 'Análise de Lacunas',
      totalGaps: 'Total de Lacunas Identificadas',
      criticalGaps: 'Lacunas Críticas',
      gapsClosed: 'Lacunas Fechadas',
      acrossFrameworks: 'Em todos os frameworks',
      requireAction: 'Requerem ação imediata',
      progress: 'progresso',

      // Documents
      documentGenerator: 'Gerador de Documentos',
      generateDocument: 'Gerar Documento',
      policyLibrary: 'Biblioteca de Políticas e Procedimentos',

      // Risks
      riskMap: 'Mapa de Riscos',
      addRisk: 'Adicionar Risco',
      totalRisks: 'Total de Riscos',
      highCritical: 'Alto / Crítico',
      withTreatment: 'Com Planos de Tratamento',
      acrossCategories: 'Em 4 categorias',
      needTreatment: 'precisam de tratamento imediato',
      coverage: 'cobertura',
      riskRegister: 'Registro de Riscos',

      // Evidence
      evidenceCenter: 'Centro de Evidências',
      uploadEvidence: 'Carregar Evidência',
      totalEvidence: 'Total de Itens de Evidência',
      autoCollected: 'Auto-Coletado',
      effectivenessEvidence: 'Evidência de Efetividade',
      acrossControls: 'Em 93 controles',
      fromSources: 'De AWS, Azure, Okta',
      penTests: 'Testes de penetração, simulações',
      evidenceByType: 'Evidência por Tipo',

      // Findings
      capaTracker: 'Rastreador de CAPA',
      newCAPA: 'Novo CAPA',
      openCAPAs: 'CAPAs Abertos',
      overdue: 'vencidos',
      avgResolution: 'Tempo Médio de Resolução',
      targetDays: 'Meta: 30 dias',
      closedQuarter: 'Fechados Este Trimestre',
      vsLast: 'vs. 11 trimestre passado',
      openActions: 'Ações Corretivas Abertas',

      // Audit
      auditRoom: 'Sala de Auditoria',
      generatePreAudit: 'Gerar Relatório Pré-Auditoria',
      auditReadiness: 'Prontidão para Auditoria',
      targetBefore: 'Meta: 85% antes da auditoria',
      evidenceCoverage: 'Cobertura de Evidência',
      controlsMissing: 'dos controles faltam evidência',
      openNonConformities: 'Não Conformidades Abertas',
      highRisk: 'Alto risco para achados de auditoria',
      predictedFindings: 'Achados Previstos de Auditoria',
      auditTimeline: 'Cronograma de Auditoria',

      // Settings
      languageRegion: 'Idioma e Região',
      interfaceLanguage: 'Idioma da Interface',
      controlsUI: 'Controla o idioma de toda a plataforma',
      dateFormat: 'Formato de Data',
      howDisplayed: 'Como as datas são exibidas',
      timezone: 'Fuso Horário',
      yourTimezone: 'Seu fuso horário local',
      appearance: 'Aparência',
      darkMode: 'Modo Escuro',
      toggleTheme: 'Alternar tema escuro',
      compactView: 'Visualização Compacta',
      reduceSpacing: 'Reduzir espaçamento em tabelas',
      showLabels: 'Mostrar Rótulos do Menu',
      displayText: 'Exibir texto na navegação',
      notifications: 'Notificações',
      emailNotifications: 'Notificações por Email',
      receiveAlerts: 'Receber alertas de conformidade por email',
      capaReminders: 'Lembretes de CAPA',
      overdueNotif: 'Notificações para CAPAs vencidos',
      regulatoryUpdates: 'Atualizações Regulatórias',
      alertChanges: 'Alertar sobre novas mudanças regulatórias',
      auditDeadlines: 'Prazos de Auditoria',
      remindersBefore: 'Lembretes antes das datas de auditoria',
      system: 'Sistema',
      autoSave: 'Salvamento Automático',
      autoSaveChanges: 'Salvar mudanças automaticamente',
      offlineMode: 'Modo Offline',
      enableOffline: 'Habilitar acesso offline aos dados',
      exportFormat: 'Formato de Exportação de Dados',
      defaultFormat: 'Formato padrão para relatórios',
    },
    de: {
      // Navigation
      dashboard: 'Dashboard',
      understand: 'Meine Situation Verstehen',
      documents: 'Dokumentenkontrollen',
      risks: 'Risiken Verwalten',
      evidence: 'Beweise Sammeln',
      findings: 'Befunde Verwalten',
      audit: 'Audit Vorbereiten',
      integrity: 'Compliance-Integrität',
      regfeed: 'Regulatorischer Feed',
      settings: 'Einstellungen',
      escalation: 'Eskalationsregeln',
      integrations: 'Integrationen',

      // Common
      searchPlaceholder: 'Kontrollen oder Beweise suchen...',
      administrator: 'Administrator',
      chatPlaceholder: 'Nachricht eingeben...',
      send: 'Senden',

      // Dashboard
      profile: 'Profil',
      exportReport: 'Bericht Exportieren',
      addFramework: 'Framework Hinzufügen',
      overallCompliance: 'Allgemeine Compliance-Gesundheit',
      documentation: 'Dokumentation',
      implementation: 'Implementierung',
      tested: 'Getestet / Wirksam',
      autoTracked: 'Auto-verfolgt',
      reviewNeeded: 'Überprüfung erforderlich',
      humanRequired: 'Mensch erforderlich',
      fromLastMonth: 'vom letzten Monat',
      docsPending: 'Dokumente zur Überprüfung',
      controlsUnverified: 'Kontrollen nicht verifiziert',
      controlsUntested: 'Kontrollen nicht getestet',
      complianceAlerts: 'Compliance-Integritätswarnungen',
      viewAll: 'Alle anzeigen',
      alerts: 'Warnungen',
      regulatoryFeed: 'Regulatorischer Feed',
      controlStatus: 'Kontrollstatus — Multi-Framework-Ansicht',
      viewSOA: 'SOA Anzeigen',
      control: 'Kontrolle',
      description: 'Beschreibung',
      documented: 'Dokumentiert',
      implemented: 'Implementiert',
      frameworks: 'Frameworks',
      priorityActions: 'Prioritätsaktionen',
      preAuditAssessment: 'Voraudit-Selbstbewertung',
      estimatedReadiness: 'Geschätzte Audit-Bereitschaft',
      highRiskAreas: 'Hochrisiko-Nichtkonformitätsbereiche erkannt',
      likelyFindings: 'Wahrscheinliche Audit-Ergebnisse',
      decisionLegend: 'Entscheidungsebenen-Legende:',
      systemExecutes: 'System führt ohne Eingriff aus',
      aiProposes: 'KI schlägt vor, Mensch validiert',
      requiresHuman: 'Erfordert menschliche Entscheidung',

      // Gap Analysis
      gapAnalysis: 'Lückenanalyse',
      totalGaps: 'Gesamtzahl der Identifizierten Lücken',
      criticalGaps: 'Kritische Lücken',
      gapsClosed: 'Geschlossene Lücken',
      acrossFrameworks: 'In allen Frameworks',
      requireAction: 'Erfordern sofortige Maßnahmen',
      progress: 'Fortschritt',

      // Documents
      documentGenerator: 'Dokumentengenerator',
      generateDocument: 'Dokument Generieren',
      policyLibrary: 'Richtlinien- und Verfahrensbibliothek',

      // Risks
      riskMap: 'Risikokarte',
      addRisk: 'Risiko Hinzufügen',
      totalRisks: 'Gesamtrisiken',
      highCritical: 'Hoch / Kritisch',
      withTreatment: 'Mit Behandlungsplänen',
      acrossCategories: 'In 4 Kategorien',
      needTreatment: 'benötigen sofortige Behandlung',
      coverage: 'Abdeckung',
      riskRegister: 'Risikoregister',

      // Evidence
      evidenceCenter: 'Beweiszentrum',
      uploadEvidence: 'Beweis Hochladen',
      totalEvidence: 'Gesamtzahl der Beweiselemente',
      autoCollected: 'Auto-Gesammelt',
      effectivenessEvidence: 'Wirksamkeitsnachweis',
      acrossControls: 'Über 93 Kontrollen',
      fromSources: 'Von AWS, Azure, Okta',
      penTests: 'Pen-Tests, Simulationen',
      evidenceByType: 'Beweis nach Typ',

      // Findings
      capaTracker: 'CAPA-Tracker',
      newCAPA: 'Neues CAPA',
      openCAPAs: 'Offene CAPAs',
      overdue: 'überfällig',
      avgResolution: 'Durchschnittliche Lösungszeit',
      targetDays: 'Ziel: 30 Tage',
      closedQuarter: 'Dieses Quartal Geschlossen',
      vsLast: 'vs. 11 letztes Quartal',
      openActions: 'Offene Korrekturmaßnahmen',

      // Audit
      auditRoom: 'Auditraum',
      generatePreAudit: 'Voraudit-Bericht Generieren',
      auditReadiness: 'Audit-Bereitschaft',
      targetBefore: 'Ziel: 85% vor Audit',
      evidenceCoverage: 'Beweisabdeckung',
      controlsMissing: 'der Kontrollen fehlen Beweise',
      openNonConformities: 'Offene Nichtkonformitäten',
      highRisk: 'Hohes Risiko für Audit-Ergebnisse',
      predictedFindings: 'Vorhergesagte Audit-Ergebnisse',
      auditTimeline: 'Audit-Zeitplan',

      // Settings
      languageRegion: 'Sprache & Region',
      interfaceLanguage: 'Oberflächensprache',
      controlsUI: 'Steuert die Sprache der gesamten Plattform',
      dateFormat: 'Datumsformat',
      howDisplayed: 'Wie Daten angezeigt werden',
      timezone: 'Zeitzone',
      yourTimezone: 'Ihre lokale Zeitzone',
      appearance: 'Aussehen',
      darkMode: 'Dunkelmodus',
      toggleTheme: 'Dunkles Thema umschalten',
      compactView: 'Kompakte Ansicht',
      reduceSpacing: 'Abstand in Tabellen reduzieren',
      showLabels: 'Menübeschriftungen Anzeigen',
      displayText: 'Text in Navigation anzeigen',
      notifications: 'Benachrichtigungen',
      emailNotifications: 'E-Mail-Benachrichtigungen',
      receiveAlerts: 'Compliance-Warnungen per E-Mail erhalten',
      capaReminders: 'CAPA-Erinnerungen',
      overdueNotif: 'Benachrichtigungen für überfällige CAPAs',
      regulatoryUpdates: 'Regulatorische Updates',
      alertChanges: 'Über neue regulatorische Änderungen benachrichtigen',
      auditDeadlines: 'Audit-Fristen',
      remindersBefore: 'Erinnerungen vor Audit-Terminen',
      system: 'System',
      autoSave: 'Automatisches Speichern',
      autoSaveChanges: 'Änderungen automatisch speichern',
      offlineMode: 'Offline-Modus',
      enableOffline: 'Offline-Zugriff auf Daten aktivieren',
      exportFormat: 'Datenexportformat',
      defaultFormat: 'Standardformat für Berichte',
    },
    fr: {
      // Navigation
      dashboard: 'Tableau de Bord',
      understand: 'Comprendre Ma Situation',
      documents: 'Contrôles de Documents',
      risks: 'Gérer les Risques',
      evidence: 'Collecter des Preuves',
      findings: 'Gérer les Constatations',
      audit: 'Préparer l\'Audit',
      integrity: 'Intégrité de la Conformité',
      regfeed: 'Flux Réglementaire',
      settings: 'Paramètres',
      escalation: 'Règles d\'Escalade',
      integrations: 'Intégrations',

      // Common
      searchPlaceholder: 'Rechercher des contrôles ou des preuves...',
      administrator: 'Administrateur',
      chatPlaceholder: 'Tapez un message...',
      send: 'Envoyer',

      // Dashboard
      profile: 'Profil',
      exportReport: 'Exporter le Rapport',
      addFramework: 'Ajouter un Framework',
      overallCompliance: 'Santé Globale de la Conformité',
      documentation: 'Documentation',
      implementation: 'Implémentation',
      tested: 'Testé / Efficace',
      autoTracked: 'Auto-suivi',
      reviewNeeded: 'Révision nécessaire',
      humanRequired: 'Humain requis',
      fromLastMonth: 'du mois dernier',
      docsPending: 'docs en attente de révision',
      controlsUnverified: 'contrôles non vérifiés',
      controlsUntested: 'contrôles non testés',
      complianceAlerts: 'Alertes d\'Intégrité de Conformité',
      viewAll: 'Voir tout',
      alerts: 'alertes',
      regulatoryFeed: 'Flux Réglementaire',
      controlStatus: 'Statut des Contrôles — Vue Multi-Framework',
      viewSOA: 'Voir SOA',
      control: 'Contrôle',
      description: 'Description',
      documented: 'Documenté',
      implemented: 'Implémenté',
      frameworks: 'Frameworks',
      priorityActions: 'Actions Prioritaires',
      preAuditAssessment: 'Auto-évaluation Pré-audit',
      estimatedReadiness: 'Préparation Estimée pour l\'Audit',
      highRiskAreas: 'zones de non-conformité à haut risque détectées',
      likelyFindings: 'Constatations Probables d\'Audit',
      decisionLegend: 'Légende du Niveau de Décision:',
      systemExecutes: 'Le système s\'exécute sans intervention',
      aiProposes: 'L\'IA propose, l\'humain valide',
      requiresHuman: 'Nécessite une décision humaine',

      // Gap Analysis
      gapAnalysis: 'Analyse des Écarts',
      totalGaps: 'Total des Écarts Identifiés',
      criticalGaps: 'Écarts Critiques',
      gapsClosed: 'Écarts Fermés',
      acrossFrameworks: 'Dans tous les frameworks',
      requireAction: 'Nécessitent une action immédiate',
      progress: 'progrès',

      // Documents
      documentGenerator: 'Générateur de Documents',
      generateDocument: 'Générer un Document',
      policyLibrary: 'Bibliothèque de Politiques et Procédures',

      // Risks
      riskMap: 'Carte des Risques',
      addRisk: 'Ajouter un Risque',
      totalRisks: 'Total des Risques',
      highCritical: 'Haut / Critique',
      withTreatment: 'Avec Plans de Traitement',
      acrossCategories: 'Dans 4 catégories',
      needTreatment: 'nécessitent un traitement immédiat',
      coverage: 'couverture',
      riskRegister: 'Registre des Risques',

      // Evidence
      evidenceCenter: 'Centre de Preuves',
      uploadEvidence: 'Télécharger une Preuve',
      totalEvidence: 'Total des Éléments de Preuve',
      autoCollected: 'Auto-collecté',
      effectivenessEvidence: 'Preuve d\'Efficacité',
      acrossControls: 'Sur 93 contrôles',
      fromSources: 'De AWS, Azure, Okta',
      penTests: 'Tests de pénétration, simulations',
      evidenceByType: 'Preuve par Type',

      // Findings
      capaTracker: 'Suivi CAPA',
      newCAPA: 'Nouveau CAPA',
      openCAPAs: 'CAPAs Ouverts',
      overdue: 'en retard',
      avgResolution: 'Temps Moyen de Résolution',
      targetDays: 'Objectif: 30 jours',
      closedQuarter: 'Fermés ce Trimestre',
      vsLast: 'vs. 11 dernier trimestre',
      openActions: 'Actions Correctives Ouvertes',

      // Audit
      auditRoom: 'Salle d\'Audit',
      generatePreAudit: 'Générer un Rapport Pré-audit',
      auditReadiness: 'Préparation à l\'Audit',
      targetBefore: 'Objectif: 85% avant l\'audit',
      evidenceCoverage: 'Couverture des Preuves',
      controlsMissing: 'des contrôles manquent de preuves',
      openNonConformities: 'Non-conformités Ouvertes',
      highRisk: 'Haut risque pour les constatations d\'audit',
      predictedFindings: 'Constatations Prévues d\'Audit',
      auditTimeline: 'Calendrier d\'Audit',

      // Settings
      languageRegion: 'Langue & Région',
      interfaceLanguage: 'Langue de l\'Interface',
      controlsUI: 'Contrôle la langue de toute la plateforme',
      dateFormat: 'Format de Date',
      howDisplayed: 'Comment les dates sont affichées',
      timezone: 'Fuseau Horaire',
      yourTimezone: 'Votre fuseau horaire local',
      appearance: 'Apparence',
      darkMode: 'Mode Sombre',
      toggleTheme: 'Basculer le thème sombre',
      compactView: 'Vue Compacte',
      reduceSpacing: 'Réduire l\'espacement dans les tableaux',
      showLabels: 'Afficher les Étiquettes du Menu',
      displayText: 'Afficher le texte dans la navigation',
      notifications: 'Notifications',
      emailNotifications: 'Notifications par Email',
      receiveAlerts: 'Recevoir des alertes de conformité par email',
      capaReminders: 'Rappels CAPA',
      overdueNotif: 'Notifications pour les CAPAs en retard',
      regulatoryUpdates: 'Mises à Jour Réglementaires',
      alertChanges: 'Alerter sur les nouveaux changements réglementaires',
      auditDeadlines: 'Délais d\'Audit',
      remindersBefore: 'Rappels avant les dates d\'audit',
      system: 'Système',
      autoSave: 'Sauvegarde Automatique',
      autoSaveChanges: 'Sauvegarder les modifications automatiquement',
      offlineMode: 'Mode Hors Ligne',
      enableOffline: 'Activer l\'accès hors ligne aux données',
      exportFormat: 'Format d\'Exportation des Données',
      defaultFormat: 'Format par défaut pour les rapports',
    },
  };

  const t = translations[language];

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Chat bot responses
  const getBotResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    if (msg.includes('hola') || msg.includes('hello') || msg.includes('hi')) {
      return '¡Hola! ¿En qué aspecto del cumplimiento necesitas ayuda? Puedo asistirte con controles ISO 27001, evidencias, CAPAs, o cualquier pregunta sobre el sistema.';
    }
    if (msg.includes('ayuda') || msg.includes('help')) {
      return 'Puedo ayudarte con: 1) Análisis de brechas de cumplimiento, 2) Gestión de controles ISO 27001, 3) Seguimiento de evidencias, 4) Gestión de CAPAs, 5) Preparación de auditorías. ¿Con cuál te gustaría empezar?';
    }
    if (msg.includes('iso') || msg.includes('27001')) {
      return 'ISO 27001:2022 es el estándar internacional de seguridad de la información. Actualmente tienes 72% de cumplimiento general. ¿Te gustaría ver un análisis detallado de tus controles?';
    }
    if (msg.includes('audit') || msg.includes('auditoría')) {
      return 'Tu preparación para auditoría está al 68%. Tienes 3 no conformidades críticas que deben resolverse. ¿Quieres que genere un informe pre-auditoría?';
    }
    if (msg.includes('capa') || msg.includes('finding')) {
      return 'Tienes 8 CAPAs abiertas, 3 de ellas vencidas. Las más críticas son NC-2024-015 (45 días) y NC-2025-002 (38 días). ¿Necesitas ayuda para priorizarlas?';
    }
    if (msg.includes('evidence') || msg.includes('evidencia')) {
      return 'Tienes 142 elementos de evidencia total. 87 son auto-recopilados y 12 son evidencias de efectividad. Hay una brecha del 18% en evidencias de pruebas reales. ¿Quieres recomendaciones?';
    }
    if (msg.includes('riesgo') || msg.includes('risk')) {
      return 'Tienes 24 riesgos identificados, 6 de nivel crítico/alto. Los riesgos más importantes son ransomware (R-001) y acceso no autorizado a PII (R-002). ¿Necesitas un plan de tratamiento?';
    }
    if (msg.includes('gracias') || msg.includes('thanks')) {
      return '¡De nada! Estoy aquí para ayudarte con tu programa de cumplimiento. No dudes en preguntar cualquier cosa.';
    }

    return 'Entiendo tu consulta. Para darte una mejor respuesta, ¿podrías especificar si se trata de: controles, evidencias, CAPAs, riesgos o preparación de auditoría?';
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: chatMessages.length + 1,
      text: chatMessage,
      isAi: false,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMsg]);
    setChatMessage('');

    // Simulate AI response with delay
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: chatMessages.length + 2,
        text: getBotResponse(chatMessage),
        isAi: true,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  const profileConfig = {
    foundational: { color: 'bg-[#F5A623]/15 text-[#F5A623]', dot: 'bg-[#F5A623]', label: 'Foundational' },
    established: { color: 'bg-[#4F6EF7]/15 text-[#8BA3F9]', dot: 'bg-[#8BA3F9]', label: 'Established' },
    advanced: { color: 'bg-[#8B5CF6]/15 text-[#B794F6]', dot: 'bg-[#B794F6]', label: 'Advanced' },
    mature: { color: 'bg-[#1DB954]/15 text-[#1DB954]', dot: 'bg-[#1DB954]', label: 'Mature' },
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#111318]' : 'bg-[#F7F8FA]'}`}>
      {/* Sidebar */}
      <aside className={`w-[260px] text-white flex flex-col fixed h-screen overflow-y-auto transition-colors duration-300 ${darkMode ? 'bg-[#0A0D16]' : 'bg-[#0F1729]'}`}>
        {/* Logo */}
        <div className="px-5 py-[22px] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] rounded-lg bg-[#4F6EF7] flex items-center justify-center font-bold text-[15px]">
              D
            </div>
            <div>
              <div className="text-[15px] font-semibold -tracking-[0.2px]">Dani Platform</div>
              <div className="text-[11px] text-white/45 mt-0.5">v4 — Compliance Intelligence</div>
            </div>
          </div>
        </div>

        {/* Profile Badge */}
        <div className="px-5 pt-[14px] pb-[6px]">
          <div className="text-[10px] uppercase tracking-[1.2px] text-white/35 font-semibold">
            Organization Profile
          </div>
        </div>
        <div className="mx-4 mb-4">
          <button
            onClick={() => setShowProfileOverlay(true)}
            className={`w-full px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all hover:opacity-80 ${profileConfig[profile].color}`}
          >
            <span className={`w-[7px] h-[7px] rounded-full ${profileConfig[profile].dot}`} />
            <span>{profileConfig[profile].label}</span>
            <span className="ml-auto text-[11px] opacity-60">Change ›</span>
          </button>
        </div>

        {/* Nav Toggle */}
        <div className="mx-4 mb-1">
          <div className="flex bg-white/5 rounded-md p-[3px]">
            <button
              onClick={() => setNavView('process')}
              className={`flex-1 text-center py-1.5 text-[11px] font-medium rounded transition-all ${
                navView === 'process' ? 'bg-white/10 text-white' : 'text-white/45'
              }`}
            >
              By Process
            </button>
            <button
              onClick={() => setNavView('module')}
              className={`flex-1 text-center py-1.5 text-[11px] font-medium rounded transition-all ${
                navView === 'module' ? 'bg-white/10 text-white' : 'text-white/45'
              }`}
            >
              By Module
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2">
          {navView === 'process' ? (
            <>
              <NavSection label="Compliance Journey" />
              <NavItem active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon="step" stepNum="1">
                {t.dashboard}
              </NavItem>
              <NavItem active={activePage === 'understand'} onClick={() => setActivePage('understand')} icon="step" stepNum="✓" completed>
                {t.understand}
              </NavItem>
              <NavItem active={activePage === 'documents'} onClick={() => setActivePage('documents')} icon="step" stepNum="3" badge="4" badgeType="warn">
                {t.documents}
              </NavItem>
              <NavItem active={activePage === 'risks'} onClick={() => setActivePage('risks')} icon="step" stepNum="4" isLocked={true}>
                {t.risks}
              </NavItem>
              <NavItem active={activePage === 'evidence'} onClick={() => setActivePage('evidence')} icon="step" stepNum="5" badge="7">
                {t.evidence}
              </NavItem>
              <NavItem active={activePage === 'findings'} onClick={() => setActivePage('findings')} icon="step" stepNum="6">
                {t.findings}
              </NavItem>
              <NavItem active={activePage === 'audit'} onClick={() => setActivePage('audit')} icon="step" stepNum="7" isLocked={true}>
                {t.audit}
              </NavItem>
              <NavSection label="Intelligence" />
              <NavItem active={activePage === 'integrity'} onClick={() => setActivePage('integrity')} icon="⚠" badge="3" isLocked={true}>
                {t.integrity}
              </NavItem>
              <NavItem active={activePage === 'regfeed'} onClick={() => setActivePage('regfeed')} icon="📢" badge="2" badgeType="warn" isLocked={true}>
                {t.regfeed}
              </NavItem>
            </>
          ) : (
            <>
              <NavSection label="Core Modules" />
              <NavItem active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon="📊">
                {t.dashboard}
              </NavItem>
              <NavItem active={activePage === 'understand'} onClick={() => setActivePage('understand')} icon="🔍">
                {t.gapAnalysis}
              </NavItem>
              <NavItem active={activePage === 'documents'} onClick={() => setActivePage('documents')} icon="📄">
                {t.documentGenerator}
              </NavItem>
              <NavItem active={activePage === 'risks'} onClick={() => setActivePage('risks')} icon="🛡️" isLocked={true}>
                {t.riskMap}
              </NavItem>
              <NavItem active={activePage === 'evidence'} onClick={() => setActivePage('evidence')} icon="📦">
                {t.evidenceCenter}
              </NavItem>
              <NavItem active={activePage === 'findings'} onClick={() => setActivePage('findings')} icon="🔧">
                {t.capaTracker}
              </NavItem>
              <NavItem active={activePage === 'audit'} onClick={() => setActivePage('audit')} icon="🏛️" isLocked={true}>
                {t.auditRoom}
              </NavItem>
              <NavSection label="Intelligence" />
              <NavItem active={activePage === 'integrity'} onClick={() => setActivePage('integrity')} icon="⚠" isLocked={true}>
                {t.integrity}
              </NavItem>
              <NavItem active={activePage === 'regfeed'} onClick={() => setActivePage('regfeed')} icon="📢" isLocked={true}>
                {t.regfeed}
              </NavItem>
              <NavSection label="Regulatory Modules" />
              <NavItem active={activePage === 'dora'} onClick={() => setActivePage('dora')} icon="🏦">
                DORA Module
              </NavItem>
              <NavItem active={activePage === 'euai'} onClick={() => setActivePage('euai')} icon="🤖">
                EU AI Act
              </NavItem>
            </>
          )}
        </nav>

        {/* Settings at bottom */}
        <div className="mt-auto border-t border-white/10">
          <NavSection label={t.settings} />
          <NavItem active={activePage === 'escalation'} onClick={() => setActivePage('escalation')} icon="⚙">
            {t.escalation}
          </NavItem>
          <NavItem active={activePage === 'integrations'} onClick={() => setActivePage('integrations')} icon="🔗">
            {t.integrations}
          </NavItem>
          <NavItem active={activePage === 'settings'} onClick={() => setActivePage('settings')} icon="⚙">
            {t.settings}
          </NavItem>

          <div className="px-6 py-4 flex items-center gap-2.5 cursor-pointer hover:bg-white/5 transition-all">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center text-[13px] font-semibold">
              MK
            </div>
            <div className="text-[12.5px]">
              <div>Max Kellner</div>
              <div className="text-[11px] text-white/40">CISO · WellQ</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[260px] flex-1">
        {/* Top Bar */}
        <header className={`px-8 py-4 border-b transition-colors duration-300 ${darkMode ? 'bg-[#1A1D28] border-[#2A2E3D]' : 'bg-white border-[#E2E5EB]'}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3B0]" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent transition-colors ${
                    darkMode
                      ? 'bg-[#111318] border-[#2A2E3D] text-[#E4E7EE]'
                      : 'bg-[#F7F8FA] border-[#E2E5EB] text-[#1A1D26]'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className={`p-2 rounded-lg transition-colors relative ${darkMode ? 'hover:bg-[#2A2E3D]' : 'hover:bg-gray-100'}`}>
                <Bell className="w-5 h-5 text-[#5F6B7A]" />
                {notifications && <span className="absolute top-1 right-1 w-2 h-2 bg-[#E5484D] rounded-full" />}
              </button>

              <div className={`flex items-center gap-3 pl-4 border-l ${darkMode ? 'border-[#2A2E3D]' : 'border-[#E2E5EB]'}`}>
                <div className="text-right">
                  <div className={`font-medium text-sm ${darkMode ? 'text-[#E4E7EE]' : 'text-[#1A1D26]'}`}>Diego Vera</div>
                  <div className="text-xs text-[#9AA3B0]">{t.administrator}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-semibold">
                  DV
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-[1200px]">
          {activePage === 'dashboard' && <DashboardPage t={t} />}
          {activePage === 'understand' && <UnderstandPage t={t} />}
          {activePage === 'documents' && <DocumentsPage t={t} />}
          {activePage === 'risks' && <RisksPage t={t} />}
          {activePage === 'evidence' && <EvidencePage t={t} />}
          {activePage === 'findings' && <FindingsPage t={t} />}
          {activePage === 'audit' && <AuditPage t={t} />}
          {activePage === 'integrity' && <IntegrityPage t={t} />}
          {activePage === 'regfeed' && <RegFeedPage t={t} />}
          {activePage === 'settings' && (
            <SettingsPage
              t={t}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              language={language}
              setLanguage={setLanguage}
              dateFormat={dateFormat}
              setDateFormat={setDateFormat}
              notifications={notifications}
              setNotifications={setNotifications}
              autoSave={autoSave}
              setAutoSave={setAutoSave}
            />
          )}
        </div>
      </main>

      {/* Dani AI Chat Widget */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-7 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {showChat && (
        <div className={`fixed bottom-[88px] right-7 w-[370px] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden ${darkMode ? 'bg-[#1A1D28]' : 'bg-white'}`}>
          <div className="px-5 py-4 bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] text-white flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Dani AI</div>
              <div className="text-[11px] opacity-75">Online — Compliance Assistant</div>
            </div>
            <button onClick={() => setShowChat(false)} className="opacity-70 hover:opacity-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-4 max-h-[340px] overflow-y-auto space-y-2.5">
            {chatMessages.map((msg) => (
              <ChatBubble key={msg.id} ai={msg.isAi}>
                {msg.text}
              </ChatBubble>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className={`p-3 border-t flex gap-2 ${darkMode ? 'border-[#2A2E3D]' : 'border-[#E2E5EB]'}`}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.chatPlaceholder}
              className={`flex-1 px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4F6EF7] ${
                darkMode
                  ? 'bg-[#111318] border-[#2A2E3D] text-[#E4E7EE]'
                  : 'bg-white border-[#E2E5EB] text-[#1A1D26]'
              }`}
            />
            <button
              onClick={handleSendMessage}
              className="px-3.5 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium hover:bg-[#3D5BE0] transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {t.send}
            </button>
          </div>
        </div>
      )}

      {/* Profile Overlay */}
      {showProfileOverlay && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-[90%] shadow-2xl">
            <h2 className="text-lg font-bold mb-2">Select Organization Profile</h2>
            <p className="text-[13px] text-[#5F6B7A] mb-5">
              Choose your organization's compliance maturity level to personalize recommendations.
            </p>
            <div className="space-y-2.5">
              {(['foundational', 'established', 'advanced', 'mature'] as Profile[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setProfile(p);
                    setShowProfileOverlay(false);
                  }}
                  className={`w-full p-4 border-2 rounded-xl flex items-center gap-3 transition-all hover:border-[#4F6EF7] hover:bg-[#EEF1FE] ${
                    profile === p ? 'border-[#4F6EF7] bg-[#EEF1FE]' : 'border-[#E2E5EB]'
                  }`}
                >
                  <div className="text-2xl">
                    {p === 'foundational' && '🌱'}
                    {p === 'established' && '🏗️'}
                    {p === 'advanced' && '🚀'}
                    {p === 'mature' && '⭐'}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-[13.5px] capitalize">{p}</div>
                    <div className="text-xs text-[#5F6B7A]">
                      {p === 'foundational' && 'Starting compliance journey'}
                      {p === 'established' && 'Basic controls in place'}
                      {p === 'advanced' && 'Mature program with testing'}
                      {p === 'mature' && 'Continuous improvement culture'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowProfileOverlay(false)}
              className="mt-5 w-full py-2.5 border border-[#E2E5EB] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Navigation Components
function NavSection({ label }: { label: string }) {
  return (
    <div className="px-5 pt-[18px] pb-2 text-[10px] uppercase tracking-[1.2px] text-white/30 font-semibold">
      {label}
    </div>
  );
}

interface NavItemProps {
  active?: boolean;
  completed?: boolean;
  onClick: () => void;
  icon: string | 'step';
  stepNum?: string;
  badge?: string;
  badgeType?: 'count' | 'warn';
  isLocked?: boolean;
  children: React.ReactNode;
}

function NavItem({ active, completed, onClick, icon, stepNum, badge, badgeType = 'count', children }: NavItemProps) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-[11px] px-5 py-2 mx-2 my-0.5 rounded-lg text-[13.5px] transition-all ${
          active
            ? 'bg-[#232E4A] text-white font-medium'
            : 'text-white/60 hover:bg-[#1A2340] hover:text-white/85'
        }`}
      >
        {icon === 'step' ? (
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
              completed
                ? 'bg-[#1DB954]'
                : active
                ? 'bg-[#4F6EF7]'
                : 'bg-white/8'
            }`}
          >
            {stepNum}
          </span>
        ) : (
          <span className="w-[18px] text-center text-[15px] flex-shrink-0">{icon}</span>
        )}
        <span className="flex-1 text-left">{children}</span>
        {badge && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              badgeType === 'warn'
                ? 'bg-[#F5A623] text-white'
                : 'bg-[#E5484D] text-white'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    </div>
  );
}

function ChatBubble({ ai, children }: { ai?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
        ai
          ? 'bg-[#EEF1FE] dark:bg-[#1C2340] text-[#1A1D26] dark:text-[#E4E7EE] rounded-bl-sm'
          : 'bg-[#4F6EF7] text-white ml-auto rounded-br-sm'
      }`}
    >
      {children}
    </div>
  );
}

// Page Components
function DashboardPage({ t }: PageProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <h1 className="text-[22px] font-bold -tracking-[0.3px] text-[#1A1D26] dark:text-[#E4E7EE]">
          {t.dashboard} <span className="font-normal text-[#5F6B7A] dark:text-[#9AA3B4] text-sm ml-2">· WellQ Security Program</span>
        </h1>
        <div className="flex gap-2.5">
          <button className="px-4 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] bg-white dark:bg-[#1A1D28] rounded-lg text-[13px] hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-all flex items-center gap-2 text-[#1A1D26] dark:text-[#E4E7EE]">
            ⚙ {t.profile}: Established
          </button>
          <button className="px-4 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] bg-white dark:bg-[#1A1D28] rounded-lg text-[13px] hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-all flex items-center gap-2 text-[#1A1D26] dark:text-[#E4E7EE]">
            📄 {t.exportReport}
          </button>
          <button className="px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium hover:bg-[#3D5BE0] transition-all">
            + {t.addFramework}
          </button>
        </div>
      </div>

      {/* Framework Chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FrameworkChip active mandatory={false}>ISO 27001:2022</FrameworkChip>
        <FrameworkChip active mandatory>DORA</FrameworkChip>
        <FrameworkChip mandatory>GDPR</FrameworkChip>
        <FrameworkChip mandatory={false}>SOC 2 Type II</FrameworkChip>
        <FrameworkChip mandatory>NIS2</FrameworkChip>
        <FrameworkChip dashed>+ Add framework</FrameworkChip>
      </div>

      {/* Health Scores */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <HealthCard
          label={t.overallCompliance}
          value="72"
          color="blue"
          progress={72}
          badge={`🤖 ${t.autoTracked}`}
          badgeType="auto"
          delta={`↑ 4% ${t.fromLastMonth}`}
          deltaUp
        />
        <HealthCard
          label={`📄 ${t.documentation}`}
          value="92"
          color="green"
          progress={92}
          badge={`🤖 ${t.autoTracked}`}
          badgeType="auto"
          delta={`↑ 2% · 3 ${t.docsPending}`}
          deltaUp
        />
        <HealthCard
          label={`🔧 ${t.implementation}`}
          value="78"
          color="yellow"
          progress={78}
          badge={`👁 ${t.reviewNeeded}`}
          badgeType="review"
          delta={`↑ 6% · 8 ${t.controlsUnverified}`}
          deltaUp
        />
        <HealthCard
          label={`🧪 ${t.tested}`}
          value="45"
          color="red"
          progress={45}
          badge={`👤 ${t.humanRequired}`}
          badgeType="human"
          delta={`↓ 2% · 14 ${t.controlsUntested}`}
          deltaUp={false}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2">
          <ComplianceIntegrityCard />
        </div>
        <div>
          <RegulatoryFeedCard />
        </div>
      </div>

      <ControlsTable />

      <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
        <PriorityActionsCard />
        <PreAuditCard />
      </div>

      <HitLLegend />
    </div>
  );
}

interface PageProps {
  t: typeof translations['en'];
}

function UnderstandPage({ t }: PageProps) {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-[#1A1D26] dark:text-[#E4E7EE]">{t.gapAnalysis}</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label={t.totalGaps} value="24" sub={t.acrossFrameworks} />
        <StatCard label={t.criticalGaps} value="6" valueColor="text-[#E5484D]" sub={t.requireAction} />
        <StatCard label={t.gapsClosed} value="18 / 24" valueColor="text-[#1DB954]" sub={`75% ${t.progress}`} />
      </div>
      <Card title={t.gapAnalysis}>
        <p className="text-sm text-[#5F6B7A]">Detailed gap analysis coming soon...</p>
      </Card>
    </div>
  );
}

function DocumentsPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [procedureText, setProcedureText] = useState('');
  const [policyText, setPolicyText] = useState('');

  const steps = [
    { num: 1, title: 'Selección de Controles', shortTitle: 'Controles' },
    { num: 2, title: 'Redacción de Procedimientos', shortTitle: 'Procedimientos' },
    { num: 3, title: 'Política Final', shortTitle: 'Política' },
  ];

  const technicalControls = [
    { id: 'mfa', label: 'Autenticación Multifactor (MFA)', technical: 'A.9.4.2' },
    { id: 'encryption', label: 'Encriptación de Datos en Tránsito y Reposo', technical: 'A.10.1.1' },
    { id: 'logging', label: 'Registro y Monitoreo de Eventos de Seguridad', technical: 'A.12.4.1' },
    { id: 'backup', label: 'Respaldos Automatizados y Recuperación', technical: 'A.12.3.1' },
    { id: 'patching', label: 'Gestión de Vulnerabilidades y Parches', technical: 'A.12.6.1' },
  ];

  const toggleControl = (controlId: string) => {
    setSelectedControls((prev) =>
      prev.includes(controlId)
        ? prev.filter((id) => id !== controlId)
        : [...prev, controlId]
    );
  };

  const handleNextStep = () => {
    if (activeStep === 0 && selectedControls.length > 0) {
      // Avanzar al paso 2 y marcar paso 1 como completado
      setCompletedSteps([...completedSteps, 0]);
      setActiveStep(1);

      // Generar procedimiento automático basado en controles seleccionados
      const selectedLabels = selectedControls.map(id =>
        technicalControls.find(c => c.id === id)?.label
      ).filter(Boolean);

      setProcedureText(`PROCEDIMIENTO OPERATIVO - CONTROLES DE SEGURIDAD

1. ALCANCE
Este procedimiento define las actividades operativas necesarias para implementar y mantener los siguientes controles técnicos:
${selectedLabels.map((label, i) => `${i + 1}. ${label}`).join('\n')}

2. RESPONSABILIDADES
- CISO: Aprobación y supervisión del cumplimiento
- Equipo de Seguridad: Implementación y monitoreo
- Administradores de Sistemas: Ejecución de controles técnicos

3. PROCEDIMIENTOS ESPECÍFICOS
${selectedLabels.map((label, i) => `
3.${i + 1}. ${label}
   - Configuración: [Definir parámetros técnicos]
   - Monitoreo: [Establecer métricas y alertas]
   - Revisión: [Frecuencia de auditoría]
`).join('\n')}

4. REGISTROS Y EVIDENCIAS
Se mantendrán logs de todas las actividades relacionadas con estos controles por un período mínimo de 12 meses.`);
    } else if (activeStep === 1 && procedureText.trim().length > 0) {
      // Avanzar al paso 3 y marcar paso 2 como completado
      setCompletedSteps([...completedSteps, 1]);
      setActiveStep(2);

      // Generar política de alto nivel
      setPolicyText(`POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN

VERSIÓN: 1.0
FECHA: ${new Date().toLocaleDateString('es-ES')}
CLASIFICACIÓN: Interna

1. OBJETIVO
Establecer el marco de gobierno para los controles de seguridad técnica implementados en la organización, garantizando la confidencialidad, integridad y disponibilidad de los activos de información.

2. ALCANCE
Esta política aplica a todos los sistemas, aplicaciones y datos corporativos que requieren protección mediante controles técnicos de seguridad.

3. DECLARACIÓN DE POLÍTICA
La Dirección establece que:
- Todos los controles técnicos deben implementarse según estándares internacionales (ISO 27001)
- Se mantendrá evidencia documental de su efectividad
- El cumplimiento será auditado de forma periódica
- Las desviaciones requerirán aprobación del CISO

4. ROLES Y RESPONSABILIDADES
- Alta Dirección: Aprobar recursos y presupuesto
- CISO: Definir y supervisar la implementación
- Responsables de TI: Ejecutar y mantener controles

5. REVISIÓN
Esta política será revisada anualmente o ante cambios significativos en el entorno de amenazas.

APROBADO POR: [Nombre del CEO/CISO]
FIRMA: _______________
FECHA: ${new Date().toLocaleDateString('es-ES')}`);
    }
  };

  const canProceed = () => {
    if (activeStep === 0) return selectedControls.length >= 2;
    if (activeStep === 1) return procedureText.trim().length > 0;
    return false;
  };

  const isStepCompleted = (stepIndex: number) => completedSteps.includes(stepIndex);
  const isStepLocked = (_stepIndex: number) => false;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D26] dark:text-[#E4E7EE]">
            Bottom-Up Policy Generator
          </h1>
          <p className="text-sm text-[#5F6B7A] dark:text-[#9AA3B0] mt-1">
            Construye tu política de seguridad desde los controles técnicos
          </p>
        </div>
      </div>

      {/* Stepper Horizontal Minimalista */}
      <div className="mb-8 bg-white dark:bg-[#1A1D28] border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-lg p-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1 relative group">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
                    isStepCompleted(index)
                      ? 'bg-[#1DB954] border-[#1DB954] text-white'
                      : index === activeStep
                      ? 'bg-[#4F6EF7] border-[#4F6EF7] text-white shadow-lg shadow-[#4F6EF7]/30'
                      : 'bg-white dark:bg-[#1A1D28] border-[#E2E5EB] dark:border-[#2A2E3D] text-[#5F6B7A]'
                  }`}
                >
                  {isStepCompleted(index) ? '✓' : step.num}
                </div>
                <div className={`mt-3 text-xs font-semibold text-center max-w-[120px] ${
                  isStepCompleted(index)
                    ? 'text-[#1DB954]'
                    : index === activeStep
                    ? 'text-[#4F6EF7]'
                    : 'text-[#5F6B7A] dark:text-[#9AA3B0]'
                }`}>
                  {step.shortTitle}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-[2px] flex-1 mx-4 transition-all ${
                  isStepCompleted(index)
                    ? 'bg-[#1DB954]'
                    : index < activeStep
                    ? 'bg-[#4F6EF7]'
                    : 'bg-[#E2E5EB] dark:bg-[#2A2E3D]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenido del Paso Activo */}
      {activeStep === 0 && (
        <Card title="Paso 1: Selección de Controles Técnicos">
          <div className="space-y-3">
            <p className="text-sm text-[#5F6B7A] dark:text-[#9AA3B0] mb-4">
              Selecciona al menos 2 controles técnicos implementados en tu organización:
            </p>
            {technicalControls.map((control) => (
              <label
                key={control.id}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedControls.includes(control.id)
                    ? 'border-[#4F6EF7] bg-[#4F6EF7]/5'
                    : 'border-[#E2E5EB] dark:border-[#2A2E3D] hover:border-[#4F6EF7]/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedControls.includes(control.id)}
                  onChange={() => toggleControl(control.id)}
                  className="w-5 h-5 rounded border-[#E2E5EB] dark:border-[#2A2E3D] text-[#4F6EF7] focus:ring-[#4F6EF7]"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#1A1D26] dark:text-[#E4E7EE]">{control.label}</div>
                  <div className="text-xs text-[#9AA3B0] mt-0.5">ISO 27001: {control.technical}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-[#5F6B7A] dark:text-[#9AA3B0]">
              {selectedControls.length} de {technicalControls.length} controles seleccionados
            </div>
            <button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="px-8 py-3 bg-[#4F6EF7] text-white rounded-lg text-sm font-semibold hover:bg-[#3D5BE0] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
            >
              Validar y Generar Siguiente Fase →
            </button>
          </div>
        </Card>
      )}

      {activeStep === 1 && (
        <Card title="Paso 2: Redacción de Procedimientos Operativos">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="px-2 py-1 bg-[#1DB954]/10 text-[#1DB954] rounded text-xs font-semibold">
                ✓ Controles Validados: {selectedControls.length}
              </div>
              <div className="text-[#5F6B7A] dark:text-[#9AA3B0]">
                Procedimiento generado automáticamente por DANI IA
              </div>
            </div>
            <textarea
              value={procedureText}
              onChange={(e) => setProcedureText(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent transition-colors resize-none bg-[#F7F8FA] dark:bg-[#111318] border-[#E2E5EB] dark:border-[#2A2E3D] text-[#1A1D26] dark:text-[#E4E7EE]"
              placeholder="El procedimiento operativo se generará automáticamente..."
            />
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => {
                setActiveStep(0);
                setCompletedSteps(completedSteps.filter(s => s !== 0));
              }}
              className="px-4 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-lg text-sm hover:border-[#4F6EF7] transition-all text-[#5F6B7A] dark:text-[#9AA3B0]"
            >
              ← Volver
            </button>
            <button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="px-8 py-3 bg-[#4F6EF7] text-white rounded-lg text-sm font-semibold hover:bg-[#3D5BE0] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
            >
              Validar y Generar Siguiente Fase →
            </button>
          </div>
        </Card>
      )}

      {activeStep === 2 && (
        <Card title="Paso 3: Política Ejecutiva Final">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="px-2 py-1 bg-[#1DB954]/10 text-[#1DB954] rounded text-xs font-semibold">
                ✓ Procedimientos Completados
              </div>
              <div className="text-[#5F6B7A] dark:text-[#9AA3B0]">
                Política de alto nivel lista para aprobación ejecutiva
              </div>
            </div>
            <textarea
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent transition-colors resize-none bg-[#F7F8FA] dark:bg-[#111318] border-[#E2E5EB] dark:border-[#2A2E3D] text-[#1A1D26] dark:text-[#E4E7EE]"
              placeholder="La política ejecutiva se generará automáticamente..."
            />
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => {
                setActiveStep(1);
                setCompletedSteps(completedSteps.filter(s => s !== 1));
              }}
              className="px-4 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-lg text-sm hover:border-[#4F6EF7] transition-all text-[#5F6B7A] dark:text-[#9AA3B0]"
            >
              ← Volver
            </button>
            <button
              className="px-8 py-3 bg-[#1DB954] text-white rounded-lg text-sm font-semibold hover:bg-[#1AA34A] transition-all shadow-lg"
            >
              ✓ Finalizar y Exportar Política
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

function RisksPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Risk Map</h1>
        <button className="px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium">
          + Add Risk
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Risks" value="24" sub="Across 4 categories" />
        <StatCard label="High / Critical" value="6" valueColor="text-[#E5484D]" sub="3 need immediate treatment" />
        <StatCard label="With Treatment Plans" value="18 / 24" valueColor="text-[#1DB954]" sub="75% coverage" />
      </div>
      <Card title="🛡 Risk Register">
        <p className="text-sm text-[#5F6B7A]">Risk management interface coming soon...</p>
      </Card>
    </div>
  );
}

function EvidencePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Evidence Center</h1>
        <button className="px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium">
          + Upload Evidence
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Evidence Items" value="142" sub="Across 93 controls" />
        <StatCard label="Auto-Collected" value="87" valueColor="text-[#1DB954]" sub="From AWS, Azure, Okta" />
        <StatCard label="Effectiveness Evidence" value="12" valueColor="text-[#E5484D]" sub="Pen tests, drills" />
      </div>
      <Card title="📦 Evidence by Type">
        <p className="text-sm text-[#5F6B7A]">Evidence tracking interface coming soon...</p>
      </Card>
    </div>
  );
}

function FindingsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">CAPA Tracker</h1>
        <button className="px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium">
          + New CAPA
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Open CAPAs" value="8" valueColor="text-[#E5484D]" sub="3 overdue" />
        <StatCard label="Avg. Resolution Time" value="32 days" sub="Target: 30 days" />
        <StatCard label="Closed This Quarter" value="14" valueColor="text-[#1DB954]" sub="vs. 11 last quarter" />
      </div>
      <Card title="🔧 Open Corrective Actions">
        <CAPATable />
      </Card>
    </div>
  );
}

function IntegrityPage({ t }: PageProps) {
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6 text-[#1A1D26] dark:text-[#E4E7EE]">{t.integrity}</h1>
      <Card title="⚠ Active Alerts" titleColor="text-[#E5484D]" borderColor="border-l-4 border-l-[#E5484D]">
        <div className="space-y-2.5">
          <ComplianceAlert
            severity="high"
            title="12 controls marked 'Implemented' have no effectiveness test in last 12 months"
            meta="Affects: A.5.24, A.8.13, A.5.15 + 9 more · Severity: High"
            expanded={expandedAlert === 0}
            onToggle={() => setExpandedAlert(expandedAlert === 0 ? null : 0)}
          >
            <div className="space-y-2 text-xs">
              <DetailRow label="Affected Controls" value="A.5.24, A.8.13, A.5.15, A.5.29, A.8.9, A.8.1" />
              <DetailRow label="Last Test" value="None in last 12 months" valueColor="text-[#E5484D]" />
              <DetailRow label="Risk Level" value="High — Audit finding likely" valueColor="text-[#E5484D]" />
              <div className="flex gap-2 pt-2 border-t border-[#E2E5EB] dark:border-[#2A2E3D]">
                <button className="px-3 py-1.5 bg-[#4F6EF7] text-white rounded text-xs font-medium hover:bg-[#3D5BE0] transition-colors">Schedule Tests</button>
                <button className="px-3 py-1.5 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded text-xs text-[#1A1D26] dark:text-[#E4E7EE] hover:bg-gray-100 dark:hover:bg-[#2A2E3D] transition-colors">Assign to Team</button>
              </div>
            </div>
          </ComplianceAlert>

          <ComplianceAlert
            severity="high"
            title="Access control policy approved 14 months ago — no quarterly access review occurring"
            meta="Control: A.5.15 · Expected: Q4 2025 review · Severity: High"
            expanded={expandedAlert === 1}
            onToggle={() => setExpandedAlert(expandedAlert === 1 ? null : 1)}
          >
            <div className="space-y-2 text-xs">
              <DetailRow label="Control" value="A.5.15 — Access Control" />
              <DetailRow label="Policy Approved" value="Jan 15, 2025 (14 months ago)" />
              <DetailRow label="Reviews Completed" value="0 of 4 expected" valueColor="text-[#E5484D]" />
              <div className="flex gap-2 pt-2 border-t border-[#E2E5EB] dark:border-[#2A2E3D]">
                <button className="px-3 py-1.5 bg-[#4F6EF7] text-white rounded text-xs font-medium hover:bg-[#3D5BE0] transition-colors">Start Access Review</button>
                <button className="px-3 py-1.5 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded text-xs text-[#1A1D26] dark:text-[#E4E7EE] hover:bg-gray-100 dark:hover:bg-[#2A2E3D] transition-colors">View Policy</button>
              </div>
            </div>
          </ComplianceAlert>

          <ComplianceAlert
            severity="medium"
            title="Overall score is 72% but 0% of critical controls tested under real conditions"
            meta="Critical controls: A.5.24, A.8.13 · Severity: Medium"
            expanded={expandedAlert === 2}
            onToggle={() => setExpandedAlert(expandedAlert === 2 ? null : 2)}
          >
            <div className="space-y-2 text-xs">
              <DetailRow label="Overall Health Score" value="72%" />
              <DetailRow label="Critical Controls Tested" value="0%" valueColor="text-[#E5484D]" />
              <div className="flex gap-2 pt-2 border-t border-[#E2E5EB] dark:border-[#2A2E3D]">
                <button className="px-3 py-1.5 bg-[#4F6EF7] text-white rounded text-xs font-medium hover:bg-[#3D5BE0] transition-colors">Plan Testing Sprint</button>
              </div>
            </div>
          </ComplianceAlert>
        </div>
      </Card>
    </div>
  );
}

function RegFeedPage({ t }: PageProps) {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6 text-[#1A1D26] dark:text-[#E4E7EE]">{t.regfeed}</h1>
      <Card title="📢 Latest Updates">
        <div className="space-y-4">
          <RegItem
            icon="🕐"
            iconBg="bg-[#FEECEE]"
            iconColor="text-[#E5484D]"
            title="DORA TLPT deadline"
            description="Significant entities must complete first round by Q2 2026."
            date="Deadline: Jun 30, 2026 · 92 days left"
          />
          <RegItem
            icon="📋"
            iconBg="bg-[#EEF1FE]"
            iconColor="text-[#4F6EF7]"
            title="NIS2 transposition update"
            description="Spain published national transposition with sector-specific annexes."
            date="Published: Mar 14, 2026 · Affects your profile"
          />
          <RegItem
            icon="✓"
            iconBg="bg-[#E8F9EF]"
            iconColor="text-[#1DB954]"
            title="ISO 27001:2022"
            description="No changes. Next review cycle: 2028."
            date="Status: Current · No action needed"
          />
        </div>
      </Card>
    </div>
  );
}

interface SettingsPageProps {
  t: typeof translations['en'];
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  language: Language;
  setLanguage: (v: Language) => void;
  dateFormat: DateFormat;
  setDateFormat: (v: DateFormat) => void;
  notifications: boolean;
  setNotifications: (v: boolean) => void;
  autoSave: boolean;
  setAutoSave: (v: boolean) => void;
}

function SettingsPage({
  t,
  darkMode,
  setDarkMode,
  language,
  setLanguage,
  dateFormat,
  setDateFormat,
  notifications,
  setNotifications,
  autoSave,
  setAutoSave,
}: SettingsPageProps) {
  const [selectedAccount, setSelectedAccount] = useState('diego');
  const [selectedPlan, setSelectedPlan] = useState<'basico' | 'pro' | 'enterprise'>('enterprise');

  const accounts = [
    { id: 'diego', name: 'Diego Vera', role: 'CISO', company: 'SecureBank SA', plan: 'enterprise' as const },
    { id: 'camilo', name: 'Camilo Valenzuela', role: 'Security Manager', company: 'FinTech Corp', plan: 'enterprise' as const },
    { id: 'angelo', name: 'Angelo González', role: 'Compliance Lead', company: 'DataProtect Inc', plan: 'enterprise' as const },
    { id: 'nicolas', name: 'Nicolás Rosales', role: 'CTO', company: 'TechSolutions', plan: 'enterprise' as const },
  ];

  const languageNames = {
    en: 'English',
    es: 'Español',
    pt: 'Português',
    de: 'Deutsch',
    fr: 'Français',
  };

  const dateFormatNames = {
    dmy: 'DD/MM/YYYY',
    mdy: 'MM/DD/YYYY',
    ymd: 'YYYY-MM-DD',
  };

  // Actualizar el plan cuando cambia la cuenta
  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setSelectedPlan(account.plan);
    }
  };

  const currentAccount = accounts.find(a => a.id === selectedAccount);

  const plans = [
    {
      id: 'basico' as const,
      name: 'Básico',
      price: '$49',
      period: '/mes',
      description: 'Para equipos pequeños comenzando con compliance',
      features: [
        'Hasta 3 usuarios',
        'Gap Analysis básico',
        'Generación de documentos',
        'Soporte por email',
        '50 controles máximo',
      ],
      locked: ['Auditoría IA', 'Risk Map'],
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: '$199',
      period: '/mes',
      description: 'Para organizaciones en crecimiento',
      features: [
        'Usuarios ilimitados',
        'Auditoría IA completa',
        'Risk Map avanzado',
        'Integraciones premium',
        'Soporte prioritario 24/7',
        'Controles ilimitados',
      ],
      locked: [],
      popular: true,
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: 'Personalizado',
      period: '',
      description: 'Para grandes empresas con necesidades complejas',
      features: [
        'Todo de Pro incluido',
        'SSO y SAML',
        'Account manager dedicado',
        'SLA personalizado',
        'Onboarding guiado',
        'Auditorías on-premise',
      ],
      locked: [],
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6 text-[#1A1D26] dark:text-[#E4E7EE]">{t.settings}</h1>

      {/* Sección de Suscripción */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-[#1A1D26] dark:text-[#E4E7EE]">💳 Gestión de Suscripción</h2>

        {/* Selector de Cuenta */}
        <div className="mb-6 bg-white dark:bg-[#1A1D28] border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-xl p-6">
          <label className="block text-sm font-semibold mb-3 text-[#1A1D26] dark:text-[#E4E7EE]">
            👤 Seleccionar Cuenta
          </label>
          <div className="grid grid-cols-2 gap-3">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleAccountChange(account.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedAccount === account.id
                    ? 'border-[#4F6EF7] bg-[#4F6EF7]/5 dark:bg-[#4F6EF7]/10'
                    : 'border-[#E2E5EB] dark:border-[#2A2E3D] hover:border-[#4F6EF7]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm">
                    {account.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">
                      {account.name}
                    </div>
                    <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B0]">
                      {account.role} · {account.company}
                    </div>
                    <div className="mt-1 inline-block px-2 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-semibold rounded">
                      Plan Personalizado
                    </div>
                  </div>
                  {selectedAccount === account.id && (
                    <div className="w-5 h-5 rounded-full bg-[#4F6EF7] flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {currentAccount && (
            <div className="mt-4 p-3 bg-[#4F6EF7]/5 dark:bg-[#4F6EF7]/10 rounded-lg border border-[#4F6EF7]/20">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#4F6EF7]">ℹ</span>
                <span className="text-[#1A1D26] dark:text-[#E4E7EE]">
                  Actualmente viendo como: <strong>{currentAccount.name}</strong> con acceso completo a todas las funcionalidades
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Comparativa de Planes */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-xl p-6 transition-all cursor-pointer ${
                selectedPlan === plan.id
                  ? 'border-[#4F6EF7] bg-[#4F6EF7]/5 dark:bg-[#4F6EF7]/10'
                  : 'border-[#E2E5EB] dark:border-[#2A2E3D] hover:border-[#4F6EF7]/50'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#4F6EF7] text-white text-xs font-semibold rounded-full">
                  Más Popular
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-[#1A1D26] dark:text-[#E4E7EE] mb-1">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-[#1A1D26] dark:text-[#E4E7EE]">{plan.price}</span>
                  <span className="text-sm text-[#5F6B7A] dark:text-[#9AA3B0]">{plan.period}</span>
                </div>
                <p className="text-xs text-[#5F6B7A] dark:text-[#9AA3B0] mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-[#1DB954] mt-0.5">✓</span>
                    <span className="text-[#1A1D26] dark:text-[#E4E7EE]">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-[#4F6EF7] text-white'
                    : 'bg-white dark:bg-[#1A1D28] border border-[#E2E5EB] dark:border-[#2A2E3D] text-[#1A1D26] dark:text-[#E4E7EE] hover:border-[#4F6EF7]'
                }`}
              >
                {selectedPlan === plan.id ? 'Plan Actual' : 'Seleccionar Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Preview */}
        <div className="bg-white dark:bg-[#1A1D28] border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">
              Vista Previa: Módulos Disponibles con Plan {plans.find(p => p.id === selectedPlan)?.name}
            </h3>
            {selectedPlan === 'enterprise' && (
              <div className="px-3 py-1 bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-semibold rounded-full">
                🔓 Acceso Total
              </div>
            )}
          </div>

          <div className="bg-[#0F1729] rounded-lg p-4 max-w-xs">
            <div className="text-[10px] uppercase tracking-[1.2px] text-white/30 font-semibold mb-3">
              Módulos Principales
            </div>

            <div className="space-y-1">
              <SidebarPreviewItem
                label="Dashboard"
                icon="📊"
                locked={false}
                active={false}
                selectedPlan={selectedPlan}
              />
              <SidebarPreviewItem
                label="Gap Analysis"
                icon="🔍"
                locked={false}
                active={false}
                selectedPlan={selectedPlan}
              />
              <SidebarPreviewItem
                label="Risk Map"
                icon="🛡️"
                locked={selectedPlan === 'basico'}
                active={selectedPlan === 'pro' || selectedPlan === 'enterprise'}
                selectedPlan={selectedPlan}
              />
              <SidebarPreviewItem
                label="Auditoría IA"
                icon="🤖"
                locked={selectedPlan === 'basico'}
                active={selectedPlan === 'pro' || selectedPlan === 'enterprise'}
                selectedPlan={selectedPlan}
              />
              <SidebarPreviewItem
                label="Evidence Center"
                icon="📦"
                locked={false}
                active={false}
                selectedPlan={selectedPlan}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resto de configuraciones existentes */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card title={`🌐 ${t.languageRegion}`}>
          <div className="space-y-4">
            <SettingRow
              label={t.interfaceLanguage}
              sub={t.controlsUI}
            >
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="px-3 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] dark:text-[#E4E7EE] text-[#1A1D26] w-[160px] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-[#4F6EF7] cursor-pointer"
                style={{ appearance: 'auto' }}
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </SettingRow>
            <SettingRow label="Date Format" sub="How dates are displayed">
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                className="px-3 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] text-[#1A1D26] dark:text-[#E4E7EE] w-[160px] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-[#4F6EF7] cursor-pointer"
                style={{ appearance: 'auto' }}
              >
                {Object.entries(dateFormatNames).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </SettingRow>
            <SettingRow label="Timezone" sub="Your local timezone">
              <select className="px-3 py-1.5 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] dark:text-[#E4E7EE] min-w-[140px] focus:outline-none focus:ring-1 focus:ring-[#4F6EF7]">
                <option>UTC</option>
                <option>Europe/Madrid</option>
                <option>America/New_York</option>
                <option>America/Sao_Paulo</option>
                <option>Europe/Berlin</option>
              </select>
            </SettingRow>
          </div>
        </Card>

        <Card title="🎨 Appearance">
          <div className="space-y-4">
            <SettingRow label="Dark Mode" sub="Toggle dark theme">
              <Toggle value={darkMode} onChange={setDarkMode} />
            </SettingRow>
            <SettingRow label="Compact View" sub="Reduce spacing in tables">
              <Toggle value={false} onChange={() => {}} />
            </SettingRow>
            <SettingRow label="Show Sidebar Labels" sub="Display text in navigation">
              <Toggle value={true} onChange={() => {}} />
            </SettingRow>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="🔔 Notifications">
          <div className="space-y-4">
            <SettingRow label="Email Notifications" sub="Receive compliance alerts via email">
              <Toggle value={notifications} onChange={setNotifications} />
            </SettingRow>
            <SettingRow label="CAPA Reminders" sub="Notifications for overdue CAPAs">
              <Toggle value={true} onChange={() => {}} />
            </SettingRow>
            <SettingRow label="Regulatory Updates" sub="Alert on new regulatory changes">
              <Toggle value={true} onChange={() => {}} />
            </SettingRow>
            <SettingRow label="Audit Deadlines" sub="Reminders before audit dates">
              <Toggle value={true} onChange={() => {}} />
            </SettingRow>
          </div>
        </Card>

        <Card title="⚙️ System">
          <div className="space-y-4">
            <SettingRow label="Auto-Save" sub="Automatically save changes">
              <Toggle value={autoSave} onChange={setAutoSave} />
            </SettingRow>
            <SettingRow label="Offline Mode" sub="Enable offline access to data">
              <Toggle value={false} onChange={() => {}} />
            </SettingRow>
            <SettingRow label="Data Export Format" sub="Default format for reports">
              <select className="px-3 py-1.5 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] dark:text-[#E4E7EE] min-w-[140px] focus:outline-none focus:ring-1 focus:ring-[#4F6EF7]">
                <option>PDF</option>
                <option>Excel (XLSX)</option>
                <option>CSV</option>
                <option>JSON</option>
              </select>
            </SettingRow>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Utility Components
function FrameworkChip({ active, mandatory, dashed, children }: { active?: boolean; mandatory?: boolean; dashed?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
        dashed
          ? 'border border-dashed border-[#9AA3B0] text-[#9AA3B0]'
          : active
          ? 'border border-[#4F6EF7] bg-[#EEF1FE] text-[#4F6EF7]'
          : 'border border-[#E2E5EB] bg-white text-[#5F6B7A] hover:border-[#4F6EF7]'
      }`}
    >
      {!dashed && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${mandatory ? 'bg-[#E5484D]' : 'bg-[#1DB954]'}`} />
      )}
      {children}
    </div>
  );
}

interface HealthCardProps {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
  progress: number;
  badge?: string;
  badgeType?: 'auto' | 'review' | 'human';
  delta: string;
  deltaUp: boolean;
}

function HealthCard({ label, value, color, progress, badge, badgeType, delta, deltaUp }: HealthCardProps) {
  const colors = {
    blue: { text: 'text-[#4F6EF7] dark:text-[#6B8AFF]', bg: 'bg-gradient-to-r from-[#4F6EF7] to-[#818CF8]' },
    green: { text: 'text-[#1DB954] dark:text-[#34D969]', bg: 'bg-gradient-to-r from-[#1DB954] to-[#4ADE80]' },
    yellow: { text: 'text-[#F5A623] dark:text-[#F5B740]', bg: 'bg-gradient-to-r from-[#F5A623] to-[#FBBF24]' },
    red: { text: 'text-[#E5484D] dark:text-[#F06669]', bg: 'bg-gradient-to-r from-[#E5484D] to-[#F87171]' },
  };

  const badgeColors = {
    auto: 'bg-[#E8F4FD] dark:bg-[#132838] text-[#1B8BD1] dark:text-[#5CB8F0]',
    review: 'bg-[#FFF7E6] dark:bg-[#2A2210] text-[#B47A14] dark:text-[#F5B740]',
    human: 'bg-[#FEECEE] dark:bg-[#2A1214] text-[#E5484D] dark:text-[#F06669]',
  };

  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] p-5 shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] relative transition-colors">
      {badge && badgeType && (
        <div className={`absolute top-3 right-3 text-[10px] px-2 py-1 rounded font-semibold ${badgeColors[badgeType]}`}>
          {badge}
        </div>
      )}
      <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B4] font-medium mb-2">{label}</div>
      <div className={`text-[32px] font-bold -tracking-[1px] ${colors[color].text}`}>
        {value}<span className="text-lg font-normal">%</span>
      </div>
      <div className="h-1.5 bg-[#E2E5EB] dark:bg-[#2A2E3D] rounded-full overflow-hidden mt-3 mb-1.5">
        <div className={`h-full ${colors[color].bg} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
      </div>
      <div className={`text-[11px] font-medium ${deltaUp ? 'text-[#1DB954] dark:text-[#34D969]' : 'text-[#E5484D] dark:text-[#F06669]'}`}>
        {delta}
      </div>
    </div>
  );
}

function ComplianceIntegrityCard() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] border-l-4 border-l-[#E5484D] overflow-hidden transition-colors">
      <div className="px-5 py-4 border-b border-[#E2E5EB] dark:border-[#2A2E3D] bg-[#FEECEE]/30 dark:bg-[#2A1214]/30">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#E5484D] dark:text-[#F06669]">⚠ Compliance Integrity Alerts</h3>
          <button className="text-xs text-[#4F6EF7] dark:text-[#6B8AFF] font-medium hover:underline">View all 6 alerts →</button>
        </div>
      </div>
      <div className="p-5 space-y-2.5">
        <ComplianceAlert
          severity="high"
          title="12 controls marked 'Implemented' have no effectiveness test in last 12 months"
          meta="Affects: A.5.24, A.8.13, A.5.15 + 9 more · Severity: High"
          expanded={expanded === 0}
          onToggle={() => setExpanded(expanded === 0 ? null : 0)}
        />
        <ComplianceAlert
          severity="high"
          title="Access control policy approved 14 months ago — no evidence of quarterly access review"
          meta="Control: A.5.15 · Expected: Q4 2025 review · Severity: High"
          expanded={expanded === 1}
          onToggle={() => setExpanded(expanded === 1 ? null : 1)}
        />
        <ComplianceAlert
          severity="medium"
          title="Overall score is 72% but 0% of critical controls have been tested under real conditions"
          meta="Critical controls: A.5.24, A.8.13 · Severity: Medium"
          expanded={expanded === 2}
          onToggle={() => setExpanded(expanded === 2 ? null : 2)}
        />
      </div>
    </div>
  );
}

function ComplianceAlert({ severity, title, meta, expanded, onToggle, children }: {
  severity: 'high' | 'medium';
  title: string;
  meta: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="p-3.5 rounded-lg bg-[#FAFAFA] dark:bg-[#1E2030] border border-[#E2E5EB] dark:border-[#2A2E3D] cursor-pointer hover:border-[#E5484D] transition-all"
      onClick={onToggle}
    >
      <div className="flex gap-2.5 items-start">
        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severity === 'high' ? 'bg-[#E5484D]' : 'bg-[#F5A623]'}`} />
        <div className="flex-1">
          <div className="text-[12.5px] font-medium leading-relaxed text-[#1A1D26] dark:text-[#E4E7EE]">{title}</div>
          <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] mt-1">{meta}</div>
          {expanded && children && (
            <div className="mt-3 pt-3 border-t border-[#E2E5EB] dark:border-[#2A2E3D]">
              {children}
            </div>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#9AA3B0] dark:text-[#646D7D] transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </div>
    </div>
  );
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-[#9AA3B0] dark:text-[#646D7D] font-medium">{label}</span>
      <span className={`font-semibold ${valueColor || 'text-[#1A1D26] dark:text-[#E4E7EE]'}`}>{value}</span>
    </div>
  );
}

function RegulatoryFeedCard() {
  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] overflow-hidden transition-colors">
      <div className="px-5 py-4 border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">📢 Regulatory Feed</h3>
          <button className="text-xs text-[#4F6EF7] dark:text-[#6B8AFF] font-medium hover:underline">View all →</button>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <RegItem
          icon="🕐"
          iconBg="bg-[#FEECEE]"
          iconColor="text-[#E5484D]"
          title="DORA TLPT deadline"
          description="Significant entities must complete first round by Q2 2026."
          date="Deadline: Jun 30, 2026 · 92 days left"
        />
        <RegItem
          icon="📋"
          iconBg="bg-[#EEF1FE]"
          iconColor="text-[#4F6EF7]"
          title="NIS2 transposition update"
          description="Spain published national transposition."
          date="Published: Mar 14, 2026"
        />
        <RegItem
          icon="✓"
          iconBg="bg-[#E8F9EF]"
          iconColor="text-[#1DB954]"
          title="ISO 27001:2022"
          description="No changes. Next review: 2028."
          date="Status: Current"
        />
      </div>
    </div>
  );
}

function RegItem({ icon, iconBg, iconColor, title, description, date }: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  date: string;
}) {
  return (
    <div className="flex gap-3 pb-3 border-b border-[#F3F4F6] dark:border-[#252838] last:border-0 last:pb-0">
      <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center text-sm flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[12.5px] leading-relaxed text-[#1A1D26] dark:text-[#E4E7EE]">
          <strong className="font-semibold">{title}</strong> — {description}
        </div>
        <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] mt-0.5">{date}</div>
      </div>
    </div>
  );
}

function ControlsTable() {
  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] overflow-hidden mb-6 transition-colors">
      <div className="px-5 py-4 border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">🎯 Control Status — Cross-Framework View</h3>
          <button className="text-xs text-[#4F6EF7] dark:text-[#6B8AFF] font-medium hover:underline">View SOA →</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Control</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Description</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Documented</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Implemented</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Tested</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Frameworks</th>
            </tr>
          </thead>
          <tbody>
            <ControlRow
              id="A.5.15"
              desc="Access control"
              doc="done"
              impl="partial"
              tested="overdue"
              frameworks={['ISO', 'DORA', 'NIS2']}
            />
            <ControlRow
              id="A.5.24"
              desc="Incident management"
              doc="done"
              impl="done"
              tested="not-tested"
              frameworks={['ISO', 'DORA']}
            />
            <ControlRow
              id="A.8.13"
              desc="Information backup"
              doc="done"
              impl="done"
              tested="scheduled"
              frameworks={['ISO', 'DORA']}
            />
            <ControlRow
              id="A.8.24"
              desc="Use of cryptography"
              doc="done"
              impl="done"
              tested="passed"
              frameworks={['ISO', 'PCI', 'DORA']}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ControlRow({ id, desc, doc, impl, tested, frameworks }: {
  id: string;
  desc: string;
  doc: string;
  impl: string;
  tested: string;
  frameworks: string[];
}) {
  return (
    <tr className="border-b border-[#F3F4F6] dark:border-[#252838] hover:bg-[#FAFBFC] dark:hover:bg-[#1E2130]">
      <td className="px-5 py-3 font-semibold text-[#4F6EF7] dark:text-[#6B8AFF]">{id}</td>
      <td className="px-5 py-3 text-[#1A1D26] dark:text-[#E4E7EE]">{desc}</td>
      <td className="px-5 py-3"><StatusDot status={doc} /></td>
      <td className="px-5 py-3"><StatusDot status={impl} /></td>
      <td className="px-5 py-3"><StatusDot status={tested} /></td>
      <td className="px-5 py-3">
        <div className="flex gap-1">
          {frameworks.map((fw) => (
            <span key={fw} className="px-1.5 py-0.5 text-[10px] font-medium bg-[#EEF1FE] dark:bg-[#1C2340] text-[#5F6B7A] dark:text-[#9AA3B4] rounded">
              {fw}
            </span>
          ))}
        </div>
      </td>
    </tr>
  );
}

function StatusDot({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; dot: string }> = {
    done: { label: 'Done', color: 'text-[#1DB954]', dot: 'bg-[#1DB954]' },
    partial: { label: 'Partial', color: 'text-[#F5A623]', dot: 'bg-[#F5A623]' },
    overdue: { label: 'Overdue', color: 'text-[#E5484D]', dot: 'bg-[#E5484D]' },
    'not-tested': { label: 'Not tested', color: 'text-[#E5484D]', dot: 'bg-[#E5484D]' },
    scheduled: { label: 'Scheduled', color: 'text-[#F5A623]', dot: 'bg-[#F5A623]' },
    passed: { label: 'Passed', color: 'text-[#1DB954]', dot: 'bg-[#1DB954]' },
  };

  const c = config[status] || config.done;

  return (
    <span className={`flex items-center gap-1.5 text-[11.5px] font-medium ${c.color}`}>
      <span className={`w-[7px] h-[7px] rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function PriorityActionsCard() {
  return (
    <Card title="📋 Priority Actions">
      <div className="space-y-3">
        <ActionItem
          priority="high"
          text="Schedule penetration test for critical controls (A.5.24, A.8.13)"
          sub="Effectiveness testing · Due: Apr 15, 2026"
        />
        <ActionItem
          priority="high"
          text="Complete quarterly access review for A.5.15"
          sub="14 months since last review · Compliance integrity alert"
        />
        <ActionItem
          priority="medium"
          text="Resolve open CAPA NC-2024-015 (cloud configuration)"
          sub="Open 45 days · Contradicts auto-collected evidence"
        />
        <ActionItem
          priority="low"
          text="Connect Azure AD for automated evidence collection"
          sub="Integration · Reduces manual effort by ~30%"
        />
      </div>
    </Card>
  );
}

function ActionItem({ priority, text, sub }: { priority: 'high' | 'medium' | 'low'; text: string; sub: string }) {
  const colors = {
    high: 'bg-[#E5484D]',
    medium: 'bg-[#F5A623]',
    low: 'bg-[#1DB954]',
  };

  return (
    <div className="flex items-center gap-3 pb-3 border-b border-[#F3F4F6] dark:border-[#252838] last:border-0 last:pb-0">
      <div className={`w-1 h-8 rounded ${colors[priority]} flex-shrink-0`} />
      <div className="flex-1">
        <div className="text-[12.5px] leading-snug text-[#1A1D26] dark:text-[#E4E7EE]">{text}</div>
        <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function PreAuditCard() {
  return (
    <Card title="🏛 Pre-Audit Self-Assessment">
      <div className="text-center py-3 mb-4">
        <div className="text-[11px] uppercase tracking-wide text-[#9AA3B0] mb-2">Estimated Audit Readiness</div>
        <div className="text-[44px] font-bold text-[#F5A623]">
          68<span className="text-xl">%</span>
        </div>
        <div className="text-xs text-[#5F6B7A] mt-1">3 high-risk non-conformity areas detected</div>
      </div>
      <div className="pt-3.5 border-t border-[#E2E5EB]">
        <div className="text-[11px] font-semibold uppercase text-[#9AA3B0] tracking-wide mb-2.5">
          Likely Audit Findings
        </div>
        <div className="space-y-2">
          <FindingItem color="bg-[#E5484D]" text="Access management — evidence expired" />
          <FindingItem color="bg-[#E5484D]" text="Business continuity — no recovery test in 2025" />
          <FindingItem color="bg-[#E5484D]" text="Incident management — CAPA open 45+ days" />
          <FindingItem color="bg-[#F5A623]" text="Cryptography policy — draft not yet approved" />
        </div>
      </div>
    </Card>
  );
}

function FindingItem({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
      <span className="text-[12.5px] text-[#1A1D26] dark:text-[#E4E7EE]">{text}</span>
    </div>
  );
}

function HitLLegend() {
  return (
    <div className="mt-2 px-5 py-3.5 bg-white dark:bg-[#1A1D28] rounded-[10px] border border-[#E2E5EB] dark:border-[#2A2E3D] shadow-sm flex gap-6 items-center flex-wrap text-xs text-[#5F6B7A] dark:text-[#9AA3B4] transition-colors">
      <strong className="text-[11px] uppercase tracking-wide text-[#1A1D26] dark:text-[#E4E7EE]">Decision Level Legend:</strong>
      <span className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 bg-[#E8F4FD] text-[#1B8BD1] rounded text-[10px] font-semibold">🤖 Auto</span>
        System executes without intervention
      </span>
      <span className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 bg-[#FFF7E6] text-[#B47A14] rounded text-[10px] font-semibold">👁 Review</span>
        AI proposes, human validates
      </span>
      <span className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 bg-[#FEECEE] text-[#E5484D] rounded text-[10px] font-semibold">👤 Human</span>
        Requires human decision
      </span>
    </div>
  );
}

function StatCard({ label, value, valueColor, sub }: { label: string; value: string; valueColor?: string; sub: string }) {
  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] p-[18px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] transition-colors">
      <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] uppercase tracking-wide mb-1.5">{label}</div>
      <div className={`text-[28px] font-bold ${valueColor || 'text-[#1A1D26] dark:text-[#E4E7EE]'}`}>{value}</div>
      <div className="text-[11px] text-[#5F6B7A] dark:text-[#9AA3B4] mt-1">{sub}</div>
    </div>
  );
}

function CAPATable() {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
          <th className="text-left py-2.5 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">CAPA ID</th>
          <th className="text-left py-2.5 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Finding</th>
          <th className="text-left py-2.5 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Age</th>
          <th className="text-left py-2.5 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Priority</th>
          <th className="text-left py-2.5 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-[#F3F4F6] dark:border-[#252838] hover:bg-[#FAFBFC] dark:hover:bg-[#1E2130]">
          <td className="py-2.5 font-semibold text-[#4F6EF7] dark:text-[#6B8AFF]">NC-2024-015</td>
          <td className="py-2.5 text-[#1A1D26] dark:text-[#E4E7EE]">Cloud config non-conformity (AWS S3)</td>
          <td className="py-2.5 font-semibold text-[#E5484D] dark:text-[#F06669]">45 days</td>
          <td className="py-2.5"><span className="px-2 py-0.5 bg-[#FEECEE] dark:bg-[#2A1214] text-[#E5484D] dark:text-[#F06669] rounded text-[10px] font-semibold">High</span></td>
          <td className="py-2.5"><StatusDot status="overdue" /></td>
        </tr>
        <tr className="border-b border-[#F3F4F6] dark:border-[#252838] hover:bg-[#FAFBFC] dark:hover:bg-[#1E2130]">
          <td className="py-2.5 font-semibold text-[#4F6EF7] dark:text-[#6B8AFF]">NC-2025-002</td>
          <td className="py-2.5 text-[#1A1D26] dark:text-[#E4E7EE]">Missing access review evidence Q4</td>
          <td className="py-2.5 font-semibold text-[#E5484D] dark:text-[#F06669]">38 days</td>
          <td className="py-2.5"><span className="px-2 py-0.5 bg-[#FEECEE] dark:bg-[#2A1214] text-[#E5484D] dark:text-[#F06669] rounded text-[10px] font-semibold">High</span></td>
          <td className="py-2.5"><StatusDot status="overdue" /></td>
        </tr>
        <tr className="hover:bg-[#FAFBFC] dark:hover:bg-[#1E2130]">
          <td className="py-2.5 font-semibold text-[#4F6EF7] dark:text-[#6B8AFF]">NC-2025-003</td>
          <td className="py-2.5 text-[#1A1D26] dark:text-[#E4E7EE]">BCP test not executed in 2025</td>
          <td className="py-2.5 font-medium text-[#F5A623] dark:text-[#F5B740]">22 days</td>
          <td className="py-2.5"><span className="px-2 py-0.5 bg-[#FFF7E6] dark:bg-[#2A2210] text-[#B47A14] dark:text-[#F5B740] rounded text-[10px] font-semibold">Medium</span></td>
          <td className="py-2.5"><StatusDot status="partial" /></td>
        </tr>
      </tbody>
    </table>
  );
}

function TimelineItem({ status, title, date }: { status: 'done' | 'progress' | 'pending'; title: string; date: string }) {
  const colors = {
    done: 'bg-[#1DB954] dark:bg-[#34D969]',
    progress: 'bg-[#F5A623] dark:bg-[#F5B740]',
    pending: 'border-2 border-[#E2E5EB] dark:border-[#2A2E3D]',
  };

  return (
    <div className="flex gap-3 items-start">
      <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${colors[status]}`} />
      <div className="flex-1">
        <div className="font-semibold text-sm text-[#1A1D26] dark:text-[#E4E7EE]">{title}</div>
        <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B4] mt-0.5">{date}</div>
      </div>
    </div>
  );
}

function SidebarPreviewItem({
  label,
  icon,
  locked,
  active,
  selectedPlan,
}: {
  label: string;
  icon: string;
  locked: boolean;
  active: boolean;
  selectedPlan: 'basico' | 'pro' | 'enterprise';
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
        active && selectedPlan === 'pro'
          ? 'bg-[#4F6EF7] text-white font-medium shadow-lg shadow-[#4F6EF7]/30'
          : 'text-white/70 hover:bg-white/5'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
    </div>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[#F3F4F6] dark:border-[#252838] last:border-0">
      <div>
        <div className="text-[13.5px] font-medium text-[#1A1D26] dark:text-[#E4E7EE]">{label}</div>
        <div className="text-[11.5px] text-[#9AA3B0] dark:text-[#646D7D] mt-0.5">{sub}</div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full relative transition-colors flex items-center ${value ? 'bg-[#4F6EF7]' : 'bg-[#E2E5EB] dark:bg-[#2A2E3D]'}`}
    >
      <span
        className={`w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
=======
import { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, X, MessageCircle, Send } from 'lucide-react';
import AuditPage from './pages/AuditPage';
import Card from './components/common/Card';

type Page = 'dashboard' | 'understand' | 'documents' | 'risks' | 'evidence' | 'findings' | 'audit' | 'integrity' | 'regfeed' | 'dora' | 'euai' | 'escalation' | 'integrations' | 'settings';
type NavView = 'process' | 'module';
type Profile = 'foundational' | 'established' | 'advanced' | 'mature';
type Language = 'en' | 'es' | 'pt' | 'de' | 'fr';
type DateFormat = 'dmy' | 'mdy' | 'ymd';

interface ChatMessage {
  id: number;
  text: string;
  isAi: boolean;
  timestamp: Date;
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [navView, setNavView] = useState<NavView>('process');
  const [profile, setProfile] = useState<Profile>('established');
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: '¡Hola! Soy Dani, tu asistente de cumplimiento. ¿En qué puedo ayudarte hoy?',
      isAi: true,
      timestamp: new Date(),
    },
  ]);

  // Settings states
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const [dateFormat, setDateFormat] = useState<DateFormat>('dmy');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  // Chat scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  // Translations
  const translations = {
    en: {
      // Navigation
      dashboard: 'Dashboard',
      understand: 'Understand My Situation',
      documents: 'Document Controls',
      risks: 'Manage Risks',
      evidence: 'Collect Evidence',
      findings: 'Manage Findings',
      audit: 'Prepare for Audit',
      integrity: 'Compliance Integrity',
      regfeed: 'Regulatory Feed',
      settings: 'Settings',
      escalation: 'Escalation Rules',
      integrations: 'Integrations',

      // Common
      searchPlaceholder: 'Search controls or evidence...',
      administrator: 'Administrator',
      chatPlaceholder: 'Type a message...',
      send: 'Send',

      // Dashboard
      profile: 'Profile',
      exportReport: 'Export Report',
      addFramework: 'Add Framework',
      overallCompliance: 'Overall Compliance Health',
      documentation: 'Documentation',
      implementation: 'Implementation',
      tested: 'Tested / Effective',
      autoTracked: 'Auto-tracked',
      reviewNeeded: 'Review needed',
      humanRequired: 'Human required',
      fromLastMonth: 'from last month',
      docsPending: 'docs pending review',
      controlsUnverified: 'controls unverified',
      controlsUntested: 'controls untested',
      complianceAlerts: 'Compliance Integrity Alerts',
      viewAll: 'View all',
      alerts: 'alerts',
      regulatoryFeed: 'Regulatory Feed',
      controlStatus: 'Control Status — Cross-Framework View',
      viewSOA: 'View SOA',
      control: 'Control',
      description: 'Description',
      documented: 'Documented',
      implemented: 'Implemented',
      frameworks: 'Frameworks',
      priorityActions: 'Priority Actions',
      preAuditAssessment: 'Pre-Audit Self-Assessment',
      estimatedReadiness: 'Estimated Audit Readiness',
      highRiskAreas: 'high-risk non-conformity areas detected',
      likelyFindings: 'Likely Audit Findings',
      decisionLegend: 'Decision Level Legend:',
      systemExecutes: 'System executes without intervention',
      aiProposes: 'AI proposes, human validates',
      requiresHuman: 'Requires human decision',

      // Gap Analysis
      gapAnalysis: 'Gap Analysis',
      totalGaps: 'Total Gaps Identified',
      criticalGaps: 'Critical Gaps',
      gapsClosed: 'Gaps Closed',
      acrossFrameworks: 'Across all frameworks',
      requireAction: 'Require immediate action',
      progress: 'progress',

      // Documents
      documentGenerator: 'Document Generator',
      generateDocument: 'Generate Document',
      policyLibrary: 'Policy & Procedure Library',

      // Risks
      riskMap: 'Risk Map',
      addRisk: 'Add Risk',
      totalRisks: 'Total Risks',
      highCritical: 'High / Critical',
      withTreatment: 'With Treatment Plans',
      acrossCategories: 'Across 4 categories',
      needTreatment: 'need immediate treatment',
      coverage: 'coverage',
      riskRegister: 'Risk Register',

      // Evidence
      evidenceCenter: 'Evidence Center',
      uploadEvidence: 'Upload Evidence',
      totalEvidence: 'Total Evidence Items',
      autoCollected: 'Auto-Collected',
      effectivenessEvidence: 'Effectiveness Evidence',
      acrossControls: 'Across 93 controls',
      fromSources: 'From AWS, Azure, Okta',
      penTests: 'Pen tests, tabletops, drills',
      evidenceByType: 'Evidence by Type',

      // Findings
      capaTracker: 'CAPA Tracker',
      newCAPA: 'New CAPA',
      openCAPAs: 'Open CAPAs',
      overdue: 'overdue',
      avgResolution: 'Avg. Resolution Time',
      targetDays: 'Target: 30 days',
      closedQuarter: 'Closed This Quarter',
      vsLast: 'vs. 11 last quarter',
      openActions: 'Open Corrective Actions',

      // Audit
      auditRoom: 'Audit Room',
      generatePreAudit: 'Generate Pre-Audit Report',
      auditReadiness: 'Audit Readiness',
      targetBefore: 'Target: 85% before audit',
      evidenceCoverage: 'Evidence Coverage',
      controlsMissing: 'of controls missing evidence',
      openNonConformities: 'Open Non-Conformities',
      highRisk: 'High risk for audit findings',
      predictedFindings: 'Predicted Audit Findings',
      auditTimeline: 'Audit Timeline',

      // Settings
      languageRegion: 'Language & Region',
      interfaceLanguage: 'Interface Language',
      controlsUI: 'Controls the language of the entire platform UI',
      dateFormat: 'Date Format',
      howDisplayed: 'How dates are displayed',
      timezone: 'Timezone',
      yourTimezone: 'Your local timezone',
      appearance: 'Appearance',
      darkMode: 'Dark Mode',
      toggleTheme: 'Toggle dark theme',
      compactView: 'Compact View',
      reduceSpacing: 'Reduce spacing in tables',
      showLabels: 'Show Sidebar Labels',
      displayText: 'Display text in navigation',
      notifications: 'Notifications',
      emailNotifications: 'Email Notifications',
      receiveAlerts: 'Receive compliance alerts via email',
      capaReminders: 'CAPA Reminders',
      overdueNotif: 'Notifications for overdue CAPAs',
      regulatoryUpdates: 'Regulatory Updates',
      alertChanges: 'Alert on new regulatory changes',
      auditDeadlines: 'Audit Deadlines',
      remindersBefore: 'Reminders before audit dates',
      system: 'System',
      autoSave: 'Auto-Save',
      autoSaveChanges: 'Automatically save changes',
      offlineMode: 'Offline Mode',
      enableOffline: 'Enable offline access to data',
      exportFormat: 'Data Export Format',
      defaultFormat: 'Default format for reports',
    },
    es: {
      // Navigation
      dashboard: 'Panel de Control',
      understand: 'Entender Mi Situación',
      documents: 'Controles de Documentos',
      risks: 'Gestionar Riesgos',
      evidence: 'Recopilar Evidencia',
      findings: 'Gestionar Hallazgos',
      audit: 'Preparar Auditoría',
      integrity: 'Integridad de Cumplimiento',
      regfeed: 'Noticias Regulatorias',
      settings: 'Configuración',
      escalation: 'Reglas de Escalación',
      integrations: 'Integraciones',

      // Common
      searchPlaceholder: 'Buscar controles o evidencia...',
      administrator: 'Administrador',
      chatPlaceholder: 'Escribe un mensaje...',
      send: 'Enviar',

      // Dashboard
      profile: 'Perfil',
      exportReport: 'Exportar Reporte',
      addFramework: 'Agregar Framework',
      overallCompliance: 'Estado General de Cumplimiento',
      documentation: 'Documentación',
      implementation: 'Implementación',
      tested: 'Probado / Efectivo',
      autoTracked: 'Auto-rastreado',
      reviewNeeded: 'Revisión necesaria',
      humanRequired: 'Humano requerido',
      fromLastMonth: 'desde el mes pasado',
      docsPending: 'docs pendientes de revisión',
      controlsUnverified: 'controles sin verificar',
      controlsUntested: 'controles sin probar',
      complianceAlerts: 'Alertas de Integridad de Cumplimiento',
      viewAll: 'Ver todos',
      alerts: 'alertas',
      regulatoryFeed: 'Noticias Regulatorias',
      controlStatus: 'Estado de Controles — Vista Multi-Framework',
      viewSOA: 'Ver SOA',
      control: 'Control',
      description: 'Descripción',
      documented: 'Documentado',
      implemented: 'Implementado',
      frameworks: 'Frameworks',
      priorityActions: 'Acciones Prioritarias',
      preAuditAssessment: 'Autoevaluación Pre-Auditoría',
      estimatedReadiness: 'Preparación Estimada para Auditoría',
      highRiskAreas: 'áreas de no conformidad de alto riesgo detectadas',
      likelyFindings: 'Hallazgos Probables de Auditoría',
      decisionLegend: 'Leyenda de Nivel de Decisión:',
      systemExecutes: 'El sistema ejecuta sin intervención',
      aiProposes: 'IA propone, humano valida',
      requiresHuman: 'Requiere decisión humana',

      // Gap Analysis
      gapAnalysis: 'Análisis de Brechas',
      totalGaps: 'Total de Brechas Identificadas',
      criticalGaps: 'Brechas Críticas',
      gapsClosed: 'Brechas Cerradas',
      acrossFrameworks: 'En todos los frameworks',
      requireAction: 'Requieren acción inmediata',
      progress: 'progreso',

      // Documents
      documentGenerator: 'Generador de Documentos',
      generateDocument: 'Generar Documento',
      policyLibrary: 'Biblioteca de Políticas y Procedimientos',

      // Risks
      riskMap: 'Mapa de Riesgos',
      addRisk: 'Agregar Riesgo',
      totalRisks: 'Total de Riesgos',
      highCritical: 'Alto / Crítico',
      withTreatment: 'Con Planes de Tratamiento',
      acrossCategories: 'En 4 categorías',
      needTreatment: 'necesitan tratamiento inmediato',
      coverage: 'cobertura',
      riskRegister: 'Registro de Riesgos',

      // Evidence
      evidenceCenter: 'Centro de Evidencias',
      uploadEvidence: 'Subir Evidencia',
      totalEvidence: 'Total de Elementos de Evidencia',
      autoCollected: 'Auto-Recopilado',
      effectivenessEvidence: 'Evidencia de Efectividad',
      acrossControls: 'En 93 controles',
      fromSources: 'De AWS, Azure, Okta',
      penTests: 'Pruebas de penetración, simulacros',
      evidenceByType: 'Evidencia por Tipo',

      // Findings
      capaTracker: 'Seguimiento de CAPA',
      newCAPA: 'Nuevo CAPA',
      openCAPAs: 'CAPAs Abiertos',
      overdue: 'vencidos',
      avgResolution: 'Tiempo Promedio de Resolución',
      targetDays: 'Objetivo: 30 días',
      closedQuarter: 'Cerrados Este Trimestre',
      vsLast: 'vs. 11 trimestre pasado',
      openActions: 'Acciones Correctivas Abiertas',

      // Audit
      auditRoom: 'Sala de Auditoría',
      generatePreAudit: 'Generar Reporte Pre-Auditoría',
      auditReadiness: 'Preparación para Auditoría',
      targetBefore: 'Objetivo: 85% antes de auditoría',
      evidenceCoverage: 'Cobertura de Evidencia',
      controlsMissing: 'de controles faltan evidencia',
      openNonConformities: 'No Conformidades Abiertas',
      highRisk: 'Alto riesgo para hallazgos de auditoría',
      predictedFindings: 'Hallazgos Predichos de Auditoría',
      auditTimeline: 'Cronograma de Auditoría',

      // Settings
      languageRegion: 'Idioma y Región',
      interfaceLanguage: 'Idioma de la Interfaz',
      controlsUI: 'Controla el idioma de toda la plataforma',
      dateFormat: 'Formato de Fecha',
      howDisplayed: 'Cómo se muestran las fechas',
      timezone: 'Zona Horaria',
      yourTimezone: 'Tu zona horaria local',
      appearance: 'Apariencia',
      darkMode: 'Modo Oscuro',
      toggleTheme: 'Alternar tema oscuro',
      compactView: 'Vista Compacta',
      reduceSpacing: 'Reducir espaciado en tablas',
      showLabels: 'Mostrar Etiquetas del Menú',
      displayText: 'Mostrar texto en navegación',
      notifications: 'Notificaciones',
      emailNotifications: 'Notificaciones por Email',
      receiveAlerts: 'Recibir alertas de cumplimiento por email',
      capaReminders: 'Recordatorios de CAPA',
      overdueNotif: 'Notificaciones para CAPAs vencidos',
      regulatoryUpdates: 'Actualizaciones Regulatorias',
      alertChanges: 'Alertar sobre nuevos cambios regulatorios',
      auditDeadlines: 'Plazos de Auditoría',
      remindersBefore: 'Recordatorios antes de fechas de auditoría',
      system: 'Sistema',
      autoSave: 'Guardado Automático',
      autoSaveChanges: 'Guardar cambios automáticamente',
      offlineMode: 'Modo Sin Conexión',
      enableOffline: 'Habilitar acceso sin conexión a datos',
      exportFormat: 'Formato de Exportación de Datos',
      defaultFormat: 'Formato predeterminado para reportes',
    },
    pt: {
      // Navigation
      dashboard: 'Painel',
      understand: 'Entender Minha Situação',
      documents: 'Controles de Documentos',
      risks: 'Gerenciar Riscos',
      evidence: 'Coletar Evidências',
      findings: 'Gerenciar Achados',
      audit: 'Preparar Auditoria',
      integrity: 'Integridade de Conformidade',
      regfeed: 'Feed Regulatório',
      settings: 'Configurações',
      escalation: 'Regras de Escalação',
      integrations: 'Integrações',

      // Common
      searchPlaceholder: 'Pesquisar controles ou evidências...',
      administrator: 'Administrador',
      chatPlaceholder: 'Digite uma mensagem...',
      send: 'Enviar',

      // Dashboard
      profile: 'Perfil',
      exportReport: 'Exportar Relatório',
      addFramework: 'Adicionar Framework',
      overallCompliance: 'Saúde Geral de Conformidade',
      documentation: 'Documentação',
      implementation: 'Implementação',
      tested: 'Testado / Efetivo',
      autoTracked: 'Auto-rastreado',
      reviewNeeded: 'Revisão necessária',
      humanRequired: 'Humano necessário',
      fromLastMonth: 'do mês passado',
      docsPending: 'docs pendentes de revisão',
      controlsUnverified: 'controles não verificados',
      controlsUntested: 'controles não testados',
      complianceAlerts: 'Alertas de Integridade de Conformidade',
      viewAll: 'Ver todos',
      alerts: 'alertas',
      regulatoryFeed: 'Feed Regulatório',
      controlStatus: 'Status de Controle — Visão Multi-Framework',
      viewSOA: 'Ver SOA',
      control: 'Controle',
      description: 'Descrição',
      documented: 'Documentado',
      implemented: 'Implementado',
      frameworks: 'Frameworks',
      priorityActions: 'Ações Prioritárias',
      preAuditAssessment: 'Autoavaliação Pré-Auditoria',
      estimatedReadiness: 'Prontidão Estimada para Auditoria',
      highRiskAreas: 'áreas de não conformidade de alto risco detectadas',
      likelyFindings: 'Achados Prováveis de Auditoria',
      decisionLegend: 'Legenda de Nível de Decisão:',
      systemExecutes: 'Sistema executa sem intervenção',
      aiProposes: 'IA propõe, humano valida',
      requiresHuman: 'Requer decisão humana',

      // Gap Analysis
      gapAnalysis: 'Análise de Lacunas',
      totalGaps: 'Total de Lacunas Identificadas',
      criticalGaps: 'Lacunas Críticas',
      gapsClosed: 'Lacunas Fechadas',
      acrossFrameworks: 'Em todos os frameworks',
      requireAction: 'Requerem ação imediata',
      progress: 'progresso',

      // Documents
      documentGenerator: 'Gerador de Documentos',
      generateDocument: 'Gerar Documento',
      policyLibrary: 'Biblioteca de Políticas e Procedimentos',

      // Risks
      riskMap: 'Mapa de Riscos',
      addRisk: 'Adicionar Risco',
      totalRisks: 'Total de Riscos',
      highCritical: 'Alto / Crítico',
      withTreatment: 'Com Planos de Tratamento',
      acrossCategories: 'Em 4 categorias',
      needTreatment: 'precisam de tratamento imediato',
      coverage: 'cobertura',
      riskRegister: 'Registro de Riscos',

      // Evidence
      evidenceCenter: 'Centro de Evidências',
      uploadEvidence: 'Carregar Evidência',
      totalEvidence: 'Total de Itens de Evidência',
      autoCollected: 'Auto-Coletado',
      effectivenessEvidence: 'Evidência de Efetividade',
      acrossControls: 'Em 93 controles',
      fromSources: 'De AWS, Azure, Okta',
      penTests: 'Testes de penetração, simulações',
      evidenceByType: 'Evidência por Tipo',

      // Findings
      capaTracker: 'Rastreador de CAPA',
      newCAPA: 'Novo CAPA',
      openCAPAs: 'CAPAs Abertos',
      overdue: 'vencidos',
      avgResolution: 'Tempo Médio de Resolução',
      targetDays: 'Meta: 30 dias',
      closedQuarter: 'Fechados Este Trimestre',
      vsLast: 'vs. 11 trimestre passado',
      openActions: 'Ações Corretivas Abertas',

      // Audit
      auditRoom: 'Sala de Auditoria',
      generatePreAudit: 'Gerar Relatório Pré-Auditoria',
      auditReadiness: 'Prontidão para Auditoria',
      targetBefore: 'Meta: 85% antes da auditoria',
      evidenceCoverage: 'Cobertura de Evidência',
      controlsMissing: 'dos controles faltam evidência',
      openNonConformities: 'Não Conformidades Abertas',
      highRisk: 'Alto risco para achados de auditoria',
      predictedFindings: 'Achados Previstos de Auditoria',
      auditTimeline: 'Cronograma de Auditoria',

      // Settings
      languageRegion: 'Idioma e Região',
      interfaceLanguage: 'Idioma da Interface',
      controlsUI: 'Controla o idioma de toda a plataforma',
      dateFormat: 'Formato de Data',
      howDisplayed: 'Como as datas são exibidas',
      timezone: 'Fuso Horário',
      yourTimezone: 'Seu fuso horário local',
      appearance: 'Aparência',
      darkMode: 'Modo Escuro',
      toggleTheme: 'Alternar tema escuro',
      compactView: 'Visualização Compacta',
      reduceSpacing: 'Reduzir espaçamento em tabelas',
      showLabels: 'Mostrar Rótulos do Menu',
      displayText: 'Exibir texto na navegação',
      notifications: 'Notificações',
      emailNotifications: 'Notificações por Email',
      receiveAlerts: 'Receber alertas de conformidade por email',
      capaReminders: 'Lembretes de CAPA',
      overdueNotif: 'Notificações para CAPAs vencidos',
      regulatoryUpdates: 'Atualizações Regulatórias',
      alertChanges: 'Alertar sobre novas mudanças regulatórias',
      auditDeadlines: 'Prazos de Auditoria',
      remindersBefore: 'Lembretes antes das datas de auditoria',
      system: 'Sistema',
      autoSave: 'Salvamento Automático',
      autoSaveChanges: 'Salvar mudanças automaticamente',
      offlineMode: 'Modo Offline',
      enableOffline: 'Habilitar acesso offline aos dados',
      exportFormat: 'Formato de Exportação de Dados',
      defaultFormat: 'Formato padrão para relatórios',
    },
    de: {
      // Navigation
      dashboard: 'Dashboard',
      understand: 'Meine Situation Verstehen',
      documents: 'Dokumentenkontrollen',
      risks: 'Risiken Verwalten',
      evidence: 'Beweise Sammeln',
      findings: 'Befunde Verwalten',
      audit: 'Audit Vorbereiten',
      integrity: 'Compliance-Integrität',
      regfeed: 'Regulatorischer Feed',
      settings: 'Einstellungen',
      escalation: 'Eskalationsregeln',
      integrations: 'Integrationen',

      // Common
      searchPlaceholder: 'Kontrollen oder Beweise suchen...',
      administrator: 'Administrator',
      chatPlaceholder: 'Nachricht eingeben...',
      send: 'Senden',

      // Dashboard
      profile: 'Profil',
      exportReport: 'Bericht Exportieren',
      addFramework: 'Framework Hinzufügen',
      overallCompliance: 'Allgemeine Compliance-Gesundheit',
      documentation: 'Dokumentation',
      implementation: 'Implementierung',
      tested: 'Getestet / Wirksam',
      autoTracked: 'Auto-verfolgt',
      reviewNeeded: 'Überprüfung erforderlich',
      humanRequired: 'Mensch erforderlich',
      fromLastMonth: 'vom letzten Monat',
      docsPending: 'Dokumente zur Überprüfung',
      controlsUnverified: 'Kontrollen nicht verifiziert',
      controlsUntested: 'Kontrollen nicht getestet',
      complianceAlerts: 'Compliance-Integritätswarnungen',
      viewAll: 'Alle anzeigen',
      alerts: 'Warnungen',
      regulatoryFeed: 'Regulatorischer Feed',
      controlStatus: 'Kontrollstatus — Multi-Framework-Ansicht',
      viewSOA: 'SOA Anzeigen',
      control: 'Kontrolle',
      description: 'Beschreibung',
      documented: 'Dokumentiert',
      implemented: 'Implementiert',
      frameworks: 'Frameworks',
      priorityActions: 'Prioritätsaktionen',
      preAuditAssessment: 'Voraudit-Selbstbewertung',
      estimatedReadiness: 'Geschätzte Audit-Bereitschaft',
      highRiskAreas: 'Hochrisiko-Nichtkonformitätsbereiche erkannt',
      likelyFindings: 'Wahrscheinliche Audit-Ergebnisse',
      decisionLegend: 'Entscheidungsebenen-Legende:',
      systemExecutes: 'System führt ohne Eingriff aus',
      aiProposes: 'KI schlägt vor, Mensch validiert',
      requiresHuman: 'Erfordert menschliche Entscheidung',

      // Gap Analysis
      gapAnalysis: 'Lückenanalyse',
      totalGaps: 'Gesamtzahl der Identifizierten Lücken',
      criticalGaps: 'Kritische Lücken',
      gapsClosed: 'Geschlossene Lücken',
      acrossFrameworks: 'In allen Frameworks',
      requireAction: 'Erfordern sofortige Maßnahmen',
      progress: 'Fortschritt',

      // Documents
      documentGenerator: 'Dokumentengenerator',
      generateDocument: 'Dokument Generieren',
      policyLibrary: 'Richtlinien- und Verfahrensbibliothek',

      // Risks
      riskMap: 'Risikokarte',
      addRisk: 'Risiko Hinzufügen',
      totalRisks: 'Gesamtrisiken',
      highCritical: 'Hoch / Kritisch',
      withTreatment: 'Mit Behandlungsplänen',
      acrossCategories: 'In 4 Kategorien',
      needTreatment: 'benötigen sofortige Behandlung',
      coverage: 'Abdeckung',
      riskRegister: 'Risikoregister',

      // Evidence
      evidenceCenter: 'Beweiszentrum',
      uploadEvidence: 'Beweis Hochladen',
      totalEvidence: 'Gesamtzahl der Beweiselemente',
      autoCollected: 'Auto-Gesammelt',
      effectivenessEvidence: 'Wirksamkeitsnachweis',
      acrossControls: 'Über 93 Kontrollen',
      fromSources: 'Von AWS, Azure, Okta',
      penTests: 'Pen-Tests, Simulationen',
      evidenceByType: 'Beweis nach Typ',

      // Findings
      capaTracker: 'CAPA-Tracker',
      newCAPA: 'Neues CAPA',
      openCAPAs: 'Offene CAPAs',
      overdue: 'überfällig',
      avgResolution: 'Durchschnittliche Lösungszeit',
      targetDays: 'Ziel: 30 Tage',
      closedQuarter: 'Dieses Quartal Geschlossen',
      vsLast: 'vs. 11 letztes Quartal',
      openActions: 'Offene Korrekturmaßnahmen',

      // Audit
      auditRoom: 'Auditraum',
      generatePreAudit: 'Voraudit-Bericht Generieren',
      auditReadiness: 'Audit-Bereitschaft',
      targetBefore: 'Ziel: 85% vor Audit',
      evidenceCoverage: 'Beweisabdeckung',
      controlsMissing: 'der Kontrollen fehlen Beweise',
      openNonConformities: 'Offene Nichtkonformitäten',
      highRisk: 'Hohes Risiko für Audit-Ergebnisse',
      predictedFindings: 'Vorhergesagte Audit-Ergebnisse',
      auditTimeline: 'Audit-Zeitplan',

      // Settings
      languageRegion: 'Sprache & Region',
      interfaceLanguage: 'Oberflächensprache',
      controlsUI: 'Steuert die Sprache der gesamten Plattform',
      dateFormat: 'Datumsformat',
      howDisplayed: 'Wie Daten angezeigt werden',
      timezone: 'Zeitzone',
      yourTimezone: 'Ihre lokale Zeitzone',
      appearance: 'Aussehen',
      darkMode: 'Dunkelmodus',
      toggleTheme: 'Dunkles Thema umschalten',
      compactView: 'Kompakte Ansicht',
      reduceSpacing: 'Abstand in Tabellen reduzieren',
      showLabels: 'Menübeschriftungen Anzeigen',
      displayText: 'Text in Navigation anzeigen',
      notifications: 'Benachrichtigungen',
      emailNotifications: 'E-Mail-Benachrichtigungen',
      receiveAlerts: 'Compliance-Warnungen per E-Mail erhalten',
      capaReminders: 'CAPA-Erinnerungen',
      overdueNotif: 'Benachrichtigungen für überfällige CAPAs',
      regulatoryUpdates: 'Regulatorische Updates',
      alertChanges: 'Über neue regulatorische Änderungen benachrichtigen',
      auditDeadlines: 'Audit-Fristen',
      remindersBefore: 'Erinnerungen vor Audit-Terminen',
      system: 'System',
      autoSave: 'Automatisches Speichern',
      autoSaveChanges: 'Änderungen automatisch speichern',
      offlineMode: 'Offline-Modus',
      enableOffline: 'Offline-Zugriff auf Daten aktivieren',
      exportFormat: 'Datenexportformat',
      defaultFormat: 'Standardformat für Berichte',
    },
    fr: {
      // Navigation
      dashboard: 'Tableau de Bord',
      understand: 'Comprendre Ma Situation',
      documents: 'Contrôles de Documents',
      risks: 'Gérer les Risques',
      evidence: 'Collecter des Preuves',
      findings: 'Gérer les Constatations',
      audit: 'Préparer l\'Audit',
      integrity: 'Intégrité de la Conformité',
      regfeed: 'Flux Réglementaire',
      settings: 'Paramètres',
      escalation: 'Règles d\'Escalade',
      integrations: 'Intégrations',

      // Common
      searchPlaceholder: 'Rechercher des contrôles ou des preuves...',
      administrator: 'Administrateur',
      chatPlaceholder: 'Tapez un message...',
      send: 'Envoyer',

      // Dashboard
      profile: 'Profil',
      exportReport: 'Exporter le Rapport',
      addFramework: 'Ajouter un Framework',
      overallCompliance: 'Santé Globale de la Conformité',
      documentation: 'Documentation',
      implementation: 'Implémentation',
      tested: 'Testé / Efficace',
      autoTracked: 'Auto-suivi',
      reviewNeeded: 'Révision nécessaire',
      humanRequired: 'Humain requis',
      fromLastMonth: 'du mois dernier',
      docsPending: 'docs en attente de révision',
      controlsUnverified: 'contrôles non vérifiés',
      controlsUntested: 'contrôles non testés',
      complianceAlerts: 'Alertes d\'Intégrité de Conformité',
      viewAll: 'Voir tout',
      alerts: 'alertes',
      regulatoryFeed: 'Flux Réglementaire',
      controlStatus: 'Statut des Contrôles — Vue Multi-Framework',
      viewSOA: 'Voir SOA',
      control: 'Contrôle',
      description: 'Description',
      documented: 'Documenté',
      implemented: 'Implémenté',
      frameworks: 'Frameworks',
      priorityActions: 'Actions Prioritaires',
      preAuditAssessment: 'Auto-évaluation Pré-audit',
      estimatedReadiness: 'Préparation Estimée pour l\'Audit',
      highRiskAreas: 'zones de non-conformité à haut risque détectées',
      likelyFindings: 'Constatations Probables d\'Audit',
      decisionLegend: 'Légende du Niveau de Décision:',
      systemExecutes: 'Le système s\'exécute sans intervention',
      aiProposes: 'L\'IA propose, l\'humain valide',
      requiresHuman: 'Nécessite une décision humaine',

      // Gap Analysis
      gapAnalysis: 'Analyse des Écarts',
      totalGaps: 'Total des Écarts Identifiés',
      criticalGaps: 'Écarts Critiques',
      gapsClosed: 'Écarts Fermés',
      acrossFrameworks: 'Dans tous les frameworks',
      requireAction: 'Nécessitent une action immédiate',
      progress: 'progrès',

      // Documents
      documentGenerator: 'Générateur de Documents',
      generateDocument: 'Générer un Document',
      policyLibrary: 'Bibliothèque de Politiques et Procédures',

      // Risks
      riskMap: 'Carte des Risques',
      addRisk: 'Ajouter un Risque',
      totalRisks: 'Total des Risques',
      highCritical: 'Haut / Critique',
      withTreatment: 'Avec Plans de Traitement',
      acrossCategories: 'Dans 4 catégories',
      needTreatment: 'nécessitent un traitement immédiat',
      coverage: 'couverture',
      riskRegister: 'Registre des Risques',

      // Evidence
      evidenceCenter: 'Centre de Preuves',
      uploadEvidence: 'Télécharger une Preuve',
      totalEvidence: 'Total des Éléments de Preuve',
      autoCollected: 'Auto-collecté',
      effectivenessEvidence: 'Preuve d\'Efficacité',
      acrossControls: 'Sur 93 contrôles',
      fromSources: 'De AWS, Azure, Okta',
      penTests: 'Tests de pénétration, simulations',
      evidenceByType: 'Preuve par Type',

      // Findings
      capaTracker: 'Suivi CAPA',
      newCAPA: 'Nouveau CAPA',
      openCAPAs: 'CAPAs Ouverts',
      overdue: 'en retard',
      avgResolution: 'Temps Moyen de Résolution',
      targetDays: 'Objectif: 30 jours',
      closedQuarter: 'Fermés ce Trimestre',
      vsLast: 'vs. 11 dernier trimestre',
      openActions: 'Actions Correctives Ouvertes',

      // Audit
      auditRoom: 'Salle d\'Audit',
      generatePreAudit: 'Générer un Rapport Pré-audit',
      auditReadiness: 'Préparation à l\'Audit',
      targetBefore: 'Objectif: 85% avant l\'audit',
      evidenceCoverage: 'Couverture des Preuves',
      controlsMissing: 'des contrôles manquent de preuves',
      openNonConformities: 'Non-conformités Ouvertes',
      highRisk: 'Haut risque pour les constatations d\'audit',
      predictedFindings: 'Constatations Prévues d\'Audit',
      auditTimeline: 'Calendrier d\'Audit',

      // Settings
      languageRegion: 'Langue & Région',
      interfaceLanguage: 'Langue de l\'Interface',
      controlsUI: 'Contrôle la langue de toute la plateforme',
      dateFormat: 'Format de Date',
      howDisplayed: 'Comment les dates sont affichées',
      timezone: 'Fuseau Horaire',
      yourTimezone: 'Votre fuseau horaire local',
      appearance: 'Apparence',
      darkMode: 'Mode Sombre',
      toggleTheme: 'Basculer le thème sombre',
      compactView: 'Vue Compacte',
      reduceSpacing: 'Réduire l\'espacement dans les tableaux',
      showLabels: 'Afficher les Étiquettes du Menu',
      displayText: 'Afficher le texte dans la navigation',
      notifications: 'Notifications',
      emailNotifications: 'Notifications par Email',
      receiveAlerts: 'Recevoir des alertes de conformité par email',
      capaReminders: 'Rappels CAPA',
      overdueNotif: 'Notifications pour les CAPAs en retard',
      regulatoryUpdates: 'Mises à Jour Réglementaires',
      alertChanges: 'Alerter sur les nouveaux changements réglementaires',
      auditDeadlines: 'Délais d\'Audit',
      remindersBefore: 'Rappels avant les dates d\'audit',
      system: 'Système',
      autoSave: 'Sauvegarde Automatique',
      autoSaveChanges: 'Sauvegarder les modifications automatiquement',
      offlineMode: 'Mode Hors Ligne',
      enableOffline: 'Activer l\'accès hors ligne aux données',
      exportFormat: 'Format d\'Exportation des Données',
      defaultFormat: 'Format par défaut pour les rapports',
    },
  };

  const t = translations[language];

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Chat bot responses
  const getBotResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    if (msg.includes('hola') || msg.includes('hello') || msg.includes('hi')) {
      return '¡Hola! ¿En qué aspecto del cumplimiento necesitas ayuda? Puedo asistirte con controles ISO 27001, evidencias, CAPAs, o cualquier pregunta sobre el sistema.';
    }
    if (msg.includes('ayuda') || msg.includes('help')) {
      return 'Puedo ayudarte con: 1) Análisis de brechas de cumplimiento, 2) Gestión de controles ISO 27001, 3) Seguimiento de evidencias, 4) Gestión de CAPAs, 5) Preparación de auditorías. ¿Con cuál te gustaría empezar?';
    }
    if (msg.includes('iso') || msg.includes('27001')) {
      return 'ISO 27001:2022 es el estándar internacional de seguridad de la información. Actualmente tienes 72% de cumplimiento general. ¿Te gustaría ver un análisis detallado de tus controles?';
    }
    if (msg.includes('audit') || msg.includes('auditoría')) {
      return 'Tu preparación para auditoría está al 68%. Tienes 3 no conformidades críticas que deben resolverse. ¿Quieres que genere un informe pre-auditoría?';
    }
    if (msg.includes('capa') || msg.includes('finding')) {
      return 'Tienes 8 CAPAs abiertas, 3 de ellas vencidas. Las más críticas son NC-2024-015 (45 días) y NC-2025-002 (38 días). ¿Necesitas ayuda para priorizarlas?';
    }
    if (msg.includes('evidence') || msg.includes('evidencia')) {
      return 'Tienes 142 elementos de evidencia total. 87 son auto-recopilados y 12 son evidencias de efectividad. Hay una brecha del 18% en evidencias de pruebas reales. ¿Quieres recomendaciones?';
    }
    if (msg.includes('riesgo') || msg.includes('risk')) {
      return 'Tienes 24 riesgos identificados, 6 de nivel crítico/alto. Los riesgos más importantes son ransomware (R-001) y acceso no autorizado a PII (R-002). ¿Necesitas un plan de tratamiento?';
    }
    if (msg.includes('gracias') || msg.includes('thanks')) {
      return '¡De nada! Estoy aquí para ayudarte con tu programa de cumplimiento. No dudes en preguntar cualquier cosa.';
    }

    return 'Entiendo tu consulta. Para darte una mejor respuesta, ¿podrías especificar si se trata de: controles, evidencias, CAPAs, riesgos o preparación de auditoría?';
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: chatMessages.length + 1,
      text: chatMessage,
      isAi: false,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMsg]);
    setChatMessage('');

    // Simulate AI response with delay
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: chatMessages.length + 2,
        text: getBotResponse(chatMessage),
        isAi: true,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  const profileConfig = {
    foundational: { color: 'bg-[#F5A623]/15 text-[#F5A623]', dot: 'bg-[#F5A623]', label: 'Foundational' },
    established: { color: 'bg-[#4F6EF7]/15 text-[#8BA3F9]', dot: 'bg-[#8BA3F9]', label: 'Established' },
    advanced: { color: 'bg-[#8B5CF6]/15 text-[#B794F6]', dot: 'bg-[#B794F6]', label: 'Advanced' },
    mature: { color: 'bg-[#1DB954]/15 text-[#1DB954]', dot: 'bg-[#1DB954]', label: 'Mature' },
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#111318]' : 'bg-[#F7F8FA]'}`}>
      {/* Sidebar */}
      <aside className={`w-[260px] text-white flex flex-col fixed h-screen overflow-y-auto transition-colors duration-300 ${darkMode ? 'bg-[#0A0D16]' : 'bg-[#0F1729]'}`}>
        {/* Logo */}
        <div className="px-5 py-[22px] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] rounded-lg bg-[#4F6EF7] flex items-center justify-center font-bold text-[15px]">
              D
            </div>
            <div>
              <div className="text-[15px] font-semibold -tracking-[0.2px]">Dani Platform</div>
              <div className="text-[11px] text-white/45 mt-0.5">v4 — Compliance Intelligence</div>
            </div>
          </div>
        </div>

        {/* Profile Badge */}
        <div className="px-5 pt-[14px] pb-[6px]">
          <div className="text-[10px] uppercase tracking-[1.2px] text-white/35 font-semibold">
            Organization Profile
          </div>
        </div>
        <div className="mx-4 mb-4">
          <button
            onClick={() => setShowProfileOverlay(true)}
            className={`w-full px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all hover:opacity-80 ${profileConfig[profile].color}`}
          >
            <span className={`w-[7px] h-[7px] rounded-full ${profileConfig[profile].dot}`} />
            <span>{profileConfig[profile].label}</span>
            <span className="ml-auto text-[11px] opacity-60">Change ›</span>
          </button>
        </div>

        {/* Nav Toggle */}
        <div className="mx-4 mb-1">
          <div className="flex bg-white/5 rounded-md p-[3px]">
            <button
              onClick={() => setNavView('process')}
              className={`flex-1 text-center py-1.5 text-[11px] font-medium rounded transition-all ${
                navView === 'process' ? 'bg-white/10 text-white' : 'text-white/45'
              }`}
            >
              By Process
            </button>
            <button
              onClick={() => setNavView('module')}
              className={`flex-1 text-center py-1.5 text-[11px] font-medium rounded transition-all ${
                navView === 'module' ? 'bg-white/10 text-white' : 'text-white/45'
              }`}
            >
              By Module
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2">
          {navView === 'process' ? (
            <>
              <NavSection label="Compliance Journey" />
              <NavItem active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon="step" stepNum="1">
                {t.dashboard}
              </NavItem>
              <NavItem active={activePage === 'understand'} onClick={() => setActivePage('understand')} icon="step" stepNum="✓" completed>
                {t.understand}
              </NavItem>
              <NavItem active={activePage === 'documents'} onClick={() => setActivePage('documents')} icon="step" stepNum="3" badge="4" badgeType="warn">
                {t.documents}
              </NavItem>
              <NavItem active={activePage === 'risks'} onClick={() => setActivePage('risks')} icon="step" stepNum="4" isLocked={true}>
                {t.risks}
              </NavItem>
              <NavItem active={activePage === 'evidence'} onClick={() => setActivePage('evidence')} icon="step" stepNum="5" badge="7">
                {t.evidence}
              </NavItem>
              <NavItem active={activePage === 'findings'} onClick={() => setActivePage('findings')} icon="step" stepNum="6">
                {t.findings}
              </NavItem>
              <NavItem active={activePage === 'audit'} onClick={() => setActivePage('audit')} icon="step" stepNum="7" isLocked={true}>
                {t.audit}
              </NavItem>
              <NavSection label="Intelligence" />
              <NavItem active={activePage === 'integrity'} onClick={() => setActivePage('integrity')} icon="⚠" badge="3" isLocked={true}>
                {t.integrity}
              </NavItem>
              <NavItem active={activePage === 'regfeed'} onClick={() => setActivePage('regfeed')} icon="📢" badge="2" badgeType="warn" isLocked={true}>
                {t.regfeed}
              </NavItem>
            </>
          ) : (
            <>
              <NavSection label="Core Modules" />
              <NavItem active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon="📊">
                {t.dashboard}
              </NavItem>
              <NavItem active={activePage === 'understand'} onClick={() => setActivePage('understand')} icon="🔍">
                {t.gapAnalysis}
              </NavItem>
              <NavItem active={activePage === 'documents'} onClick={() => setActivePage('documents')} icon="📄">
                {t.documentGenerator}
              </NavItem>
              <NavItem active={activePage === 'risks'} onClick={() => setActivePage('risks')} icon="🛡️" isLocked={true}>
                {t.riskMap}
              </NavItem>
              <NavItem active={activePage === 'evidence'} onClick={() => setActivePage('evidence')} icon="📦">
                {t.evidenceCenter}
              </NavItem>
              <NavItem active={activePage === 'findings'} onClick={() => setActivePage('findings')} icon="🔧">
                {t.capaTracker}
              </NavItem>
              <NavItem active={activePage === 'audit'} onClick={() => setActivePage('audit')} icon="🏛️" isLocked={true}>
                {t.auditRoom}
              </NavItem>
              <NavSection label="Intelligence" />
              <NavItem active={activePage === 'integrity'} onClick={() => setActivePage('integrity')} icon="⚠" isLocked={true}>
                {t.integrity}
              </NavItem>
              <NavItem active={activePage === 'regfeed'} onClick={() => setActivePage('regfeed')} icon="📢" isLocked={true}>
                {t.regfeed}
              </NavItem>
              <NavSection label="Regulatory Modules" />
              <NavItem active={activePage === 'dora'} onClick={() => setActivePage('dora')} icon="🏦">
                DORA Module
              </NavItem>
              <NavItem active={activePage === 'euai'} onClick={() => setActivePage('euai')} icon="🤖">
                EU AI Act
              </NavItem>
            </>
          )}
        </nav>

        {/* Settings at bottom */}
        <div className="mt-auto border-t border-white/10">
          <NavSection label={t.settings} />
          <NavItem active={activePage === 'escalation'} onClick={() => setActivePage('escalation')} icon="⚙">
            {t.escalation}
          </NavItem>
          <NavItem active={activePage === 'integrations'} onClick={() => setActivePage('integrations')} icon="🔗">
            {t.integrations}
          </NavItem>
          <NavItem active={activePage === 'settings'} onClick={() => setActivePage('settings')} icon="⚙">
            {t.settings}
          </NavItem>

          <div className="px-6 py-4 flex items-center gap-2.5 cursor-pointer hover:bg-white/5 transition-all">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center text-[13px] font-semibold">
              MK
            </div>
            <div className="text-[12.5px]">
              <div>Max Kellner</div>
              <div className="text-[11px] text-white/40">CISO · WellQ</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[260px] flex-1">
        {/* Top Bar */}
        <header className={`px-8 py-4 border-b transition-colors duration-300 ${darkMode ? 'bg-[#1A1D28] border-[#2A2E3D]' : 'bg-white border-[#E2E5EB]'}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3B0]" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent transition-colors ${
                    darkMode
                      ? 'bg-[#111318] border-[#2A2E3D] text-[#E4E7EE]'
                      : 'bg-[#F7F8FA] border-[#E2E5EB] text-[#1A1D26]'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className={`p-2 rounded-lg transition-colors relative ${darkMode ? 'hover:bg-[#2A2E3D]' : 'hover:bg-gray-100'}`}>
                <Bell className="w-5 h-5 text-[#5F6B7A]" />
                {notifications && <span className="absolute top-1 right-1 w-2 h-2 bg-[#E5484D] rounded-full" />}
              </button>

              <div className={`flex items-center gap-3 pl-4 border-l ${darkMode ? 'border-[#2A2E3D]' : 'border-[#E2E5EB]'}`}>
                <div className="text-right">
                  <div className={`font-medium text-sm ${darkMode ? 'text-[#E4E7EE]' : 'text-[#1A1D26]'}`}>Diego Vera</div>
                  <div className="text-xs text-[#9AA3B0]">{t.administrator}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-semibold">
                  DV
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-[1200px]">
          {activePage === 'dashboard' && <DashboardPage t={t} />}
          {activePage === 'understand' && <UnderstandPage t={t} />}
          {activePage === 'documents' && <DocumentsPage t={t} />}
          {activePage === 'risks' && <RisksPage t={t} />}
          {activePage === 'evidence' && <EvidencePage t={t} />}
          {activePage === 'findings' && <FindingsPage t={t} />}
          {activePage === 'audit' && <AuditPage t={t} />}
          {activePage === 'integrity' && <IntegrityPage t={t} />}
          {activePage === 'regfeed' && <RegFeedPage t={t} />}
          {activePage === 'settings' && (
            <SettingsPage
              t={t}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              language={language}
              setLanguage={setLanguage}
              dateFormat={dateFormat}
              setDateFormat={setDateFormat}
              notifications={notifications}
              setNotifications={setNotifications}
              autoSave={autoSave}
              setAutoSave={setAutoSave}
            />
          )}
        </div>
      </main>

      {/* Dani AI Chat Widget */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-7 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {showChat && (
        <div className={`fixed bottom-[88px] right-7 w-[370px] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden ${darkMode ? 'bg-[#1A1D28]' : 'bg-white'}`}>
          <div className="px-5 py-4 bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] text-white flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Dani AI</div>
              <div className="text-[11px] opacity-75">Online — Compliance Assistant</div>
            </div>
            <button onClick={() => setShowChat(false)} className="opacity-70 hover:opacity-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-4 max-h-[340px] overflow-y-auto space-y-2.5">
            {chatMessages.map((msg) => (
              <ChatBubble key={msg.id} ai={msg.isAi}>
                {msg.text}
              </ChatBubble>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className={`p-3 border-t flex gap-2 ${darkMode ? 'border-[#2A2E3D]' : 'border-[#E2E5EB]'}`}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.chatPlaceholder}
              className={`flex-1 px-3 py-2 border rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4F6EF7] ${
                darkMode
                  ? 'bg-[#111318] border-[#2A2E3D] text-[#E4E7EE]'
                  : 'bg-white border-[#E2E5EB] text-[#1A1D26]'
              }`}
            />
            <button
              onClick={handleSendMessage}
              className="px-3.5 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium hover:bg-[#3D5BE0] transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {t.send}
            </button>
          </div>
        </div>
      )}

      {/* Profile Overlay */}
      {showProfileOverlay && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-[90%] shadow-2xl">
            <h2 className="text-lg font-bold mb-2">Select Organization Profile</h2>
            <p className="text-[13px] text-[#5F6B7A] mb-5">
              Choose your organization's compliance maturity level to personalize recommendations.
            </p>
            <div className="space-y-2.5">
              {(['foundational', 'established', 'advanced', 'mature'] as Profile[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setProfile(p);
                    setShowProfileOverlay(false);
                  }}
                  className={`w-full p-4 border-2 rounded-xl flex items-center gap-3 transition-all hover:border-[#4F6EF7] hover:bg-[#EEF1FE] ${
                    profile === p ? 'border-[#4F6EF7] bg-[#EEF1FE]' : 'border-[#E2E5EB]'
                  }`}
                >
                  <div className="text-2xl">
                    {p === 'foundational' && '🌱'}
                    {p === 'established' && '🏗️'}
                    {p === 'advanced' && '🚀'}
                    {p === 'mature' && '⭐'}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-[13.5px] capitalize">{p}</div>
                    <div className="text-xs text-[#5F6B7A]">
                      {p === 'foundational' && 'Starting compliance journey'}
                      {p === 'established' && 'Basic controls in place'}
                      {p === 'advanced' && 'Mature program with testing'}
                      {p === 'mature' && 'Continuous improvement culture'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowProfileOverlay(false)}
              className="mt-5 w-full py-2.5 border border-[#E2E5EB] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Navigation Components
function NavSection({ label }: { label: string }) {
  return (
    <div className="px-5 pt-[18px] pb-2 text-[10px] uppercase tracking-[1.2px] text-white/30 font-semibold">
      {label}
    </div>
  );
}

interface NavItemProps {
  active?: boolean;
  completed?: boolean;
  onClick: () => void;
  icon: string | 'step';
  stepNum?: string;
  badge?: string;
  badgeType?: 'count' | 'warn';
  isLocked?: boolean;
  children: React.ReactNode;
}

function NavItem({ active, completed, onClick, icon, stepNum, badge, badgeType = 'count', children }: NavItemProps) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-[11px] px-5 py-2 mx-2 my-0.5 rounded-lg text-[13.5px] transition-all ${
          active
            ? 'bg-[#232E4A] text-white font-medium'
            : 'text-white/60 hover:bg-[#1A2340] hover:text-white/85'
        }`}
      >
        {icon === 'step' ? (
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
              completed
                ? 'bg-[#1DB954]'
                : active
                ? 'bg-[#4F6EF7]'
                : 'bg-white/8'
            }`}
          >
            {stepNum}
          </span>
        ) : (
          <span className="w-[18px] text-center text-[15px] flex-shrink-0">{icon}</span>
        )}
        <span className="flex-1 text-left">{children}</span>
        {badge && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              badgeType === 'warn'
                ? 'bg-[#F5A623] text-white'
                : 'bg-[#E5484D] text-white'
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    </div>
  );
}

function ChatBubble({ ai, children }: { ai?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
        ai
          ? 'bg-[#EEF1FE] dark:bg-[#1C2340] text-[#1A1D26] dark:text-[#E4E7EE] rounded-bl-sm'
          : 'bg-[#4F6EF7] text-white ml-auto rounded-br-sm'
      }`}
    >
      {children}
    </div>
  );
}

// Page Components
function DashboardPage({ t }: PageProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <h1 className="text-[22px] font-bold -tracking-[0.3px] text-[#1A1D26] dark:text-[#E4E7EE]">
          {t.dashboard} <span className="font-normal text-[#5F6B7A] dark:text-[#9AA3B4] text-sm ml-2">· WellQ Security Program</span>
        </h1>
        <div className="flex gap-2.5">
          <button className="px-4 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] bg-white dark:bg-[#1A1D28] rounded-lg text-[13px] hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-all flex items-center gap-2 text-[#1A1D26] dark:text-[#E4E7EE]">
            ⚙ {t.profile}: Established
          </button>
          <button className="px-4 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] bg-white dark:bg-[#1A1D28] rounded-lg text-[13px] hover:border-[#4F6EF7] hover:text-[#4F6EF7] transition-all flex items-center gap-2 text-[#1A1D26] dark:text-[#E4E7EE]">
            📄 {t.exportReport}
          </button>
          <button className="px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium hover:bg-[#3D5BE0] transition-all">
            + {t.addFramework}
          </button>
        </div>
      </div>

      {/* Framework Chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FrameworkChip active mandatory={false}>ISO 27001:2022</FrameworkChip>
        <FrameworkChip active mandatory>DORA</FrameworkChip>
        <FrameworkChip mandatory>GDPR</FrameworkChip>
        <FrameworkChip mandatory={false}>SOC 2 Type II</FrameworkChip>
        <FrameworkChip mandatory>NIS2</FrameworkChip>
        <FrameworkChip dashed>+ Add framework</FrameworkChip>
      </div>

      {/* Health Scores */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <HealthCard
          label={t.overallCompliance}
          value="72"
          color="blue"
          progress={72}
          badge={`🤖 ${t.autoTracked}`}
          badgeType="auto"
          delta={`↑ 4% ${t.fromLastMonth}`}
          deltaUp
        />
        <HealthCard
          label={`📄 ${t.documentation}`}
          value="92"
          color="green"
          progress={92}
          badge={`🤖 ${t.autoTracked}`}
          badgeType="auto"
          delta={`↑ 2% · 3 ${t.docsPending}`}
          deltaUp
        />
        <HealthCard
          label={`🔧 ${t.implementation}`}
          value="78"
          color="yellow"
          progress={78}
          badge={`👁 ${t.reviewNeeded}`}
          badgeType="review"
          delta={`↑ 6% · 8 ${t.controlsUnverified}`}
          deltaUp
        />
        <HealthCard
          label={`🧪 ${t.tested}`}
          value="45"
          color="red"
          progress={45}
          badge={`👤 ${t.humanRequired}`}
          badgeType="human"
          delta={`↓ 2% · 14 ${t.controlsUntested}`}
          deltaUp={false}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2">
          <ComplianceIntegrityCard />
        </div>
        <div>
          <RegulatoryFeedCard />
        </div>
      </div>

      <ControlsTable />

      <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
        <PriorityActionsCard />
        <PreAuditCard />
      </div>

      <HitLLegend />
    </div>
  );
}

interface PageProps {
  t: typeof translations['en'];
}

function UnderstandPage({ t }: PageProps) {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-[#1A1D26] dark:text-[#E4E7EE]">{t.gapAnalysis}</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label={t.totalGaps} value="24" sub={t.acrossFrameworks} />
        <StatCard label={t.criticalGaps} value="6" valueColor="text-[#E5484D]" sub={t.requireAction} />
        <StatCard label={t.gapsClosed} value="18 / 24" valueColor="text-[#1DB954]" sub={`75% ${t.progress}`} />
      </div>
      <Card title={t.gapAnalysis}>
        <p className="text-sm text-[#5F6B7A]">Detailed gap analysis coming soon...</p>
      </Card>
    </div>
  );
}

function DocumentsPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [procedureText, setProcedureText] = useState('');
  const [policyText, setPolicyText] = useState('');

  const steps = [
    { num: 1, title: 'Selección de Controles', shortTitle: 'Controles' },
    { num: 2, title: 'Redacción de Procedimientos', shortTitle: 'Procedimientos' },
    { num: 3, title: 'Política Final', shortTitle: 'Política' },
  ];

  const technicalControls = [
    { id: 'mfa', label: 'Autenticación Multifactor (MFA)', technical: 'A.9.4.2' },
    { id: 'encryption', label: 'Encriptación de Datos en Tránsito y Reposo', technical: 'A.10.1.1' },
    { id: 'logging', label: 'Registro y Monitoreo de Eventos de Seguridad', technical: 'A.12.4.1' },
    { id: 'backup', label: 'Respaldos Automatizados y Recuperación', technical: 'A.12.3.1' },
    { id: 'patching', label: 'Gestión de Vulnerabilidades y Parches', technical: 'A.12.6.1' },
  ];

  const toggleControl = (controlId: string) => {
    setSelectedControls((prev) =>
      prev.includes(controlId)
        ? prev.filter((id) => id !== controlId)
        : [...prev, controlId]
    );
  };

  const handleNextStep = () => {
    if (activeStep === 0 && selectedControls.length > 0) {
      // Avanzar al paso 2 y marcar paso 1 como completado
      setCompletedSteps([...completedSteps, 0]);
      setActiveStep(1);

      // Generar procedimiento automático basado en controles seleccionados
      const selectedLabels = selectedControls.map(id =>
        technicalControls.find(c => c.id === id)?.label
      ).filter(Boolean);

      setProcedureText(`PROCEDIMIENTO OPERATIVO - CONTROLES DE SEGURIDAD

1. ALCANCE
Este procedimiento define las actividades operativas necesarias para implementar y mantener los siguientes controles técnicos:
${selectedLabels.map((label, i) => `${i + 1}. ${label}`).join('\n')}

2. RESPONSABILIDADES
- CISO: Aprobación y supervisión del cumplimiento
- Equipo de Seguridad: Implementación y monitoreo
- Administradores de Sistemas: Ejecución de controles técnicos

3. PROCEDIMIENTOS ESPECÍFICOS
${selectedLabels.map((label, i) => `
3.${i + 1}. ${label}
   - Configuración: [Definir parámetros técnicos]
   - Monitoreo: [Establecer métricas y alertas]
   - Revisión: [Frecuencia de auditoría]
`).join('\n')}

4. REGISTROS Y EVIDENCIAS
Se mantendrán logs de todas las actividades relacionadas con estos controles por un período mínimo de 12 meses.`);
    } else if (activeStep === 1 && procedureText.trim().length > 0) {
      // Avanzar al paso 3 y marcar paso 2 como completado
      setCompletedSteps([...completedSteps, 1]);
      setActiveStep(2);

      // Generar política de alto nivel
      setPolicyText(`POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN

VERSIÓN: 1.0
FECHA: ${new Date().toLocaleDateString('es-ES')}
CLASIFICACIÓN: Interna

1. OBJETIVO
Establecer el marco de gobierno para los controles de seguridad técnica implementados en la organización, garantizando la confidencialidad, integridad y disponibilidad de los activos de información.

2. ALCANCE
Esta política aplica a todos los sistemas, aplicaciones y datos corporativos que requieren protección mediante controles técnicos de seguridad.

3. DECLARACIÓN DE POLÍTICA
La Dirección establece que:
- Todos los controles técnicos deben implementarse según estándares internacionales (ISO 27001)
- Se mantendrá evidencia documental de su efectividad
- El cumplimiento será auditado de forma periódica
- Las desviaciones requerirán aprobación del CISO

4. ROLES Y RESPONSABILIDADES
- Alta Dirección: Aprobar recursos y presupuesto
- CISO: Definir y supervisar la implementación
- Responsables de TI: Ejecutar y mantener controles

5. REVISIÓN
Esta política será revisada anualmente o ante cambios significativos en el entorno de amenazas.

APROBADO POR: [Nombre del CEO/CISO]
FIRMA: _______________
FECHA: ${new Date().toLocaleDateString('es-ES')}`);
    }
  };

  const canProceed = () => {
    if (activeStep === 0) return selectedControls.length >= 2;
    if (activeStep === 1) return procedureText.trim().length > 0;
    return false;
  };

  const isStepCompleted = (stepIndex: number) => completedSteps.includes(stepIndex);
  const isStepLocked = (_stepIndex: number) => false;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D26] dark:text-[#E4E7EE]">
            Bottom-Up Policy Generator
          </h1>
          <p className="text-sm text-[#5F6B7A] dark:text-[#9AA3B0] mt-1">
            Construye tu política de seguridad desde los controles técnicos
          </p>
        </div>
      </div>

      {/* Stepper Horizontal Minimalista */}
      <div className="mb-8 bg-white dark:bg-[#1A1D28] border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-lg p-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1 relative group">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
                    isStepCompleted(index)
                      ? 'bg-[#1DB954] border-[#1DB954] text-white'
                      : index === activeStep
                      ? 'bg-[#4F6EF7] border-[#4F6EF7] text-white shadow-lg shadow-[#4F6EF7]/30'
                      : 'bg-white dark:bg-[#1A1D28] border-[#E2E5EB] dark:border-[#2A2E3D] text-[#5F6B7A]'
                  }`}
                >
                  {isStepCompleted(index) ? '✓' : step.num}
                </div>
                <div className={`mt-3 text-xs font-semibold text-center max-w-[120px] ${
                  isStepCompleted(index)
                    ? 'text-[#1DB954]'
                    : index === activeStep
                    ? 'text-[#4F6EF7]'
                    : 'text-[#5F6B7A] dark:text-[#9AA3B0]'
                }`}>
                  {step.shortTitle}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-[2px] flex-1 mx-4 transition-all ${
                  isStepCompleted(index)
                    ? 'bg-[#1DB954]'
                    : index < activeStep
                    ? 'bg-[#4F6EF7]'
                    : 'bg-[#E2E5EB] dark:bg-[#2A2E3D]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenido del Paso Activo */}
      {activeStep === 0 && (
        <Card title="Paso 1: Selección de Controles Técnicos">
          <div className="space-y-3">
            <p className="text-sm text-[#5F6B7A] dark:text-[#9AA3B0] mb-4">
              Selecciona al menos 2 controles técnicos implementados en tu organización:
            </p>
            {technicalControls.map((control) => (
              <label
                key={control.id}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedControls.includes(control.id)
                    ? 'border-[#4F6EF7] bg-[#4F6EF7]/5'
                    : 'border-[#E2E5EB] dark:border-[#2A2E3D] hover:border-[#4F6EF7]/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedControls.includes(control.id)}
                  onChange={() => toggleControl(control.id)}
                  className="w-5 h-5 rounded border-[#E2E5EB] dark:border-[#2A2E3D] text-[#4F6EF7] focus:ring-[#4F6EF7]"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#1A1D26] dark:text-[#E4E7EE]">{control.label}</div>
                  <div className="text-xs text-[#9AA3B0] mt-0.5">ISO 27001: {control.technical}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-[#5F6B7A] dark:text-[#9AA3B0]">
              {selectedControls.length} de {technicalControls.length} controles seleccionados
            </div>
            <button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="px-8 py-3 bg-[#4F6EF7] text-white rounded-lg text-sm font-semibold hover:bg-[#3D5BE0] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
            >
              Validar y Generar Siguiente Fase →
            </button>
          </div>
        </Card>
      )}

      {activeStep === 1 && (
        <Card title="Paso 2: Redacción de Procedimientos Operativos">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="px-2 py-1 bg-[#1DB954]/10 text-[#1DB954] rounded text-xs font-semibold">
                ✓ Controles Validados: {selectedControls.length}
              </div>
              <div className="text-[#5F6B7A] dark:text-[#9AA3B0]">
                Procedimiento generado automáticamente por DANI IA
              </div>
            </div>
            <textarea
              value={procedureText}
              onChange={(e) => setProcedureText(e.target.value)}
              rows={16}
              className="w-full px-4 py-3 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent transition-colors resize-none bg-[#F7F8FA] dark:bg-[#111318] border-[#E2E5EB] dark:border-[#2A2E3D] text-[#1A1D26] dark:text-[#E4E7EE]"
              placeholder="El procedimiento operativo se generará automáticamente..."
            />
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => {
                setActiveStep(0);
                setCompletedSteps(completedSteps.filter(s => s !== 0));
              }}
              className="px-4 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-lg text-sm hover:border-[#4F6EF7] transition-all text-[#5F6B7A] dark:text-[#9AA3B0]"
            >
              ← Volver
            </button>
            <button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="px-8 py-3 bg-[#4F6EF7] text-white rounded-lg text-sm font-semibold hover:bg-[#3D5BE0] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
            >
              Validar y Generar Siguiente Fase →
            </button>
          </div>
        </Card>
      )}

      {activeStep === 2 && (
        <Card title="Paso 3: Política Ejecutiva Final">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="px-2 py-1 bg-[#1DB954]/10 text-[#1DB954] rounded text-xs font-semibold">
                ✓ Procedimientos Completados
              </div>
              <div className="text-[#5F6B7A] dark:text-[#9AA3B0]">
                Política de alto nivel lista para aprobación ejecutiva
              </div>
            </div>
            <textarea
              value={policyText}
              onChange={(e) => setPolicyText(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-transparent transition-colors resize-none bg-[#F7F8FA] dark:bg-[#111318] border-[#E2E5EB] dark:border-[#2A2E3D] text-[#1A1D26] dark:text-[#E4E7EE]"
              placeholder="La política ejecutiva se generará automáticamente..."
            />
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => {
                setActiveStep(1);
                setCompletedSteps(completedSteps.filter(s => s !== 1));
              }}
              className="px-4 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-lg text-sm hover:border-[#4F6EF7] transition-all text-[#5F6B7A] dark:text-[#9AA3B0]"
            >
              ← Volver
            </button>
            <button
              className="px-8 py-3 bg-[#1DB954] text-white rounded-lg text-sm font-semibold hover:bg-[#1AA34A] transition-all shadow-lg"
            >
              ✓ Finalizar y Exportar Política
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

function RisksPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Risk Map</h1>
        <button className="px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium">
          + Add Risk
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Risks" value="24" sub="Across 4 categories" />
        <StatCard label="High / Critical" value="6" valueColor="text-[#E5484D]" sub="3 need immediate treatment" />
        <StatCard label="With Treatment Plans" value="18 / 24" valueColor="text-[#1DB954]" sub="75% coverage" />
      </div>
      <Card title="🛡 Risk Register">
        <p className="text-sm text-[#5F6B7A]">Risk management interface coming soon...</p>
      </Card>
    </div>
  );
}

function EvidencePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Evidence Center</h1>
        <button className="px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium">
          + Upload Evidence
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Evidence Items" value="142" sub="Across 93 controls" />
        <StatCard label="Auto-Collected" value="87" valueColor="text-[#1DB954]" sub="From AWS, Azure, Okta" />
        <StatCard label="Effectiveness Evidence" value="12" valueColor="text-[#E5484D]" sub="Pen tests, drills" />
      </div>
      <Card title="📦 Evidence by Type">
        <p className="text-sm text-[#5F6B7A]">Evidence tracking interface coming soon...</p>
      </Card>
    </div>
  );
}

function FindingsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">CAPA Tracker</h1>
        <button className="px-4 py-2 bg-[#4F6EF7] text-white rounded-lg text-[13px] font-medium">
          + New CAPA
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Open CAPAs" value="8" valueColor="text-[#E5484D]" sub="3 overdue" />
        <StatCard label="Avg. Resolution Time" value="32 days" sub="Target: 30 days" />
        <StatCard label="Closed This Quarter" value="14" valueColor="text-[#1DB954]" sub="vs. 11 last quarter" />
      </div>
      <Card title="🔧 Open Corrective Actions">
        <CAPATable />
      </Card>
    </div>
  );
}

function IntegrityPage({ t }: PageProps) {
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6 text-[#1A1D26] dark:text-[#E4E7EE]">{t.integrity}</h1>
      <Card title="⚠ Active Alerts" titleColor="text-[#E5484D]" borderColor="border-l-4 border-l-[#E5484D]">
        <div className="space-y-2.5">
          <ComplianceAlert
            severity="high"
            title="12 controls marked 'Implemented' have no effectiveness test in last 12 months"
            meta="Affects: A.5.24, A.8.13, A.5.15 + 9 more · Severity: High"
            expanded={expandedAlert === 0}
            onToggle={() => setExpandedAlert(expandedAlert === 0 ? null : 0)}
          >
            <div className="space-y-2 text-xs">
              <DetailRow label="Affected Controls" value="A.5.24, A.8.13, A.5.15, A.5.29, A.8.9, A.8.1" />
              <DetailRow label="Last Test" value="None in last 12 months" valueColor="text-[#E5484D]" />
              <DetailRow label="Risk Level" value="High — Audit finding likely" valueColor="text-[#E5484D]" />
              <div className="flex gap-2 pt-2 border-t border-[#E2E5EB] dark:border-[#2A2E3D]">
                <button className="px-3 py-1.5 bg-[#4F6EF7] text-white rounded text-xs font-medium hover:bg-[#3D5BE0] transition-colors">Schedule Tests</button>
                <button className="px-3 py-1.5 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded text-xs text-[#1A1D26] dark:text-[#E4E7EE] hover:bg-gray-100 dark:hover:bg-[#2A2E3D] transition-colors">Assign to Team</button>
              </div>
            </div>
          </ComplianceAlert>

          <ComplianceAlert
            severity="high"
            title="Access control policy approved 14 months ago — no quarterly access review occurring"
            meta="Control: A.5.15 · Expected: Q4 2025 review · Severity: High"
            expanded={expandedAlert === 1}
            onToggle={() => setExpandedAlert(expandedAlert === 1 ? null : 1)}
          >
            <div className="space-y-2 text-xs">
              <DetailRow label="Control" value="A.5.15 — Access Control" />
              <DetailRow label="Policy Approved" value="Jan 15, 2025 (14 months ago)" />
              <DetailRow label="Reviews Completed" value="0 of 4 expected" valueColor="text-[#E5484D]" />
              <div className="flex gap-2 pt-2 border-t border-[#E2E5EB] dark:border-[#2A2E3D]">
                <button className="px-3 py-1.5 bg-[#4F6EF7] text-white rounded text-xs font-medium hover:bg-[#3D5BE0] transition-colors">Start Access Review</button>
                <button className="px-3 py-1.5 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded text-xs text-[#1A1D26] dark:text-[#E4E7EE] hover:bg-gray-100 dark:hover:bg-[#2A2E3D] transition-colors">View Policy</button>
              </div>
            </div>
          </ComplianceAlert>

          <ComplianceAlert
            severity="medium"
            title="Overall score is 72% but 0% of critical controls tested under real conditions"
            meta="Critical controls: A.5.24, A.8.13 · Severity: Medium"
            expanded={expandedAlert === 2}
            onToggle={() => setExpandedAlert(expandedAlert === 2 ? null : 2)}
          >
            <div className="space-y-2 text-xs">
              <DetailRow label="Overall Health Score" value="72%" />
              <DetailRow label="Critical Controls Tested" value="0%" valueColor="text-[#E5484D]" />
              <div className="flex gap-2 pt-2 border-t border-[#E2E5EB] dark:border-[#2A2E3D]">
                <button className="px-3 py-1.5 bg-[#4F6EF7] text-white rounded text-xs font-medium hover:bg-[#3D5BE0] transition-colors">Plan Testing Sprint</button>
              </div>
            </div>
          </ComplianceAlert>
        </div>
      </Card>
    </div>
  );
}

function RegFeedPage({ t }: PageProps) {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6 text-[#1A1D26] dark:text-[#E4E7EE]">{t.regfeed}</h1>
      <Card title="📢 Latest Updates">
        <div className="space-y-4">
          <RegItem
            icon="🕐"
            iconBg="bg-[#FEECEE]"
            iconColor="text-[#E5484D]"
            title="DORA TLPT deadline"
            description="Significant entities must complete first round by Q2 2026."
            date="Deadline: Jun 30, 2026 · 92 days left"
          />
          <RegItem
            icon="📋"
            iconBg="bg-[#EEF1FE]"
            iconColor="text-[#4F6EF7]"
            title="NIS2 transposition update"
            description="Spain published national transposition with sector-specific annexes."
            date="Published: Mar 14, 2026 · Affects your profile"
          />
          <RegItem
            icon="✓"
            iconBg="bg-[#E8F9EF]"
            iconColor="text-[#1DB954]"
            title="ISO 27001:2022"
            description="No changes. Next review cycle: 2028."
            date="Status: Current · No action needed"
          />
        </div>
      </Card>
    </div>
  );
}

interface SettingsPageProps {
  t: typeof translations['en'];
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  language: Language;
  setLanguage: (v: Language) => void;
  dateFormat: DateFormat;
  setDateFormat: (v: DateFormat) => void;
  notifications: boolean;
  setNotifications: (v: boolean) => void;
  autoSave: boolean;
  setAutoSave: (v: boolean) => void;
}

function SettingsPage({
  t,
  darkMode,
  setDarkMode,
  language,
  setLanguage,
  dateFormat,
  setDateFormat,
  notifications,
  setNotifications,
  autoSave,
  setAutoSave,
}: SettingsPageProps) {
  const [selectedAccount, setSelectedAccount] = useState('diego');
  const [selectedPlan, setSelectedPlan] = useState<'basico' | 'pro' | 'enterprise'>('enterprise');

  const accounts = [
    { id: 'diego', name: 'Diego Vera', role: 'CISO', company: 'SecureBank SA', plan: 'enterprise' as const },
    { id: 'camilo', name: 'Camilo Valenzuela', role: 'Security Manager', company: 'FinTech Corp', plan: 'enterprise' as const },
    { id: 'angelo', name: 'Angelo González', role: 'Compliance Lead', company: 'DataProtect Inc', plan: 'enterprise' as const },
    { id: 'nicolas', name: 'Nicolás Rosales', role: 'CTO', company: 'TechSolutions', plan: 'enterprise' as const },
  ];

  const languageNames = {
    en: 'English',
    es: 'Español',
    pt: 'Português',
    de: 'Deutsch',
    fr: 'Français',
  };

  const dateFormatNames = {
    dmy: 'DD/MM/YYYY',
    mdy: 'MM/DD/YYYY',
    ymd: 'YYYY-MM-DD',
  };

  // Actualizar el plan cuando cambia la cuenta
  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setSelectedPlan(account.plan);
    }
  };

  const currentAccount = accounts.find(a => a.id === selectedAccount);

  const plans = [
    {
      id: 'basico' as const,
      name: 'Básico',
      price: '$49',
      period: '/mes',
      description: 'Para equipos pequeños comenzando con compliance',
      features: [
        'Hasta 3 usuarios',
        'Gap Analysis básico',
        'Generación de documentos',
        'Soporte por email',
        '50 controles máximo',
      ],
      locked: ['Auditoría IA', 'Risk Map'],
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: '$199',
      period: '/mes',
      description: 'Para organizaciones en crecimiento',
      features: [
        'Usuarios ilimitados',
        'Auditoría IA completa',
        'Risk Map avanzado',
        'Integraciones premium',
        'Soporte prioritario 24/7',
        'Controles ilimitados',
      ],
      locked: [],
      popular: true,
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: 'Personalizado',
      period: '',
      description: 'Para grandes empresas con necesidades complejas',
      features: [
        'Todo de Pro incluido',
        'SSO y SAML',
        'Account manager dedicado',
        'SLA personalizado',
        'Onboarding guiado',
        'Auditorías on-premise',
      ],
      locked: [],
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6 text-[#1A1D26] dark:text-[#E4E7EE]">{t.settings}</h1>

      {/* Sección de Suscripción */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-[#1A1D26] dark:text-[#E4E7EE]">💳 Gestión de Suscripción</h2>

        {/* Selector de Cuenta */}
        <div className="mb-6 bg-white dark:bg-[#1A1D28] border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-xl p-6">
          <label className="block text-sm font-semibold mb-3 text-[#1A1D26] dark:text-[#E4E7EE]">
            👤 Seleccionar Cuenta
          </label>
          <div className="grid grid-cols-2 gap-3">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleAccountChange(account.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedAccount === account.id
                    ? 'border-[#4F6EF7] bg-[#4F6EF7]/5 dark:bg-[#4F6EF7]/10'
                    : 'border-[#E2E5EB] dark:border-[#2A2E3D] hover:border-[#4F6EF7]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm">
                    {account.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">
                      {account.name}
                    </div>
                    <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B0]">
                      {account.role} · {account.company}
                    </div>
                    <div className="mt-1 inline-block px-2 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-semibold rounded">
                      Plan Personalizado
                    </div>
                  </div>
                  {selectedAccount === account.id && (
                    <div className="w-5 h-5 rounded-full bg-[#4F6EF7] flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {currentAccount && (
            <div className="mt-4 p-3 bg-[#4F6EF7]/5 dark:bg-[#4F6EF7]/10 rounded-lg border border-[#4F6EF7]/20">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#4F6EF7]">ℹ</span>
                <span className="text-[#1A1D26] dark:text-[#E4E7EE]">
                  Actualmente viendo como: <strong>{currentAccount.name}</strong> con acceso completo a todas las funcionalidades
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Comparativa de Planes */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-xl p-6 transition-all cursor-pointer ${
                selectedPlan === plan.id
                  ? 'border-[#4F6EF7] bg-[#4F6EF7]/5 dark:bg-[#4F6EF7]/10'
                  : 'border-[#E2E5EB] dark:border-[#2A2E3D] hover:border-[#4F6EF7]/50'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#4F6EF7] text-white text-xs font-semibold rounded-full">
                  Más Popular
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-[#1A1D26] dark:text-[#E4E7EE] mb-1">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-[#1A1D26] dark:text-[#E4E7EE]">{plan.price}</span>
                  <span className="text-sm text-[#5F6B7A] dark:text-[#9AA3B0]">{plan.period}</span>
                </div>
                <p className="text-xs text-[#5F6B7A] dark:text-[#9AA3B0] mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-[#1DB954] mt-0.5">✓</span>
                    <span className="text-[#1A1D26] dark:text-[#E4E7EE]">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedPlan === plan.id
                    ? 'bg-[#4F6EF7] text-white'
                    : 'bg-white dark:bg-[#1A1D28] border border-[#E2E5EB] dark:border-[#2A2E3D] text-[#1A1D26] dark:text-[#E4E7EE] hover:border-[#4F6EF7]'
                }`}
              >
                {selectedPlan === plan.id ? 'Plan Actual' : 'Seleccionar Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Preview */}
        <div className="bg-white dark:bg-[#1A1D28] border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">
              Vista Previa: Módulos Disponibles con Plan {plans.find(p => p.id === selectedPlan)?.name}
            </h3>
            {selectedPlan === 'enterprise' && (
              <div className="px-3 py-1 bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-semibold rounded-full">
                🔓 Acceso Total
              </div>
            )}
          </div>

          <div className="bg-[#0F1729] rounded-lg p-4 max-w-xs">
            <div className="text-[10px] uppercase tracking-[1.2px] text-white/30 font-semibold mb-3">
              Módulos Principales
            </div>

            <div className="space-y-1">
              <SidebarPreviewItem
                label="Dashboard"
                icon="📊"
                locked={false}
                active={false}
                selectedPlan={selectedPlan}
              />
              <SidebarPreviewItem
                label="Gap Analysis"
                icon="🔍"
                locked={false}
                active={false}
                selectedPlan={selectedPlan}
              />
              <SidebarPreviewItem
                label="Risk Map"
                icon="🛡️"
                locked={selectedPlan === 'basico'}
                active={selectedPlan === 'pro' || selectedPlan === 'enterprise'}
                selectedPlan={selectedPlan}
              />
              <SidebarPreviewItem
                label="Auditoría IA"
                icon="🤖"
                locked={selectedPlan === 'basico'}
                active={selectedPlan === 'pro' || selectedPlan === 'enterprise'}
                selectedPlan={selectedPlan}
              />
              <SidebarPreviewItem
                label="Evidence Center"
                icon="📦"
                locked={false}
                active={false}
                selectedPlan={selectedPlan}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resto de configuraciones existentes */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card title={`🌐 ${t.languageRegion}`}>
          <div className="space-y-4">
            <SettingRow
              label={t.interfaceLanguage}
              sub={t.controlsUI}
            >
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="px-3 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] dark:text-[#E4E7EE] text-[#1A1D26] w-[160px] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-[#4F6EF7] cursor-pointer"
                style={{ appearance: 'auto' }}
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </SettingRow>
            <SettingRow label="Date Format" sub="How dates are displayed">
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                className="px-3 py-2 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] text-[#1A1D26] dark:text-[#E4E7EE] w-[160px] focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] focus:border-[#4F6EF7] cursor-pointer"
                style={{ appearance: 'auto' }}
              >
                {Object.entries(dateFormatNames).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </SettingRow>
            <SettingRow label="Timezone" sub="Your local timezone">
              <select className="px-3 py-1.5 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] dark:text-[#E4E7EE] min-w-[140px] focus:outline-none focus:ring-1 focus:ring-[#4F6EF7]">
                <option>UTC</option>
                <option>Europe/Madrid</option>
                <option>America/New_York</option>
                <option>America/Sao_Paulo</option>
                <option>Europe/Berlin</option>
              </select>
            </SettingRow>
          </div>
        </Card>

        <Card title="🎨 Appearance">
          <div className="space-y-4">
            <SettingRow label="Dark Mode" sub="Toggle dark theme">
              <Toggle value={darkMode} onChange={setDarkMode} />
            </SettingRow>
            <SettingRow label="Compact View" sub="Reduce spacing in tables">
              <Toggle value={false} onChange={() => {}} />
            </SettingRow>
            <SettingRow label="Show Sidebar Labels" sub="Display text in navigation">
              <Toggle value={true} onChange={() => {}} />
            </SettingRow>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="🔔 Notifications">
          <div className="space-y-4">
            <SettingRow label="Email Notifications" sub="Receive compliance alerts via email">
              <Toggle value={notifications} onChange={setNotifications} />
            </SettingRow>
            <SettingRow label="CAPA Reminders" sub="Notifications for overdue CAPAs">
              <Toggle value={true} onChange={() => {}} />
            </SettingRow>
            <SettingRow label="Regulatory Updates" sub="Alert on new regulatory changes">
              <Toggle value={true} onChange={() => {}} />
            </SettingRow>
            <SettingRow label="Audit Deadlines" sub="Reminders before audit dates">
              <Toggle value={true} onChange={() => {}} />
            </SettingRow>
          </div>
        </Card>

        <Card title="⚙️ System">
          <div className="space-y-4">
            <SettingRow label="Auto-Save" sub="Automatically save changes">
              <Toggle value={autoSave} onChange={setAutoSave} />
            </SettingRow>
            <SettingRow label="Offline Mode" sub="Enable offline access to data">
              <Toggle value={false} onChange={() => {}} />
            </SettingRow>
            <SettingRow label="Data Export Format" sub="Default format for reports">
              <select className="px-3 py-1.5 border border-[#E2E5EB] dark:border-[#2A2E3D] rounded-md text-sm bg-white dark:bg-[#111318] dark:text-[#E4E7EE] min-w-[140px] focus:outline-none focus:ring-1 focus:ring-[#4F6EF7]">
                <option>PDF</option>
                <option>Excel (XLSX)</option>
                <option>CSV</option>
                <option>JSON</option>
              </select>
            </SettingRow>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Utility Components
function FrameworkChip({ active, mandatory, dashed, children }: { active?: boolean; mandatory?: boolean; dashed?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
        dashed
          ? 'border border-dashed border-[#9AA3B0] text-[#9AA3B0]'
          : active
          ? 'border border-[#4F6EF7] bg-[#EEF1FE] text-[#4F6EF7]'
          : 'border border-[#E2E5EB] bg-white text-[#5F6B7A] hover:border-[#4F6EF7]'
      }`}
    >
      {!dashed && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${mandatory ? 'bg-[#E5484D]' : 'bg-[#1DB954]'}`} />
      )}
      {children}
    </div>
  );
}

interface HealthCardProps {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
  progress: number;
  badge?: string;
  badgeType?: 'auto' | 'review' | 'human';
  delta: string;
  deltaUp: boolean;
}

function HealthCard({ label, value, color, progress, badge, badgeType, delta, deltaUp }: HealthCardProps) {
  const colors = {
    blue: { text: 'text-[#4F6EF7] dark:text-[#6B8AFF]', bg: 'bg-gradient-to-r from-[#4F6EF7] to-[#818CF8]' },
    green: { text: 'text-[#1DB954] dark:text-[#34D969]', bg: 'bg-gradient-to-r from-[#1DB954] to-[#4ADE80]' },
    yellow: { text: 'text-[#F5A623] dark:text-[#F5B740]', bg: 'bg-gradient-to-r from-[#F5A623] to-[#FBBF24]' },
    red: { text: 'text-[#E5484D] dark:text-[#F06669]', bg: 'bg-gradient-to-r from-[#E5484D] to-[#F87171]' },
  };

  const badgeColors = {
    auto: 'bg-[#E8F4FD] dark:bg-[#132838] text-[#1B8BD1] dark:text-[#5CB8F0]',
    review: 'bg-[#FFF7E6] dark:bg-[#2A2210] text-[#B47A14] dark:text-[#F5B740]',
    human: 'bg-[#FEECEE] dark:bg-[#2A1214] text-[#E5484D] dark:text-[#F06669]',
  };

  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] p-5 shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] relative transition-colors">
      {badge && badgeType && (
        <div className={`absolute top-3 right-3 text-[10px] px-2 py-1 rounded font-semibold ${badgeColors[badgeType]}`}>
          {badge}
        </div>
      )}
      <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B4] font-medium mb-2">{label}</div>
      <div className={`text-[32px] font-bold -tracking-[1px] ${colors[color].text}`}>
        {value}<span className="text-lg font-normal">%</span>
      </div>
      <div className="h-1.5 bg-[#E2E5EB] dark:bg-[#2A2E3D] rounded-full overflow-hidden mt-3 mb-1.5">
        <div className={`h-full ${colors[color].bg} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
      </div>
      <div className={`text-[11px] font-medium ${deltaUp ? 'text-[#1DB954] dark:text-[#34D969]' : 'text-[#E5484D] dark:text-[#F06669]'}`}>
        {delta}
      </div>
    </div>
  );
}

function ComplianceIntegrityCard() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] border-l-4 border-l-[#E5484D] overflow-hidden transition-colors">
      <div className="px-5 py-4 border-b border-[#E2E5EB] dark:border-[#2A2E3D] bg-[#FEECEE]/30 dark:bg-[#2A1214]/30">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#E5484D] dark:text-[#F06669]">⚠ Compliance Integrity Alerts</h3>
          <button className="text-xs text-[#4F6EF7] dark:text-[#6B8AFF] font-medium hover:underline">View all 6 alerts →</button>
        </div>
      </div>
      <div className="p-5 space-y-2.5">
        <ComplianceAlert
          severity="high"
          title="12 controls marked 'Implemented' have no effectiveness test in last 12 months"
          meta="Affects: A.5.24, A.8.13, A.5.15 + 9 more · Severity: High"
          expanded={expanded === 0}
          onToggle={() => setExpanded(expanded === 0 ? null : 0)}
        />
        <ComplianceAlert
          severity="high"
          title="Access control policy approved 14 months ago — no evidence of quarterly access review"
          meta="Control: A.5.15 · Expected: Q4 2025 review · Severity: High"
          expanded={expanded === 1}
          onToggle={() => setExpanded(expanded === 1 ? null : 1)}
        />
        <ComplianceAlert
          severity="medium"
          title="Overall score is 72% but 0% of critical controls have been tested under real conditions"
          meta="Critical controls: A.5.24, A.8.13 · Severity: Medium"
          expanded={expanded === 2}
          onToggle={() => setExpanded(expanded === 2 ? null : 2)}
        />
      </div>
    </div>
  );
}

function ComplianceAlert({ severity, title, meta, expanded, onToggle, children }: {
  severity: 'high' | 'medium';
  title: string;
  meta: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="p-3.5 rounded-lg bg-[#FAFAFA] dark:bg-[#1E2030] border border-[#E2E5EB] dark:border-[#2A2E3D] cursor-pointer hover:border-[#E5484D] transition-all"
      onClick={onToggle}
    >
      <div className="flex gap-2.5 items-start">
        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severity === 'high' ? 'bg-[#E5484D]' : 'bg-[#F5A623]'}`} />
        <div className="flex-1">
          <div className="text-[12.5px] font-medium leading-relaxed text-[#1A1D26] dark:text-[#E4E7EE]">{title}</div>
          <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] mt-1">{meta}</div>
          {expanded && children && (
            <div className="mt-3 pt-3 border-t border-[#E2E5EB] dark:border-[#2A2E3D]">
              {children}
            </div>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#9AA3B0] dark:text-[#646D7D] transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </div>
    </div>
  );
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-[#9AA3B0] dark:text-[#646D7D] font-medium">{label}</span>
      <span className={`font-semibold ${valueColor || 'text-[#1A1D26] dark:text-[#E4E7EE]'}`}>{value}</span>
    </div>
  );
}

function RegulatoryFeedCard() {
  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] overflow-hidden transition-colors">
      <div className="px-5 py-4 border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">📢 Regulatory Feed</h3>
          <button className="text-xs text-[#4F6EF7] dark:text-[#6B8AFF] font-medium hover:underline">View all →</button>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <RegItem
          icon="🕐"
          iconBg="bg-[#FEECEE]"
          iconColor="text-[#E5484D]"
          title="DORA TLPT deadline"
          description="Significant entities must complete first round by Q2 2026."
          date="Deadline: Jun 30, 2026 · 92 days left"
        />
        <RegItem
          icon="📋"
          iconBg="bg-[#EEF1FE]"
          iconColor="text-[#4F6EF7]"
          title="NIS2 transposition update"
          description="Spain published national transposition."
          date="Published: Mar 14, 2026"
        />
        <RegItem
          icon="✓"
          iconBg="bg-[#E8F9EF]"
          iconColor="text-[#1DB954]"
          title="ISO 27001:2022"
          description="No changes. Next review: 2028."
          date="Status: Current"
        />
      </div>
    </div>
  );
}

function RegItem({ icon, iconBg, iconColor, title, description, date }: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  date: string;
}) {
  return (
    <div className="flex gap-3 pb-3 border-b border-[#F3F4F6] dark:border-[#252838] last:border-0 last:pb-0">
      <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center text-sm flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[12.5px] leading-relaxed text-[#1A1D26] dark:text-[#E4E7EE]">
          <strong className="font-semibold">{title}</strong> — {description}
        </div>
        <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] mt-0.5">{date}</div>
      </div>
    </div>
  );
}

function ControlsTable() {
  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] overflow-hidden mb-6 transition-colors">
      <div className="px-5 py-4 border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1A1D26] dark:text-[#E4E7EE]">🎯 Control Status — Cross-Framework View</h3>
          <button className="text-xs text-[#4F6EF7] dark:text-[#6B8AFF] font-medium hover:underline">View SOA →</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Control</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Description</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Documented</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Implemented</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Tested</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Frameworks</th>
            </tr>
          </thead>
          <tbody>
            <ControlRow
              id="A.5.15"
              desc="Access control"
              doc="done"
              impl="partial"
              tested="overdue"
              frameworks={['ISO', 'DORA', 'NIS2']}
            />
            <ControlRow
              id="A.5.24"
              desc="Incident management"
              doc="done"
              impl="done"
              tested="not-tested"
              frameworks={['ISO', 'DORA']}
            />
            <ControlRow
              id="A.8.13"
              desc="Information backup"
              doc="done"
              impl="done"
              tested="scheduled"
              frameworks={['ISO', 'DORA']}
            />
            <ControlRow
              id="A.8.24"
              desc="Use of cryptography"
              doc="done"
              impl="done"
              tested="passed"
              frameworks={['ISO', 'PCI', 'DORA']}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ControlRow({ id, desc, doc, impl, tested, frameworks }: {
  id: string;
  desc: string;
  doc: string;
  impl: string;
  tested: string;
  frameworks: string[];
}) {
  return (
    <tr className="border-b border-[#F3F4F6] dark:border-[#252838] hover:bg-[#FAFBFC] dark:hover:bg-[#1E2130]">
      <td className="px-5 py-3 font-semibold text-[#4F6EF7] dark:text-[#6B8AFF]">{id}</td>
      <td className="px-5 py-3 text-[#1A1D26] dark:text-[#E4E7EE]">{desc}</td>
      <td className="px-5 py-3"><StatusDot status={doc} /></td>
      <td className="px-5 py-3"><StatusDot status={impl} /></td>
      <td className="px-5 py-3"><StatusDot status={tested} /></td>
      <td className="px-5 py-3">
        <div className="flex gap-1">
          {frameworks.map((fw) => (
            <span key={fw} className="px-1.5 py-0.5 text-[10px] font-medium bg-[#EEF1FE] dark:bg-[#1C2340] text-[#5F6B7A] dark:text-[#9AA3B4] rounded">
              {fw}
            </span>
          ))}
        </div>
      </td>
    </tr>
  );
}

function StatusDot({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; dot: string }> = {
    done: { label: 'Done', color: 'text-[#1DB954]', dot: 'bg-[#1DB954]' },
    partial: { label: 'Partial', color: 'text-[#F5A623]', dot: 'bg-[#F5A623]' },
    overdue: { label: 'Overdue', color: 'text-[#E5484D]', dot: 'bg-[#E5484D]' },
    'not-tested': { label: 'Not tested', color: 'text-[#E5484D]', dot: 'bg-[#E5484D]' },
    scheduled: { label: 'Scheduled', color: 'text-[#F5A623]', dot: 'bg-[#F5A623]' },
    passed: { label: 'Passed', color: 'text-[#1DB954]', dot: 'bg-[#1DB954]' },
  };

  const c = config[status] || config.done;

  return (
    <span className={`flex items-center gap-1.5 text-[11.5px] font-medium ${c.color}`}>
      <span className={`w-[7px] h-[7px] rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function PriorityActionsCard() {
  return (
    <Card title="📋 Priority Actions">
      <div className="space-y-3">
        <ActionItem
          priority="high"
          text="Schedule penetration test for critical controls (A.5.24, A.8.13)"
          sub="Effectiveness testing · Due: Apr 15, 2026"
        />
        <ActionItem
          priority="high"
          text="Complete quarterly access review for A.5.15"
          sub="14 months since last review · Compliance integrity alert"
        />
        <ActionItem
          priority="medium"
          text="Resolve open CAPA NC-2024-015 (cloud configuration)"
          sub="Open 45 days · Contradicts auto-collected evidence"
        />
        <ActionItem
          priority="low"
          text="Connect Azure AD for automated evidence collection"
          sub="Integration · Reduces manual effort by ~30%"
        />
      </div>
    </Card>
  );
}

function ActionItem({ priority, text, sub }: { priority: 'high' | 'medium' | 'low'; text: string; sub: string }) {
  const colors = {
    high: 'bg-[#E5484D]',
    medium: 'bg-[#F5A623]',
    low: 'bg-[#1DB954]',
  };

  return (
    <div className="flex items-center gap-3 pb-3 border-b border-[#F3F4F6] dark:border-[#252838] last:border-0 last:pb-0">
      <div className={`w-1 h-8 rounded ${colors[priority]} flex-shrink-0`} />
      <div className="flex-1">
        <div className="text-[12.5px] leading-snug text-[#1A1D26] dark:text-[#E4E7EE]">{text}</div>
        <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function PreAuditCard() {
  return (
    <Card title="🏛 Pre-Audit Self-Assessment">
      <div className="text-center py-3 mb-4">
        <div className="text-[11px] uppercase tracking-wide text-[#9AA3B0] mb-2">Estimated Audit Readiness</div>
        <div className="text-[44px] font-bold text-[#F5A623]">
          68<span className="text-xl">%</span>
        </div>
        <div className="text-xs text-[#5F6B7A] mt-1">3 high-risk non-conformity areas detected</div>
      </div>
      <div className="pt-3.5 border-t border-[#E2E5EB]">
        <div className="text-[11px] font-semibold uppercase text-[#9AA3B0] tracking-wide mb-2.5">
          Likely Audit Findings
        </div>
        <div className="space-y-2">
          <FindingItem color="bg-[#E5484D]" text="Access management — evidence expired" />
          <FindingItem color="bg-[#E5484D]" text="Business continuity — no recovery test in 2025" />
          <FindingItem color="bg-[#E5484D]" text="Incident management — CAPA open 45+ days" />
          <FindingItem color="bg-[#F5A623]" text="Cryptography policy — draft not yet approved" />
        </div>
      </div>
    </Card>
  );
}

function FindingItem({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
      <span className="text-[12.5px] text-[#1A1D26] dark:text-[#E4E7EE]">{text}</span>
    </div>
  );
}

function HitLLegend() {
  return (
    <div className="mt-2 px-5 py-3.5 bg-white dark:bg-[#1A1D28] rounded-[10px] border border-[#E2E5EB] dark:border-[#2A2E3D] shadow-sm flex gap-6 items-center flex-wrap text-xs text-[#5F6B7A] dark:text-[#9AA3B4] transition-colors">
      <strong className="text-[11px] uppercase tracking-wide text-[#1A1D26] dark:text-[#E4E7EE]">Decision Level Legend:</strong>
      <span className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 bg-[#E8F4FD] text-[#1B8BD1] rounded text-[10px] font-semibold">🤖 Auto</span>
        System executes without intervention
      </span>
      <span className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 bg-[#FFF7E6] text-[#B47A14] rounded text-[10px] font-semibold">👁 Review</span>
        AI proposes, human validates
      </span>
      <span className="flex items-center gap-1.5">
        <span className="px-2 py-0.5 bg-[#FEECEE] text-[#E5484D] rounded text-[10px] font-semibold">👤 Human</span>
        Requires human decision
      </span>
    </div>
  );
}

function StatCard({ label, value, valueColor, sub }: { label: string; value: string; valueColor?: string; sub: string }) {
  return (
    <div className="bg-white dark:bg-[#1A1D28] rounded-[10px] p-[18px] shadow-sm border border-[#E2E5EB] dark:border-[#2A2E3D] transition-colors">
      <div className="text-[11px] text-[#9AA3B0] dark:text-[#646D7D] uppercase tracking-wide mb-1.5">{label}</div>
      <div className={`text-[28px] font-bold ${valueColor || 'text-[#1A1D26] dark:text-[#E4E7EE]'}`}>{value}</div>
      <div className="text-[11px] text-[#5F6B7A] dark:text-[#9AA3B4] mt-1">{sub}</div>
    </div>
  );
}

function CAPATable() {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-[#E2E5EB] dark:border-[#2A2E3D]">
          <th className="text-left py-2.5 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">CAPA ID</th>
          <th className="text-left py-2.5 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Finding</th>
          <th className="text-left py-2.5 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Age</th>
          <th className="text-left py-2.5 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Priority</th>
          <th className="text-left py-2.5 text-[11px] uppercase tracking-wide text-[#5F6B7A] dark:text-[#9AA3B4] font-semibold">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-[#F3F4F6] dark:border-[#252838] hover:bg-[#FAFBFC] dark:hover:bg-[#1E2130]">
          <td className="py-2.5 font-semibold text-[#4F6EF7] dark:text-[#6B8AFF]">NC-2024-015</td>
          <td className="py-2.5 text-[#1A1D26] dark:text-[#E4E7EE]">Cloud config non-conformity (AWS S3)</td>
          <td className="py-2.5 font-semibold text-[#E5484D] dark:text-[#F06669]">45 days</td>
          <td className="py-2.5"><span className="px-2 py-0.5 bg-[#FEECEE] dark:bg-[#2A1214] text-[#E5484D] dark:text-[#F06669] rounded text-[10px] font-semibold">High</span></td>
          <td className="py-2.5"><StatusDot status="overdue" /></td>
        </tr>
        <tr className="border-b border-[#F3F4F6] dark:border-[#252838] hover:bg-[#FAFBFC] dark:hover:bg-[#1E2130]">
          <td className="py-2.5 font-semibold text-[#4F6EF7] dark:text-[#6B8AFF]">NC-2025-002</td>
          <td className="py-2.5 text-[#1A1D26] dark:text-[#E4E7EE]">Missing access review evidence Q4</td>
          <td className="py-2.5 font-semibold text-[#E5484D] dark:text-[#F06669]">38 days</td>
          <td className="py-2.5"><span className="px-2 py-0.5 bg-[#FEECEE] dark:bg-[#2A1214] text-[#E5484D] dark:text-[#F06669] rounded text-[10px] font-semibold">High</span></td>
          <td className="py-2.5"><StatusDot status="overdue" /></td>
        </tr>
        <tr className="hover:bg-[#FAFBFC] dark:hover:bg-[#1E2130]">
          <td className="py-2.5 font-semibold text-[#4F6EF7] dark:text-[#6B8AFF]">NC-2025-003</td>
          <td className="py-2.5 text-[#1A1D26] dark:text-[#E4E7EE]">BCP test not executed in 2025</td>
          <td className="py-2.5 font-medium text-[#F5A623] dark:text-[#F5B740]">22 days</td>
          <td className="py-2.5"><span className="px-2 py-0.5 bg-[#FFF7E6] dark:bg-[#2A2210] text-[#B47A14] dark:text-[#F5B740] rounded text-[10px] font-semibold">Medium</span></td>
          <td className="py-2.5"><StatusDot status="partial" /></td>
        </tr>
      </tbody>
    </table>
  );
}

function TimelineItem({ status, title, date }: { status: 'done' | 'progress' | 'pending'; title: string; date: string }) {
  const colors = {
    done: 'bg-[#1DB954] dark:bg-[#34D969]',
    progress: 'bg-[#F5A623] dark:bg-[#F5B740]',
    pending: 'border-2 border-[#E2E5EB] dark:border-[#2A2E3D]',
  };

  return (
    <div className="flex gap-3 items-start">
      <div className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${colors[status]}`} />
      <div className="flex-1">
        <div className="font-semibold text-sm text-[#1A1D26] dark:text-[#E4E7EE]">{title}</div>
        <div className="text-xs text-[#5F6B7A] dark:text-[#9AA3B4] mt-0.5">{date}</div>
      </div>
    </div>
  );
}

function SidebarPreviewItem({
  label,
  icon,
  locked,
  active,
  selectedPlan,
}: {
  label: string;
  icon: string;
  locked: boolean;
  active: boolean;
  selectedPlan: 'basico' | 'pro' | 'enterprise';
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
        active && selectedPlan === 'pro'
          ? 'bg-[#4F6EF7] text-white font-medium shadow-lg shadow-[#4F6EF7]/30'
          : 'text-white/70 hover:bg-white/5'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
    </div>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[#F3F4F6] dark:border-[#252838] last:border-0">
      <div>
        <div className="text-[13.5px] font-medium text-[#1A1D26] dark:text-[#E4E7EE]">{label}</div>
        <div className="text-[11.5px] text-[#9AA3B0] dark:text-[#646D7D] mt-0.5">{sub}</div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full relative transition-colors flex items-center ${value ? 'bg-[#4F6EF7]' : 'bg-[#E2E5EB] dark:bg-[#2A2E3D]'}`}
    >
      <span
        className={`w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
>>>>>>> Chat-bot
