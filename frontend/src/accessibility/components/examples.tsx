/**
 * Common Accessible Component Examples
 * Copy and adapt estos componentes para tu proyecto
 */

import React, { useRef, useState } from 'react';
import { useAriaId, useFocusTrap, useAnnouncement } from '../hooks/useA11y';

/**
 * Example 1: Accessible Button
 */
export const AccessibleButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}> = ({ onClick, children, disabled = false, ariaLabel }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className="px-4 py-2 bg-blue-600 text-white rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
  >
    {children}
  </button>
);

/**
 * Example 2: Accessible Form Input with Label
 */
export const AccessibleFormField: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}> = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  required,
  placeholder,
}) => {
  const inputId = useAriaId('input');
  const errorId = useAriaId('error');

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="text-red-600 ml-1" aria-label="requerido">
            *
          </span>
        )}
      </label>

      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent aria-invalid:border-red-500 aria-invalid:ring-red-500"
      />

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Example 3: Accessible Select/Dropdown
 */
export const AccessibleSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}> = ({ label, value, onChange, options, error }) => {
  const selectId = useAriaId('select');
  const errorId = useAriaId('error');

  return (
    <div className="space-y-1">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent aria-invalid:border-red-500"
      >
        <option value="">Selecciona una opción</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Example 4: Accessible Alert Box
 */
export const AccessibleAlert: React.FC<{
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  onClose?: () => void;
}> = ({ type, title, message, onClose }) => {
  const alertId = useAriaId('alert');

  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    success: 'bg-green-50 border-green-200 text-green-900',
  };

  const icons = {
    info: '🛈',
    warning: '⚠',
    error: '❌',
    success: '✓',
  };

  return (
    <div
      id={alertId}
      role="alert"
      aria-labelledby={`${alertId}-title`}
      className={`border-l-4 p-4 rounded ${colors[type]}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{icons[type]}</span>
        <div className="flex-1">
          <h3 id={`${alertId}-title`} className="font-semibold">
            {title}
          </h3>
          <p className="text-sm mt-1">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar alerta"
            className="text-lg flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:rounded"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Example 5: Accessible Toggle Switch
 */
export const AccessibleToggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => {
  const switchId = useAriaId('switch');
  const descId = useAriaId('desc');

  return (
    <div className="flex items-center gap-3">
      <button
        id={switchId}
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descId : undefined}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>

      <label htmlFor={switchId} className="text-sm font-medium">
        {label}
        {description && (
          <p id={descId} className="text-xs text-gray-500">
            {description}
          </p>
        )}
      </label>
    </div>
  );
};

/**
 * Example 6: Accessible Loading Spinner with Live Region
 */
export const AccessibleLoader: React.FC<{
  isLoading: boolean;
  message?: string;
}> = ({ isLoading, message = 'Cargando...' }) => {
  return (
    <>
      {isLoading && (
        <>
          <div className="flex items-center gap-2" aria-hidden="true">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">{message}</span>
          </div>
          <div role="status" className="sr-only">
            {message}
          </div>
        </>
      )}
    </>
  );
};

/**
 * Example 7: Accessible Breadcrumb Navigation
 */
export const AccessibleBreadcrumb: React.FC<{
  items: { label: string; href?: string }[];
}> = ({ items }) => (
  <nav aria-label="Breadcrumb">
    <ol className="flex gap-2 text-sm">
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-2">
          {item.href ? (
            <a href={item.href} className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500">
              {item.label}
            </a>
          ) : (
            <span className="text-gray-600">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <span aria-hidden="true" className="text-gray-400">
              /
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

/**
 * Example 8: Accessible Card with Keyboard Navigation
 */
export const AccessibleCard: React.FC<{
  title: string;
  description: string;
  onClick?: () => void;
  action?: { label: string; onClick: () => void };
}> = ({ title, description, onClick, action }) => (
  <div
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    }}
    role={onClick ? 'button' : 'article'}
    tabIndex={onClick ? 0 : -1}
    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <h3 className="font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-600 mt-1">{description}</p>
    {action && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          action.onClick();
        }}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {action.label}
      </button>
    )}
  </div>
);
