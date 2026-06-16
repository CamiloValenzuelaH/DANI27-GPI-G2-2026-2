/**
 * Accessibility Audit Report
 * Initial WCAG 2.1 Compliance Audit
 */

export interface AuditFinding {
  id: string;
  component: string;
  level: 'critical' | 'major' | 'minor';
  criterion: string;
  issue: string;
  recommendation: string;
  status: 'not-started' | 'in-progress' | 'resolved';
}

export const accessibilityAudit: AuditFinding[] = [
  {
    id: 'audit-001',
    component: 'Navigation / Sidebar',
    level: 'major',
    criterion: 'WCAG 2.1 1.4.3 Contrast',
    issue: 'Inactive navigation items may have insufficient color contrast',
    recommendation: 'Ensure all text has at least 4.5:1 contrast ratio for normal text',
    status: 'not-started',
  },
  {
    id: 'audit-002',
    component: 'SidebarPro',
    level: 'major',
    criterion: 'WCAG 2.1 2.4.1 Bypass Blocks',
    issue: 'No skip link to main content',
    recommendation: 'Add SkipToMainContent component at the top of AppShell',
    status: 'not-started',
  },
  {
    id: 'audit-003',
    component: 'NavbarPro',
    level: 'major',
    criterion: 'WCAG 2.1 1.1.1 Non-text Content',
    issue: 'Icon-only buttons lack descriptive aria-labels',
    recommendation: 'Add aria-label to hamburger menu, notifications, and profile buttons',
    status: 'not-started',
  },
  {
    id: 'audit-004',
    component: 'Forms',
    level: 'critical',
    criterion: 'WCAG 2.1 1.3.1 Info and Relationships',
    issue: 'Form inputs may lack associated labels',
    recommendation: 'Ensure all inputs have explicit labels or aria-labels',
    status: 'not-started',
  },
  {
    id: 'audit-005',
    component: 'Modals',
    level: 'critical',
    criterion: 'WCAG 2.1 2.4.3 Focus Order',
    issue: 'Modals may lack proper focus management',
    recommendation: 'Use AccessibleModal component with focus trap and management',
    status: 'not-started',
  },
  {
    id: 'audit-006',
    component: 'Tables',
    level: 'major',
    criterion: 'WCAG 2.1 1.3.1 Info and Relationships',
    issue: 'No table headers properly marked',
    recommendation: 'Use <th> tags with proper scope attributes',
    status: 'not-started',
  },
  {
    id: 'audit-007',
    component: 'Color',
    level: 'major',
    criterion: 'WCAG 2.1 1.4.1 Use of Color',
    issue: 'Important information conveyed by color alone',
    recommendation: 'Add icons, patterns, or text labels alongside colors',
    status: 'not-started',
  },
  {
    id: 'audit-008',
    component: 'Keyboard Navigation',
    level: 'critical',
    criterion: 'WCAG 2.1 2.1.1 Keyboard',
    issue: 'Not all interactive elements accessible via keyboard',
    recommendation: 'Ensure Tab order and implement keyboard shortcuts',
    status: 'not-started',
  },
  {
    id: 'audit-009',
    component: 'Mobile Responsiveness',
    level: 'major',
    criterion: 'WCAG 2.1 1.4.10 Reflow',
    issue: 'Layout may not adapt well to mobile screens',
    recommendation: 'Implement responsive breakpoints using ResponsiveProvider',
    status: 'not-started',
  },
  {
    id: 'audit-010',
    component: 'Notifications',
    level: 'major',
    criterion: 'WCAG 2.1 4.1.3 Status Messages',
    issue: 'Status messages not announced to screen readers',
    recommendation: 'Use aria-live regions and announceToScreenReader helper',
    status: 'not-started',
  },
  {
    id: 'audit-011',
    component: 'Error Messages',
    level: 'critical',
    criterion: 'WCAG 2.1 3.3.1 Error Identification',
    issue: 'Error messages may not be properly associated with form fields',
    recommendation: 'Use aria-invalid and aria-describedby on form fields',
    status: 'not-started',
  },
  {
    id: 'audit-012',
    component: 'Links',
    level: 'major',
    criterion: 'WCAG 2.1 2.4.4 Link Purpose',
    issue: 'Generic link text ("click here")',
    recommendation: 'Use descriptive link text that indicates destination',
    status: 'not-started',
  },
  {
    id: 'audit-013',
    component: 'Videos',
    level: 'major',
    criterion: 'WCAG 2.1 1.2.1 Audio-only and Video-only',
    issue: 'No captions or transcripts for video content',
    recommendation: 'Add captions and transcripts to all video content',
    status: 'not-started',
  },
  {
    id: 'audit-014',
    component: 'Animations',
    level: 'minor',
    criterion: 'WCAG 2.1 2.3.3 Animation from Interactions',
    issue: 'Animations may cause discomfort for some users',
    recommendation: 'Respect prefers-reduced-motion setting',
    status: 'not-started',
  },
  {
    id: 'audit-015',
    component: 'Touch Targets',
    level: 'major',
    criterion: 'WCAG 2.5.5 Target Size',
    issue: 'Small touch targets on mobile',
    recommendation: 'Ensure buttons/links are at least 44x44 pixels',
    status: 'not-started',
  },
];

/**
 * Generate audit summary statistics
 */
export const getAuditSummary = () => {
  const critical = accessibilityAudit.filter((f) => f.level === 'critical')
    .length;
  const major = accessibilityAudit.filter((f) => f.level === 'major').length;
  const minor = accessibilityAudit.filter((f) => f.level === 'minor').length;
  const resolved = accessibilityAudit.filter((f) => f.status === 'resolved')
    .length;

  return {
    total: accessibilityAudit.length,
    critical,
    major,
    minor,
    resolved,
    percentage: Math.round((resolved / accessibilityAudit.length) * 100),
  };
};

/**
 * Get findings by component
 */
export const findingsByComponent = (component: string) => {
  return accessibilityAudit.filter((f) => f.component === component);
};

/**
 * Get findings by level
 */
export const findingsByLevel = (level: 'critical' | 'major' | 'minor') => {
  return accessibilityAudit.filter((f) => f.level === level);
};
