import { ReactNode } from 'react'

export type CommandCategory = 'Navigation' | 'Actions' | 'ISO Controls' | 'Settings'
export type UserRole = 'admin' | 'manager' | 'auditor' | 'employee'

export interface Command {
  id: string
  title: string
  description?: string
  category: CommandCategory
  icon?: ReactNode
  shortcut?: string
  action: () => void | Promise<void>
  requiredRoles: UserRole[]
}

export const COMMANDS: Command[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    title: 'Go to Dashboard',
    description: 'Navigate to main dashboard',
    category: 'Navigation',
    shortcut: 'D',
    action: () => window.location.href = '/dashboard',
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },
  {
    id: 'nav-audit',
    title: 'Go to Audit',
    description: 'Navigate to audit page',
    category: 'Navigation',
    shortcut: 'A',
    action: () => window.location.href = '/audit',
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },
  {
    id: 'nav-assessment',
    title: 'Go to Assessment',
    description: 'Navigate to assessment page',
    category: 'Navigation',
    shortcut: 'T',
    action: () => window.location.href = '/assessment',
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },
  {
    id: 'nav-risks',
    title: 'Go to Risks',
    description: 'Navigate to risks page',
    category: 'Navigation',
    shortcut: 'R',
    action: () => window.location.href = '/risks',
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },
  {
    id: 'nav-threats',
    title: 'Go to Threats',
    description: 'Navigate to threats page',
    category: 'Navigation',
    shortcut: 'H',
    action: () => window.location.href = '/threats',
    requiredRoles: ['admin', 'manager', 'auditor'],
  },
  {
    id: 'nav-assets',
    title: 'Go to Assets',
    description: 'Navigate to assets page',
    category: 'Navigation',
    shortcut: 'S',
    action: () => window.location.href = '/assets',
    requiredRoles: ['admin', 'manager', 'auditor'],
  },
  {
    id: 'nav-documents',
    title: 'Go to Documents',
    description: 'Navigate to documents page',
    category: 'Navigation',
    shortcut: 'O',
    action: () => window.location.href = '/documents',
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },
  {
    id: 'nav-understand',
    title: 'Go to Understand',
    description: 'Navigate to understand my situation',
    category: 'Navigation',
    shortcut: 'U',
    action: () => window.location.href = '/understand',
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },
  {
    id: 'nav-evidence',
    title: 'Go to Evidence',
    description: 'Navigate to evidence collection',
    category: 'Navigation',
    shortcut: 'E',
    action: () => window.location.href = '/evidence',
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },
  {
    id: 'nav-findings',
    title: 'Go to Findings',
    description: 'Navigate to findings management',
    category: 'Navigation',
    shortcut: 'F',
    action: () => window.location.href = '/findings',
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },
  {
    id: 'nav-settings',
    title: 'Go to Settings',
    description: 'Navigate to settings page',
    category: 'Navigation',
    shortcut: 'C',
    action: () => window.location.href = '/settings',
    requiredRoles: ['admin', 'manager'],
  },

  // Actions
  {
    id: 'action-new-audit',
    title: 'New Audit',
    description: 'Start a new compliance audit',
    category: 'Actions',
    shortcut: 'N',
    action: () => {
      window.location.href = '/audit'
    },
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },
  {
    id: 'action-export',
    title: 'Export Report',
    description: 'Export current data as PDF or Excel',
    category: 'Actions',
    shortcut: '⇧E',
    action: () => {
      console.log('Export report triggered')
    },
    requiredRoles: ['admin', 'manager', 'auditor'],
  },
  {
    id: 'action-search-controls',
    title: 'Search ISO Controls',
    description: 'Search for ISO 27001 controls',
    category: 'Actions',
    shortcut: 'I',
    action: () => {
      window.location.href = '/dashboard?q=ISO%2027001'
    },
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },

  // Admin/Settings
  {
    id: 'admin-users',
    title: 'Manage Users',
    description: 'Manage organization users and roles',
    category: 'Settings',
    action: () => window.location.href = '/settings',
    requiredRoles: ['admin'],
  },
  {
    id: 'admin-roles',
    title: 'Manage Roles',
    description: 'Configure user roles and permissions',
    category: 'Settings',
    action: () => window.location.href = '/settings',
    requiredRoles: ['admin'],
  },
  {
    id: 'admin-organization',
    title: 'Organization Settings',
    description: 'Configure organization settings',
    category: 'Settings',
    action: () => window.location.href = '/settings',
    requiredRoles: ['admin'],
  },
  {
    id: 'admin-preferences',
    title: 'Preferences',
    description: 'Configure your preferences',
    category: 'Settings',
    shortcut: 'P',
    action: () => window.location.href = '/settings',
    requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
  },
]

