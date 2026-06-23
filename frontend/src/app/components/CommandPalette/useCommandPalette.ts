import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { COMMANDS, filterCommandsByRole, type UserRole } from './commands'

export function useCommandPalette() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Default role if not specified
  const userRole: UserRole = (user?.['role'] as UserRole) || 'employee'

  // Get available commands filtered by user role
  const getAvailableCommands = () => {
    return filterCommandsByRole(COMMANDS, userRole)
  }

  // Check if user has permission for an action
  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    return requiredRoles.includes(userRole)
  }

  // Get all commands for the user
  const allCommands = getAvailableCommands()

  return {
    userRole,
    allCommands,
    hasPermission,
    navigate,
    user,
  }
}
