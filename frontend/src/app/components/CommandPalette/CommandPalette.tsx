import { useEffect, useState, useCallback, useRef } from 'react'
import { Dialog, DialogContent } from '../ui/dialog'
import { useAuth } from '../../contexts/AuthContext'
import { COMMANDS, filterCommandsByRole, getTranslation, type Command as CommandType, type UserRole, type Language } from './commands'
import { AlertCircle } from 'lucide-react'
import './CommandPalette.css'

interface CommandPaletteProps {
  language?: Language
}

export function CommandPalette({ language = 'en' }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null)
  const { user } = useAuth()
  const commandsRef = useRef<CommandType[]>([])
  const [showShortcut, setShowShortcut] = useState(false)
  const hideShortcutTimeout = useRef<number | null>(null)

  // Default role if not specified
  const userRole: UserRole = (user?.['role'] as UserRole) || 'employee'

  // Filter commands based on user role
  const availableCommands = filterCommandsByRole(COMMANDS, userRole)

  // Show all available commands without filtering by search
  const groupedCommands = availableCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = []
      }
      acc[cmd.category].push(cmd)
      return acc
    },
    {} as Record<string, CommandType[]>
  )

  // Flatten for navigation
  const allFiltered = Object.values(groupedCommands).flat()
  commandsRef.current = allFiltered

  // Handle navigation and execution (define BEFORE useEffect that uses it)
  const handleExecute = useCallback(async (command: CommandType) => {
    try {
      console.log('Executing command:', command.id)
      // Close modal immediately before executing
      setOpen(false)
      setSearchValue('')
      setSelectedIndex(0)
      setDeniedMessage(null)
      // Execute the command
      await command.action()
    } catch (error: any) {
      console.error('Command error:', error)
      setDeniedMessage(error?.message || 'Access denied')
      setOpen(true) // Reopen modal on error
      setTimeout(() => setDeniedMessage(null), 3000)
    }
  }, [])

  // Register Cmd+K / Ctrl+K and global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea (unless it's our palette)
      const target = e.target as HTMLElement
      const isInInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
      const isInPalette = target?.closest('[role="dialog"]') !== null
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        setSearchValue('')
        setSelectedIndex(0)
        return
      }

      // If in regular input (not palette), don't trigger shortcuts
      if (isInInput && !isInPalette) {
        return
      }

      // Navigation with Arrow keys ONLY if Command Palette is OPEN
      if (open) {
        const commands = commandsRef.current
        
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % (commands.length || 1))
          return
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + (commands.length || 1)) % (commands.length || 1))
          return
        } else if (e.key === 'Enter') {
          e.preventDefault()
          const commands = commandsRef.current
          if (commands[selectedIndex]) {
            handleExecute(commands[selectedIndex])
          }
          return
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setOpen(false)
          setSearchValue('')
          setSelectedIndex(0)
          return
        }
      }

      // Single letter shortcuts ONLY if Command Palette is OPEN (no modifiers)
      if (open && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const shortcutMap: { [key: string]: string } = {
          'd': 'nav-dashboard',
          'a': 'nav-audit',
          't': 'nav-assessment',
          'r': 'nav-risks',
          'o': 'nav-documents',
          'u': 'nav-understand',
          'e': 'nav-evidence',
          'f': 'nav-findings',
          'n': 'action-new-audit',
          'i': 'action-search-controls',
          'p': 'admin-preferences',
        }

        const command = availableCommands.find(cmd => cmd.id === shortcutMap[e.key.toLowerCase()])
        if (command) {
          e.preventDefault()
          handleExecute(command)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, availableCommands, handleExecute, selectedIndex])

  // Listen for external open event (used by Navbar trigger)
  useEffect(() => {
    const handler = () => {
      setOpen(true)
      setSearchValue('')
      setSelectedIndex(0)
      // Focus the input after the dialog opens
      setTimeout(() => {
        const input = document.querySelector('[role="dialog"] input')
        if (input) (input as HTMLInputElement).focus()
      }, 0)
    }
    window.addEventListener('open-command-palette', handler as EventListener)
    return () => window.removeEventListener('open-command-palette', handler as EventListener)
  }, [])

  return (
    <>
      {/* Keyboard shortcut is triggered from Navbar (top) — this component listens for 'open-command-palette' event */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg border border-gray-700 bg-gray-900 max-w-2xl">
          <div className="flex flex-col h-[70vh] max-h-[85vh] bg-gray-900">
            {/* Results or Empty State */}
            <div className="flex-1 overflow-y-auto bg-gray-900" style={{paddingBottom: 12}}>
              {allFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  <AlertCircle className="w-8 h-8 opacity-50" />
                  <p className="text-sm">{getTranslation('ui.noResults', language)}</p>
                  <p className="text-xs opacity-60">{getTranslation('ui.tryDifferent', language)}</p>
                </div>
              ) : (
                <div className="p-2">
                  {Object.entries(groupedCommands).map(([category, commands]) => (
                    <div key={category} className="mb-2">
                      {/* Category Header */}
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {getTranslation(`category.${category.toLowerCase()}`, language)}
                      </div>

                      {/* Commands in Category */}
                      {commands.map((cmd, idx) => {
                        const globalIndex = allFiltered.indexOf(cmd)
                        const isSelected = globalIndex === selectedIndex
                        const translatedTitle = getTranslation(`${cmd.id}.title`, language)
                        const translatedDesc = getTranslation(`${cmd.id}.desc`, language)

                        return (
                          <button
                            key={cmd.id}
                            onClick={() => handleExecute(cmd)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-200 hover:bg-gray-800'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{translatedTitle}</div>
                              {translatedDesc && (
                                <div className="text-xs opacity-70 truncate">{translatedDesc}</div>
                              )}
                            </div>

                            {/* Keyboard Shortcut */}
                            {cmd.shortcut && (
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-800 rounded flex-shrink-0">
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with help text */}
            <div className="border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-500 bg-gray-950">
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↑↓</kbd>
                  <span>{getTranslation('navigate', language)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">⏎</kbd>
                  <span>{getTranslation('execute', language)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Esc</kbd>
                  <span>{getTranslation('close', language)}</span>
                </div>
              </div>
            </div>

            {/* Access Denied Message */}
            {deniedMessage && (
              <div className="border-t border-red-800 bg-red-900/20 px-4 py-2 flex items-center gap-2 text-sm text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deniedMessage}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