export function filterCommandsByRole(commands: Command[], userRole: UserRole): Command[] {
  return commands.filter(cmd => cmd.requiredRoles.includes(userRole))
}

export function fuzzySearch(query: string, items: Command[]): Command[] {
  if (!query) return items

  const searchQuery = query.toLowerCase()
  return items
    .map(item => {
      let score = 0

      // Exact match in title
      if (item.title.toLowerCase() === searchQuery) {
        score += 1000
      }

      // Title starts with query
      if (item.title.toLowerCase().startsWith(searchQuery)) {
        score += 500
      }

      // Title contains query
      if (item.title.toLowerCase().includes(searchQuery)) {
        score += 300
      }

      // Description contains query
      if (item.description?.toLowerCase().includes(searchQuery)) {
        score += 100
      }

      // Category contains query
      if (item.category.toLowerCase().includes(searchQuery)) {
        score += 50
      }

      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
}

export type Language = 'en' | 'es' | 'pt' | 'de' | 'fr' | 'it'

export const COMMAND_TRANSLATIONS = {
  en: {
    // Navigation category
    'nav-dashboard.title': 'Go to Dashboard',
    'nav-dashboard.desc': 'Navigate to main dashboard',
    'nav-audit.title': 'Go to Audit',
    'nav-audit.desc': 'Navigate to audit page',
    'nav-assessment.title': 'Go to Assessment',
    'nav-assessment.desc': 'Navigate to assessment page',
    'nav-risks.title': 'Go to Risks',
    'nav-risks.desc': 'Navigate to risks page',
    'nav-threats.title': 'Go to Threats',
    'nav-threats.desc': 'Navigate to threats page',
    'nav-assets.title': 'Go to Assets',
    'nav-assets.desc': 'Navigate to assets page',
    'nav-documents.title': 'Go to Documents',
    'nav-documents.desc': 'Navigate to documents page',
    'nav-settings.title': 'Go to Settings',
    'nav-settings.desc': 'Navigate to settings page',
    'nav-understand.title': 'Go to Gap Analysis',
    'nav-understand.desc': 'Navigate to gap analysis',
    'nav-evidence.title': 'Go to Evidence',
    'nav-evidence.desc': 'Navigate to evidence collection',
    
    // Actions category
    'action-new-audit.title': 'New Audit',
    'action-new-audit.desc': 'Start a new compliance audit',
    'action-export.title': 'Export Report',
    'action-export.desc': 'Export current data as PDF or Excel',
    'action-search-controls.title': 'Search ISO Controls',
    'action-search-controls.desc': 'Search for ISO 27001 controls',
    
    // Settings category
    'admin-users.title': 'Manage Users',
    'admin-users.desc': 'Manage organization users and roles',
    'admin-roles.title': 'Manage Roles',
    'admin-roles.desc': 'Configure user roles and permissions',
    'admin-organization.title': 'Organization Settings',
    'admin-organization.desc': 'Configure organization settings',
    'admin-preferences.title': 'Preferences',
    'admin-preferences.desc': 'Configure your preferences',
    
    // UI strings
    'search.placeholder': 'Search commands...',
    'navigate': 'Navigate',
    'execute': 'Execute',
    'close': 'Close',
    'ui.noResults': 'No commands found',
    'ui.tryDifferent': 'Try a different search term',
    'category.navigation': 'Navigation',
    'category.actions': 'Actions',
    'category.settings': 'Settings',
    'category.iso controls': 'ISO Controls',
  },
  es: {
    // Navigation category
    'nav-dashboard.title': 'Ir a Dashboard',
    'nav-dashboard.desc': 'Navegar al panel principal',
    'nav-audit.title': 'Ir a Auditoría',
    'nav-audit.desc': 'Navegar a la página de auditoría',
    'nav-assessment.title': 'Ir a Evaluación',
    'nav-assessment.desc': 'Navegar a la página de evaluación',
    'nav-risks.title': 'Ir a Riesgos',
    'nav-risks.desc': 'Navegar a la página de riesgos',
    'nav-threats.title': 'Ir a Amenazas',
    'nav-threats.desc': 'Navegar a la página de amenazas',
    'nav-assets.title': 'Ir a Activos',
    'nav-assets.desc': 'Navegar a la página de activos',
    'nav-documents.title': 'Ir a Documentos',
    'nav-documents.desc': 'Navegar a la página de documentos',
    'nav-settings.title': 'Ir a Configuración',
    'nav-settings.desc': 'Navegar a la página de configuración',
    'nav-understand.title': 'Ir a Análisis de brechas',
    'nav-understand.desc': 'Navegar a la página de Análisis de brechas',
    'nav-evidence.title': 'Ir a Evidencia',
    'nav-evidence.desc': 'Navegar a la sección de evidencia',
    'nav-findings.title': 'Ir a Hallazgos',
    'nav-findings.desc': 'Navegar a la página de hallazgos',
    
    // Actions category
    'action-new-audit.title': 'Nueva Auditoría',
    'action-new-audit.desc': 'Iniciar una nueva auditoría de cumplimiento',
    'action-export.title': 'Exportar Reporte',
    'action-export.desc': 'Exportar datos actuales como PDF o Excel',
    'action-search-controls.title': 'Buscar Controles ISO',
    'action-search-controls.desc': 'Buscar controles ISO 27001',
    
    // Settings category
    'admin-users.title': 'Gestionar Usuarios',
    'admin-users.desc': 'Gestionar usuarios y roles de la organización',
    'admin-roles.title': 'Gestionar Roles',
    'admin-roles.desc': 'Configurar roles y permisos de usuarios',
    'admin-organization.title': 'Configuración de Organización',
    'admin-organization.desc': 'Configurar ajustes de la organización',
    'admin-preferences.title': 'Preferencias',
    'admin-preferences.desc': 'Configurar tus preferencias',
    
    // UI strings
    'search.placeholder': 'Buscar comandos...',
    'navigate': 'Navegar',
    'execute': 'Ejecutar',
    'close': 'Cerrar',
    'ui.noResults': 'No se encontraron comandos',
    'ui.tryDifferent': 'Intenta con otro término de búsqueda',
    'category.navigation': 'Navegación',
    'category.actions': 'Acciones',
    'category.settings': 'Configuración',
    'category.iso controls': 'Controles ISO',
  },
  pt: {
    'nav-dashboard.title': 'Ir para Dashboard',
    'nav-dashboard.desc': 'Navegar para o painel principal',
    'nav-audit.title': 'Ir para Auditoria',
    'nav-audit.desc': 'Navegar para a página de auditoria',
    'nav-assessment.title': 'Ir para Avaliação',
    'nav-assessment.desc': 'Navegar para a página de avaliação',
    'nav-risks.title': 'Ir para Riscos',
    'nav-risks.desc': 'Navegar para a página de riscos',
    'nav-threats.title': 'Ir para Ameaças',
    'nav-threats.desc': 'Navegar para a página de ameaças',
    'nav-assets.title': 'Ir para Ativos',
    'nav-assets.desc': 'Navegar para a página de ativos',
    'nav-documents.title': 'Ir para Documentos',
    'nav-documents.desc': 'Navegar para a página de documentos',
    'nav-settings.title': 'Ir para Configurações',
    'nav-settings.desc': 'Navegar para a página de configurações',
    'nav-understand.title': 'Ir para Análise de Lacunas',
    'nav-understand.desc': 'Navegar para a análise de lacunas',
    'nav-evidence.title': 'Ir para Evidências',
    'nav-evidence.desc': 'Navegar para a seção de evidências',
    
    'action-new-audit.title': 'Nova Auditoria',
    'action-new-audit.desc': 'Iniciar uma nova auditoria de conformidade',
    'action-export.title': 'Exportar Relatório',
    'action-export.desc': 'Exportar dados atuais como PDF ou Excel',
    'action-search-controls.title': 'Buscar Controles ISO',
    'action-search-controls.desc': 'Buscar controles ISO 27001',
    
    'admin-users.title': 'Gerenciar Usuários',
    'admin-users.desc': 'Gerenciar usuários e funções da organização',
    'admin-roles.title': 'Gerenciar Funções',
    'admin-roles.desc': 'Configurar funções e permissões de usuários',
    'admin-organization.title': 'Configurações da Organização',
    'admin-organization.desc': 'Configurar configurações da organização',
    'admin-preferences.title': 'Preferências',
    'admin-preferences.desc': 'Configurar suas preferências',
    
    'search.placeholder': 'Buscar comandos...',
    'navigate': 'Navegar',
    'execute': 'Executar',
    'close': 'Fechar',
    'ui.noResults': 'Nenhum comando encontrado',
    'ui.tryDifferent': 'Tente um termo de pesquisa diferente',
    'category.navigation': 'Navegação',
    'category.actions': 'Ações',
    'category.settings': 'Configurações',
    'category.iso controls': 'Controles ISO',
  },
  de: {
    'nav-dashboard.title': 'Zum Dashboard',
    'nav-dashboard.desc': 'Zum Hauptdashboard navigieren',
    'nav-audit.title': 'Zur Prüfung',
    'nav-audit.desc': 'Zur Audit-Seite navigieren',
    'nav-assessment.title': 'Zur Bewertung',
    'nav-assessment.desc': 'Zur Bewertungsseite navigieren',
    'nav-risks.title': 'Zu Risiken',
    'nav-risks.desc': 'Zur Risikobeseite navigieren',
    'nav-threats.title': 'Zu Bedrohungen',
    'nav-threats.desc': 'Zur Bedrohungsseite navigieren',
    'nav-assets.title': 'Zu Vermögenswerten',
    'nav-assets.desc': 'Zur Vermögensseite navigieren',
    'nav-documents.title': 'Zu Dokumenten',
    'nav-documents.desc': 'Zur Dokumentenseite navigieren',
    'nav-settings.title': 'Zu Einstellungen',
    'nav-settings.desc': 'Zur Einstellungsseite navigieren',
    'nav-understand.title': 'Zur Lückenanalyse',
    'nav-understand.desc': 'Zur Lückenanalyse navigieren',
    'nav-evidence.title': 'Zu Evidenz',
    'nav-evidence.desc': 'Zur Evidenz-Sektion navigieren',
    
    'action-new-audit.title': 'Neue Prüfung',
    'action-new-audit.desc': 'Starten Sie eine neue Compliance-Prüfung',
    'action-export.title': 'Bericht exportieren',
    'action-export.desc': 'Aktuelle Daten als PDF oder Excel exportieren',
    'action-search-controls.title': 'ISO-Kontrollen suchen',
    'action-search-controls.desc': 'Suchen Sie nach ISO-27001-Kontrollen',
    
    'admin-users.title': 'Benutzer verwalten',
    'admin-users.desc': 'Organisationsbenutzer und Rollen verwalten',
    'admin-roles.title': 'Rollen verwalten',
    'admin-roles.desc': 'Benutzerrollen und Berechtigungen konfigurieren',
    'admin-organization.title': 'Organisationseinstellungen',
    'admin-organization.desc': 'Konfigurieren Sie die Organisationseinstellungen',
    'admin-preferences.title': 'Einstellungen',
    'admin-preferences.desc': 'Konfigurieren Sie Ihre Einstellungen',
    
    'search.placeholder': 'Befehle suchen...',
    'navigate': 'Navigieren',
    'execute': 'Ausführen',
    'close': 'Schließen',
    'ui.noResults': 'Keine Befehle gefunden',
    'ui.tryDifferent': 'Versuche einen anderen Suchbegriff',
    'category.navigation': 'Navigation',
    'category.actions': 'Aktionen',
    'category.settings': 'Einstellungen',
    'category.iso controls': 'ISO-Kontrollen',
  },
  fr: {
    'nav-dashboard.title': 'Aller au Tableau de bord',
    'nav-dashboard.desc': 'Accéder au tableau de bord principal',
    'nav-audit.title': 'Aller à l\'Audit',
    'nav-audit.desc': 'Accéder à la page d\'audit',
    'nav-assessment.title': 'Aller à l\'Évaluation',
    'nav-assessment.desc': 'Accéder à la page d\'évaluation',
    'nav-risks.title': 'Aller aux Risques',
    'nav-risks.desc': 'Accéder à la page des risques',
    'nav-threats.title': 'Aller aux Menaces',
    'nav-threats.desc': 'Accéder à la page des menaces',
    'nav-assets.title': 'Aller aux Actifs',
    'nav-assets.desc': 'Accéder à la page des actifs',
    'nav-documents.title': 'Aller aux Documents',
    'nav-documents.desc': 'Accéder à la page des documents',
    'nav-settings.title': 'Aller aux Paramètres',
    'nav-settings.desc': 'Accéder à la page des paramètres',
    'nav-understand.title': 'Aller à l\'Analyse des Écarts',
    'nav-understand.desc': 'Accéder à l\'analyse des écarts',
    'nav-evidence.title': 'Aller aux Preuves',
    'nav-evidence.desc': 'Accéder à la section des preuves',
    
    'action-new-audit.title': 'Nouvel Audit',
    'action-new-audit.desc': 'Démarrer un nouvel audit de conformité',
    'action-export.title': 'Exporter le Rapport',
    'action-export.desc': 'Exporter les données actuelles en PDF ou Excel',
    'action-search-controls.title': 'Rechercher les Contrôles ISO',
    'action-search-controls.desc': 'Rechercher les contrôles ISO 27001',
    
    'admin-users.title': 'Gérer les Utilisateurs',
    'admin-users.desc': 'Gérer les utilisateurs et les rôles de l\'organisation',
    'admin-roles.title': 'Gérer les Rôles',
    'admin-roles.desc': 'Configurer les rôles et les permissions des utilisateurs',
    'admin-organization.title': 'Paramètres de l\'Organisation',
    'admin-organization.desc': 'Configurer les paramètres de l\'organisation',
    'admin-preferences.title': 'Préférences',
    'admin-preferences.desc': 'Configurez vos préférences',
    
    'search.placeholder': 'Rechercher les commandes...',
    'navigate': 'Naviguer',
    'execute': 'Exécuter',
    'close': 'Fermer',
    'ui.noResults': 'Aucune commande trouvée',
    'ui.tryDifferent': 'Essayez un autre terme de recherche',
    'category.navigation': 'Navigation',
    'category.actions': 'Actions',
    'category.settings': 'Paramètres',
    'category.iso controls': 'Contrôles ISO',
  },
  it: {
    'nav-dashboard.title': 'Vai alla Dashboard',
    'nav-dashboard.desc': 'Vai alla dashboard principale',
    'nav-audit.title': 'Vai ad Audit',
    'nav-audit.desc': 'Vai alla pagina audit',
    'nav-assessment.title': 'Vai a Valutazione',
    'nav-assessment.desc': 'Vai alla pagina valutazione',
    'nav-risks.title': 'Vai a Rischi',
    'nav-risks.desc': 'Vai alla pagina rischi',
    'nav-threats.title': 'Vai a Minacce',
    'nav-threats.desc': 'Vai alla pagina minacce',
    'nav-assets.title': 'Vai ad Asset',
    'nav-assets.desc': 'Vai alla pagina asset',
    'nav-documents.title': 'Vai a Documenti',
    'nav-documents.desc': 'Vai alla pagina documenti',
    'nav-settings.title': 'Vai a Impostazioni',
    'nav-settings.desc': 'Vai alla pagina impostazioni',
    'nav-understand.title': 'Vai ad Analisi Lacune',
    'nav-understand.desc': 'Vai all\'analisi delle lacune',
    'nav-evidence.title': 'Vai a Evidenze',
    'nav-evidence.desc': 'Vai alla sezione evidenze',

    'action-new-audit.title': 'Nuovo Audit',
    'action-new-audit.desc': 'Avvia un nuovo audit di conformità',
    'action-export.title': 'Esporta Report',
    'action-export.desc': 'Esporta i dati correnti in PDF o Excel',
    'action-search-controls.title': 'Cerca Controlli ISO',
    'action-search-controls.desc': 'Cerca i controlli ISO 27001',

    'admin-users.title': 'Gestisci Utenti',
    'admin-users.desc': 'Gestisci utenti e ruoli dell\'organizzazione',
    'admin-roles.title': 'Gestisci Ruoli',
    'admin-roles.desc': 'Configura ruoli e permessi utente',
    'admin-organization.title': 'Impostazioni Organizzazione',
    'admin-organization.desc': 'Configura le impostazioni dell\'organizzazione',
    'admin-preferences.title': 'Preferenze',
    'admin-preferences.desc': 'Configura le tue preferenze',

    'search.placeholder': 'Cerca comandi...',
    'navigate': 'Naviga',
    'execute': 'Esegui',
    'close': 'Chiudi',
    'ui.noResults': 'Nessun comando trovato',
    'ui.tryDifferent': 'Prova un termine di ricerca diverso',
    'category.navigation': 'Navigazione',
    'category.actions': 'Azioni',
    'category.settings': 'Impostazioni',
    'category.iso controls': 'Controlli ISO',
  },
}

export function getTranslation(key: string, language: Language): string {
  const translations = COMMAND_TRANSLATIONS[language]
  return translations[key as keyof typeof translations] || COMMAND_TRANSLATIONS.en[key as keyof typeof COMMAND_TRANSLATIONS.en] || key
}
