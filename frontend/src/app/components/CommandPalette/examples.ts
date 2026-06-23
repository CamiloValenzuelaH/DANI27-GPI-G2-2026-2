import { Command, UserRole } from './CommandPalette'

/**
 * Example: How to Extend Command Palette with Custom Commands
 *
 * This file demonstrates how to add custom commands to the Command Palette
 * for your organization-specific workflows.
 */

// Example 1: Simple Navigation Command
export const exampleNavigationCommand: Command = {
  id: 'nav-capa',
  title: 'Go to CAPA Management',
  description: 'Navigate to Corrective and Preventive Actions',
  category: 'Navigation',
  shortcut: 'P',
  action: () => {
    window.location.hash = '#/capa'
  },
  requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
}

// Example 2: Action Command with Conditional Logic
export const exampleActionCommand: Command = {
  id: 'action-generate-report',
  title: 'Generate Compliance Report',
  description: 'Generate a compliance report for the current period',
  category: 'Actions',
  shortcut: '⇧R',
  action: async () => {
    // Simulate async action
    console.log('Generating report...')
    // In reality, you would:
    // 1. Fetch data from API
    // 2. Process data
    // 3. Show success/error message
    // 4. Navigate or download file
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Report generated!')
  },
  requiredRoles: ['admin', 'manager', 'auditor'],
}

// Example 3: Admin-Only Command
export const exampleAdminCommand: Command = {
  id: 'admin-backup',
  title: 'Backup Database',
  description: 'Create a manual backup of the database',
  category: 'Settings',
  action: async () => {
    if (confirm('Create a new database backup? This may take a few minutes.')) {
      try {
        // Call your backup API
        console.log('Backup started...')
        // const response = await backupApi.create()
        console.log('Backup completed!')
      } catch (error) {
        throw new Error('Failed to create backup')
      }
    }
  },
  requiredRoles: ['admin'],
}

// Example 4: ISO Control Search Command
export const exampleISOCommand: Command = {
  id: 'iso-search-a5',
  title: 'ISO 27001 A.5 Access Control',
  description: 'Go to Access Control controls (A.5.*)',
  category: 'ISO Controls',
  action: () => {
    window.location.hash = '#/controls?filter=A.5'
  },
  requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
}

// Example 5: Multi-Step Command
export const exampleComplexCommand: Command = {
  id: 'action-schedule-audit',
  title: 'Schedule Internal Audit',
  description: 'Schedule a new internal audit',
  category: 'Actions',
  shortcut: '⇧U',
  action: async () => {
    // Step 1: Open a modal or form
    // Step 2: Collect user input
    // Step 3: Validate data
    // Step 4: Submit to API
    // Step 5: Show confirmation

    const auditDate = window.prompt('Enter audit date (YYYY-MM-DD):')
    if (!auditDate) {
      throw new Error('Audit scheduling cancelled')
    }

    try {
      // Validate date format
      const date = new Date(auditDate)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format')
      }

      // In reality, call your API
      console.log(`Audit scheduled for ${auditDate}`)
      // const response = await auditApi.schedule({ date: auditDate })

      // Navigate to audit page
      window.location.hash = '#/audit'
    } catch (error: any) {
      throw new Error(`Failed to schedule audit: ${error.message}`)
    }
  },
  requiredRoles: ['admin', 'manager', 'auditor'],
}

// Example 6: How to Add These to the System

/*
  1. Export these commands from a new file like `customCommands.ts`
  
  2. In `commands.ts`, import and merge them:
  
     import { 
       exampleNavigationCommand,
       exampleActionCommand,
       exampleAdminCommand,
       exampleISOCommand,
       exampleComplexCommand
     } from './customCommands'
     
     export const COMMANDS: Command[] = [
       // ... existing commands
       exampleNavigationCommand,
       exampleActionCommand,
       exampleAdminCommand,
       exampleISOCommand,
       exampleComplexCommand,
     ]
  
  3. The new commands will automatically appear in:
     - Global search
     - Keyboard navigation
     - Role-based filtering
     - Category grouping
*/

// Example 7: Helper Functions for Custom Commands

/**
 * Validates if user has a specific permission
 */
export function userHasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Creates a command with common error handling
 */
export function createCommand(options: {
  id: string
  title: string
  description?: string
  category: 'Navigation' | 'Actions' | 'ISO Controls' | 'Settings'
  shortcut?: string
  action: () => void | Promise<void>
  requiredRoles: UserRole[]
}): Command {
  return {
    id: options.id,
    title: options.title,
    description: options.description,
    category: options.category,
    shortcut: options.shortcut,
    action: async () => {
      try {
        await options.action()
      } catch (error: any) {
        // Display error message
        const message = error instanceof Error ? error.message : 'An error occurred'
        throw new Error(message)
      }
    },
    requiredRoles: options.requiredRoles,
  }
}

// Example 8: Group Related Commands

export const coreCommands = {
  navigation: [
    exampleNavigationCommand,
  ],
  actions: [
    exampleActionCommand,
    exampleComplexCommand,
  ],
  iso: [
    exampleISOCommand,
  ],
  admin: [
    exampleAdminCommand,
  ],
}
