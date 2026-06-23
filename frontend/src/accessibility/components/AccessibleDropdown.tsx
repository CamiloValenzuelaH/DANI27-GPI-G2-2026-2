/**
 * Accessible Dropdown Menu
 * WCAG 2.1 Level AA compliant dropdown component
 */

import React, { useRef, useState } from 'react';
import { useAriaId, useKeyboardNavigation } from '../hooks/useA11y';
import { handleArrowKeyNavigation } from '../utils/a11y-helpers';

interface MenuItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface AccessibleDropdownProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  label?: string;
  position?: 'left' | 'right';
}

export const AccessibleDropdown: React.FC<AccessibleDropdownProps> = ({
  trigger,
  items,
  label = 'Menu',
  position = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerAriaId = useAriaId('dropdown-trigger');
  const menuAriaId = useAriaId('dropdown-menu');

  const menuItems = menuRef.current?.querySelectorAll('[role="menuitem"]') || [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        const items = Array.from(menuItems) as HTMLElement[];
        const newIndex = handleArrowKeyNavigation(
          e as any,
          items,
          selectedIndex,
          'vertical'
        );
        setSelectedIndex(newIndex);
        break;
      }
      case 'Enter': {
        e.preventDefault();
        const item = items[selectedIndex];
        if (item && !item.disabled) {
          item.onClick();
          setIsOpen(false);
          buttonRef.current?.focus();
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      }
      case 'Tab': {
        setIsOpen(false);
        break;
      }
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      menuRef.current &&
      buttonRef.current &&
      !menuRef.current.contains(e.target as Node) &&
      !buttonRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuAriaId}
        id={triggerAriaId}
        className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          id={menuAriaId}
          aria-labelledby={triggerAriaId}
          onKeyDown={handleKeyDown}
          className={`absolute top-full mt-2 w-56 rounded-lg shadow-lg bg-white z-50 py-1 ${
            position === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => {
                item.onClick();
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
              disabled={item.disabled}
              aria-disabled={item.disabled}
              autoFocus={index === selectedIndex}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              } ${
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 cursor-pointer'
              } focus:outline-none focus:bg-blue-50 focus:text-blue-700`}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
