import { useEffect, useState, useCallback, useRef } from 'react'
import { Dialog, DialogContent } from '../ui/dialog'
import { useAuth } from '../../contexts/AuthContext'
import { COMMANDS, filterCommandsByRole, fuzzySearch, getTranslation, type Command as CommandType, type UserRole, type Language } from './commands'
import { Search, AlertCircle } from 'lucide-react'
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

  // Filter by search
  const filteredCommands = fuzzySearch(searchValue, availableCommands)

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
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

  // Reset selectedIndex when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchValue])

  // Register Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        setSearchValue('')
        setSelectedIndex(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Listen for external open event (used by Navbar trigger)
  useEffect(() => {
    const handler = () => {
      setOpen(true)
      setSearchValue('')
      setSelectedIndex(0)
    }
    window.addEventListener('open-command-palette', handler as EventListener)
    return () => window.removeEventListener('open-command-palette', handler as EventListener)
  }, [])

  // Handle navigation and execution
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

  // Keyboard navigation - only on input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const commands = commandsRef.current
    
    console.log('Key pressed:', e.key, 'Selected index:', selectedIndex, 'Total commands:', commands.length)
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % (commands.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + (commands.length || 1)) % (commands.length || 1))
    } else if (e.key === 'Enter') {
      console.log('Enter pressed! Selected command:', commands[selectedIndex])
      e.preventDefault()
      if (commands[selectedIndex]) {
        handleExecute(commands[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setSearchValue('')
      setSelectedIndex(0)
    }
  }

  return (
    <>
      {/* Keyboard shortcut is triggered from Navbar (top) — this component listens for 'open-command-palette' event */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg border border-gray-700 bg-gray-900 max-w-2xl">
          <div className="flex flex-col h-[70vh] max-h-[85vh] bg-gray-900">
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-gray-700 px-4 py-3 bg-gray-900">
              <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <input
                autoFocus
                placeholder={getTranslation('search.placeholder', language)}
                value={searchValue}
                onChange={e => {
                  setSearchValue(e.target.value)
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
              />
            </div>

            {/* Results or Empty State */}
            <div className="flex-1 overflow-y-auto bg-gray-900" style={{paddingBottom: 12}}>
              {allFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  <AlertCircle className="w-8 h-8 opacity-50" />
                  <p className="text-sm">No commands found</p>
                  <p className="text-xs opacity-60">Try a different search term</p>
                </div>
              ) : (
                <div className="p-2">
                  {Object.entries(groupedCommands).map(([category, commands]) => (
                    <div key={category} className="mb-2">
                      {/* Category Header */}
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {category}
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
