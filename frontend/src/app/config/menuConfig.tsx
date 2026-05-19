import { ReactNode } from 'react';

export type UserPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface MenuItem {
  id: string;
  labelKey: string; // i18n key
  path: string;
  icon?: ReactNode | string;
  iconType?: 'emoji' | 'component';
  stepNum?: string;
  badge?: string;
  badgeType?: 'count' | 'warn';
  requiredPlan?: UserPlan;
  isCompleted?: boolean;
  children?: MenuItem[];
}

const PLAN_HIERARCHY: Record<UserPlan, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

export function hasAccess(requiredPlan: UserPlan | undefined, userPlan: UserPlan): boolean {
  if (!requiredPlan) return true;
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

export function getRequiredPlanName(plan: UserPlan): string {
  const planNames: Record<UserPlan, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };
  return planNames[plan];
}

// Process-based navigation (Journey)
export const processMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    labelKey: 'menu.dashboard',
    path: '/dashboard',
    icon: '1',
    iconType: 'emoji',
    stepNum: '1',
  },
  {
    id: 'understand',
    labelKey: 'menu.understand',
    path: '/understand',
    icon: '✓',
    iconType: 'emoji',
    stepNum: '2',
  },
  {
    id: 'assets',
    labelKey: 'menu.assets',
    path: '/assets',
    icon: '3',
    iconType: 'emoji',
    stepNum: '3',
    requiredPlan: 'starter',
  },
  {
    id: 'assets',
    labelKey: 'menu.assets',
    path: '/assets',
    icon: '3',
    iconType: 'emoji',
    stepNum: '3',
    requiredPlan: 'starter',
  },
  {
    id: 'documents',
    labelKey: 'menu.documents',
    path: '/documents',
    icon: '3',
    iconType: 'emoji',
    stepNum: '3',
    badge: '4',
    badgeType: 'warn',
    requiredPlan: 'starter',
  },
  {
    id: 'risks',
    labelKey: 'menu.risks',
    path: '/risks',
    icon: '4',
    iconType: 'emoji',
    stepNum: '4',
    requiredPlan: 'pro',
  },
  {
    id: 'evidence',
    labelKey: 'menu.evidence',
    path: '/evidence',
    icon: '5',
    iconType: 'emoji',
    stepNum: '5',
    badge: '7',
    requiredPlan: 'pro',
  },
  {
    id: 'findings',
    labelKey: 'menu.findings',
    path: '/findings',
    icon: '6',
    iconType: 'emoji',
    stepNum: '6',
  },
  {
    id: 'audit',
    labelKey: 'menu.audit',
    path: '/audit',
    icon: '7',
    iconType: 'emoji',
    stepNum: '7',
    requiredPlan: 'pro',
  },
];

export const intelligenceMenuItems: MenuItem[] = [
  {
    id: 'integrity',
    labelKey: 'menu.integrity',
    path: '/integrity',
    icon: '⚠',
    iconType: 'emoji',
    badge: '3',
    requiredPlan: 'enterprise',
  },
  {
    id: 'regfeed',
    labelKey: 'menu.regfeed',
    path: '/regfeed',
    icon: '📢',
    iconType: 'emoji',
    badge: '2',
    badgeType: 'warn',
    requiredPlan: 'pro',
  },
];

// Module-based navigation
export const coreModulesItems: MenuItem[] = [
  {
    id: 'dashboard',
    labelKey: 'menu.dashboard',
    path: '/dashboard',
    icon: '📊',
    iconType: 'emoji',
  },
  {
    id: 'assets',
    labelKey: 'menu.assets',
    path: '/assets',
    icon: '🗂️',
    iconType: 'emoji',
    requiredPlan: 'starter',
  },
  {
    id: 'gap-analysis',
    labelKey: 'menu.gapAnalysis',
    path: '/understand',
    icon: '🔍',
    iconType: 'emoji',
  },
  {
    id: 'doc-generator',
    labelKey: 'menu.documentGenerator',
    path: '/documents',
    icon: '📄',
    iconType: 'emoji',
    requiredPlan: 'starter',
  },
  {
    id: 'risk-map',
    labelKey: 'menu.riskMap',
    path: '/risks',
    icon: '🛡️',
    iconType: 'emoji',
    requiredPlan: 'pro',
  },
  {
    id: 'evidence-center',
    labelKey: 'menu.evidenceCenter',
    path: '/evidence',
    icon: '📦',
    iconType: 'emoji',
    requiredPlan: 'pro',
  },
  {
    id: 'capa-tracker',
    labelKey: 'menu.capaTracker',
    path: '/findings',
    icon: '🔧',
    iconType: 'emoji',
  },
  {
    id: 'pre-audit-assessment',
    labelKey: 'menu.preAuditAssessment',
    path: '/assessment',
    icon: '📝',
    iconType: 'emoji',
    requiredPlan: 'free',
  },
  {
    id: 'audit-room',
    labelKey: 'menu.auditRoom',
    path: '/audit',
    icon: '🏛️',
    iconType: 'emoji',
    requiredPlan: 'pro',
  },
];

export const regulatoryModulesItems: MenuItem[] = [
  {
    id: 'dora',
    labelKey: 'menu.dora',
    path: '/dora',
    icon: '🏦',
    iconType: 'emoji',
    requiredPlan: 'enterprise',
  },
  {
    id: 'euai',
    labelKey: 'menu.euai',
    path: '/euai',
    icon: '🤖',
    iconType: 'emoji',
    requiredPlan: 'enterprise',
  },
];

export const settingsItems: MenuItem[] = [
  {
    id: 'escalation',
    labelKey: 'menu.escalation',
    path: '/escalation',
    icon: '⚙',
    iconType: 'emoji',
    requiredPlan: 'pro',
  },
  {
    id: 'integrations',
    labelKey: 'menu.integrations',
    path: '/integrations',
    icon: '🔗',
    iconType: 'emoji',
    requiredPlan: 'starter',
  },
  {
    id: 'settings',
    labelKey: 'menu.settings',
    path: '/settings',
    icon: '⚙',
    iconType: 'emoji',
  },
];
