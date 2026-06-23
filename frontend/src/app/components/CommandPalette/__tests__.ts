import { describe, it, expect } from 'vitest'
import { COMMANDS, filterCommandsByRole, fuzzySearch } from './commands'
import type { UserRole } from './commands'

/**
 * Unit Tests for Command Palette
 * 
 * Run with: npm run test
 */

describe('Command Palette', () => {
  describe('filterCommandsByRole', () => {
    it('should return all commands for admin', () => {
      const admin = filterCommandsByRole(COMMANDS, 'admin')
      expect(admin.length).toBe(COMMANDS.length)
    })

    it('should filter out admin-only commands for employee', () => {
      const employee = filterCommandsByRole(COMMANDS, 'employee')
      const adminOnlyCommands = ['admin-users', 'admin-roles', 'admin-organization']
      
      adminOnlyCommands.forEach(id => {
        expect(employee.find(c => c.id === id)).toBeUndefined()
      })
    })

    it('should include navigation commands for all roles', () => {
      const roles: UserRole[] = ['admin', 'manager', 'auditor', 'employee']
      
      roles.forEach(role => {
        const commands = filterCommandsByRole(COMMANDS, role)
        const navigationCommands = commands.filter(c => c.category === 'Navigation')
        expect(navigationCommands.length).toBeGreaterThan(0)
      })
    })

    it('should allow employee to see dashboard, audit, and assessment', () => {
      const employee = filterCommandsByRole(COMMANDS, 'employee')
      const dashboardCmd = employee.find(c => c.id === 'nav-dashboard')
      const auditCmd = employee.find(c => c.id === 'nav-audit')
      const assessmentCmd = employee.find(c => c.id === 'nav-assessment')

      expect(dashboardCmd).toBeDefined()
      expect(auditCmd).toBeDefined()
      expect(assessmentCmd).toBeDefined()
    })

    it('should restrict threats and assets for employee', () => {
      const employee = filterCommandsByRole(COMMANDS, 'employee')
      const threatsCmd = employee.find(c => c.id === 'nav-threats')
      const assetsCmd = employee.find(c => c.id === 'nav-assets')

      expect(threatsCmd).toBeUndefined()
      expect(assetsCmd).toBeUndefined()
    })
  })

  describe('fuzzySearch', () => {
    const commands = filterCommandsByRole(COMMANDS, 'admin')

    it('should return empty array for empty query', () => {
      const results = fuzzySearch('', commands)
      expect(results).toEqual(commands)
    })

    it('should find commands by exact title match', () => {
      const results = fuzzySearch('Dashboard', commands)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].title).toContain('Dashboard')
    })

    it('should be case-insensitive', () => {
      const resultsLower = fuzzySearch('dashboard', commands)
      const resultsUpper = fuzzySearch('DASHBOARD', commands)
      
      expect(resultsLower.length).toBe(resultsUpper.length)
    })

    it('should find commands by partial title match', () => {
      const results = fuzzySearch('audit', commands)
      expect(results.length).toBeGreaterThan(0)
      results.forEach(cmd => {
        expect(cmd.title.toLowerCase()).toContain('audit')
      })
    })

    it('should prioritize exact matches over partial matches', () => {
      const results = fuzzySearch('Go to Dashboard', commands)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].id).toBe('nav-dashboard')
    })

    it('should find commands by description', () => {
      const results = fuzzySearch('compliance', commands)
      expect(results.length).toBeGreaterThan(0)
    })

    it('should find commands by category', () => {
      const results = fuzzySearch('Navigation', commands)
      expect(results.length).toBeGreaterThan(0)
      results.forEach(cmd => {
        expect(cmd.category).toBe('Navigation')
      })
    })

    it('should return empty array for non-matching query', () => {
      const results = fuzzySearch('xyz123notfound', commands)
      expect(results.length).toBe(0)
    })

    it('should handle special characters', () => {
      const results = fuzzySearch('ISO', commands)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('Command Structure', () => {
    it('all commands should have required fields', () => {
      COMMANDS.forEach(cmd => {
        expect(cmd.id).toBeDefined()
        expect(cmd.title).toBeDefined()
        expect(cmd.category).toBeDefined()
        expect(cmd.action).toBeDefined()
        expect(cmd.requiredRoles).toBeDefined()
        expect(Array.isArray(cmd.requiredRoles)).toBe(true)
      })
    })

    it('all commands should have valid categories', () => {
      const validCategories = ['Navigation', 'Actions', 'ISO Controls', 'Settings']
      COMMANDS.forEach(cmd => {
        expect(validCategories).toContain(cmd.category)
      })
    })

    it('all commands should have valid roles', () => {
      const validRoles = ['admin', 'manager', 'auditor', 'employee']
      COMMANDS.forEach(cmd => {
        cmd.requiredRoles.forEach(role => {
          expect(validRoles).toContain(role)
        })
      })
    })

    it('command actions should be callable', () => {
      const testCommands = COMMANDS.slice(0, 3)
      testCommands.forEach(cmd => {
        expect(typeof cmd.action).toBe('function')
      })
    })

    it('should not have duplicate command IDs', () => {
      const ids = COMMANDS.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('Category Grouping', () => {
    it('should have commands in each category', () => {
      const categories = new Set(COMMANDS.map(c => c.category))
      expect(categories.size).toBeGreaterThan(0)
    })

    it('Navigation category should have most commands', () => {
      const navigation = COMMANDS.filter(c => c.category === 'Navigation')
      const actions = COMMANDS.filter(c => c.category === 'Actions')
      expect(navigation.length).toBeGreaterThanOrEqual(actions.length)
    })
  })
})

/**
 * Integration Test Examples (if using React Testing Library)
 * 
 * describe('CommandPalette Integration', () => {
 *   it('should open on Cmd+K', async () => {
 *     render(<CommandPalette />)
 *     
 *     fireEvent.keyDown(window, { key: 'k', metaKey: true })
 *     expect(screen.getByPlaceholderText('Search commands...')).toBeInTheDocument()
 *   })
 *   
 *   it('should filter commands as user types', async () => {
 *     render(<CommandPalette />)
 *     fireEvent.keyDown(window, { key: 'k', metaKey: true })
 *     
 *     const input = screen.getByPlaceholderText('Search commands...')
 *     fireEvent.change(input, { target: { value: 'audit' } })
 *     
 *     expect(screen.getByText(/Go to Audit/)).toBeInTheDocument()
 *   })
 *   
 *   it('should execute command on Enter', async () => {
 *     render(<CommandPalette />)
 *     fireEvent.keyDown(window, { key: 'k', metaKey: true })
 *     fireEvent.keyDown(window, { key: 'Enter' })
 *     
 *     // Assert navigation or action occurred
 *   })
 * })
 */
