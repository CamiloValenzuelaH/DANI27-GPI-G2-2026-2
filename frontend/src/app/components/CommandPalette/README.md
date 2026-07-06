# Command Palette

A powerful command palette component that provides quick access to navigation, actions, and controls with fuzzy search and keyboard navigation.

## Features

- **Keyboard Shortcuts**: Open with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
- **Fuzzy Search**: Instantly search commands by title, description, or category
- **Keyboard Navigation**: Arrow keys to navigate, Enter to execute, Escape to close
- **Role-Based Access Control**: Filter commands based on user role (admin, manager, auditor, employee)
- **Categorized Commands**: Organize commands into Navigation, Actions, and Settings
- **Visual Feedback**: Highlight selected command and show access denied messages
- **Keyboard Hints**: Display available keyboard shortcuts inline

## Usage

### Basic Integration

The CommandPalette is automatically integrated into the AppShell and is available throughout the application:

```tsx
<CommandPalette />
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+K / Ctrl+K | Open/close command palette |
| Arrow Up/Down | Navigate commands |
| Enter | Execute selected command |
| Escape | Close palette |

## Available Commands

### Navigation
- Go to Dashboard
- Go to Audit
- Go to Assessment
- Go to Risks
- Go to Threats (manager, auditor, admin only)
- Go to Assets (manager, auditor, admin only)
- Go to Documents
- Go to Settings (admin, manager only)

### Actions
- New Audit
- Export Report (auditor, manager, admin only)
- Search ISO Controls

### Settings (Admin Only)
- Manage Users
- Manage Roles
- Organization Settings
- Preferences (all roles)

## Role-Based Filtering

Commands are automatically filtered based on the user's role:

| Role | Access |
|------|--------|
| **employee** | Navigation (except Settings, Threats, Assets), Basic Actions |
| **auditor** | Navigation, Actions, Settings access |
| **manager** | Navigation, Actions, Advanced Actions, Settings access |
| **admin** | All commands including user/role management |

## Adding Custom Commands

To add new commands, edit the `commands.ts` file:

```typescript
{
  id: 'my-command',
  title: 'My Custom Command',
  description: 'What this command does',
  category: 'Navigation', // or 'Actions', 'Settings', 'ISO Controls'
  shortcut: '⇧M',
  action: () => {
    // Your command logic here
    window.location.hash = '#/my-route'
  },
  requiredRoles: ['admin', 'manager', 'auditor', 'employee'],
}
```

## Extending the Component

### Using the Hook

```tsx
import { useCommandPalette } from '@/app/components/CommandPalette'

function MyComponent() {
  const { userRole, allCommands, hasPermission } = useCommandPalette()
  
  // Your component logic
}
```

### Custom Permissions

To check if a user has permission for specific roles:

```typescript
import { filterCommandsByRole } from '@/app/components/CommandPalette'

const availableCommands = filterCommandsByRole(COMMANDS, userRole)
```

### Search

Use the fuzzy search function:

```typescript
import { fuzzySearch } from '@/app/components/CommandPalette'

const results = fuzzySearch('audit', commands)
```

## Security Considerations

1. **Role-Based Access**: Commands are filtered on the client side based on user role. Always validate permissions on the server before executing sensitive operations.
2. **Access Denied Handling**: If a user attempts an unauthorized action, a message is displayed instead of navigating to an error page.
3. **Action Execution**: Wrap sensitive operations in try-catch blocks to handle permission errors gracefully.

## Styling

The component uses Tailwind CSS and follows the application's dark theme. Customize styles in `CommandPalette.css` or modify the className attributes in `CommandPalette.tsx`.

## Performance Notes

- Fuzzy search is performed client-side and optimized for responsiveness
- Commands are grouped by category for better organization
- Navigation state is maintained during palette interaction
- The component uses React hooks for efficient state management
