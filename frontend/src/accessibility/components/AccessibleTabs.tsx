/**
 * Accessible Tab Component
 * WCAG 2.1 Level AA compliant tabs
 */

import React, { useState, useRef } from 'react';
import { useAriaId } from '../hooks/useA11y';
import { handleArrowKeyNavigation } from '../utils/a11y-helpers';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface AccessibleTabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
  tabs,
  defaultTabId,
  onChange,
  orientation = 'horizontal',
}) => {
  const [activeTabId, setActiveTabId] = useState(
    defaultTabId || tabs[0]?.id || ''
  );
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabPanelId = useAriaId('tab-panel');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleTabClick = (tabId: string, index: number) => {
    setActiveTabId(tabId);
    setSelectedIndex(index);
    onChange?.(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabButtons = tabListRef.current?.querySelectorAll('[role="tab"]') || [];
    const items = Array.from(tabButtons) as HTMLElement[];

    if (orientation === 'horizontal') {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newIndex = (selectedIndex + 1) % items.length;
        setSelectedIndex(newIndex);
        handleTabClick(tabs[newIndex].id, newIndex);
        items[newIndex]?.focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newIndex = (selectedIndex - 1 + items.length) % items.length;
        setSelectedIndex(newIndex);
        handleTabClick(tabs[newIndex].id, newIndex);
        items[newIndex]?.focus();
      }
    } else {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = (selectedIndex + 1) % items.length;
        setSelectedIndex(newIndex);
        handleTabClick(tabs[newIndex].id, newIndex);
        items[newIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = (selectedIndex - 1 + items.length) % items.length;
        setSelectedIndex(newIndex);
        handleTabClick(tabs[newIndex].id, newIndex);
        items[newIndex]?.focus();
      }
    }

    if (e.key === 'Home') {
      e.preventDefault();
      setSelectedIndex(0);
      handleTabClick(tabs[0].id, 0);
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastIndex = tabs.length - 1;
      setSelectedIndex(lastIndex);
      handleTabClick(tabs[lastIndex].id, lastIndex);
      items[lastIndex]?.focus();
    }
  };

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className="w-full">
      {/* Tab List */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        className={`flex ${
          orientation === 'vertical' ? 'flex-col' : 'flex-row'
        } border-b border-gray-200`}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={tab.id === activeTabId}
            aria-controls={`${tabPanelId}-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id, index)}
            autoFocus={index === selectedIndex}
            className={`px-4 py-2 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              tab.id === activeTabId
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${tabPanelId}-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== activeTabId}
          className="mt-4"
        >
          {tab.id === activeTabId && tab.content}
        </div>
      ))}
    </div>
  );
};
