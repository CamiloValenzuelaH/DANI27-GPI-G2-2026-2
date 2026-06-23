/**
 * Mobile-Responsive Table Component
 * Horizontal scroll en mobile, normal en desktop
 * Accesible
 */

import React from 'react';

interface TableColumn {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface ResponsiveTableProps {
  columns: TableColumn[];
  data: any[];
  ariaLabel: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  ariaLabel,
}) => {
  return (
    <div className="w-full">
      {/* Mobile: Horizontal scroll container */}
      <div className="md:hidden horizontal-scroll-container -mx-4 px-4 overflow-x-auto">
        <table
          role="table"
          aria-label={ariaLabel}
          className="min-w-full border-collapse"
        >
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap"
                  style={{ minWidth: col.width || 'auto' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                {columns.map((col) => (
                  <td
                    key={`${rowIdx}-${col.key}`}
                    className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Desktop: Normal table */}
      <div className="hidden md:block overflow-x-auto">
        <table
          role="table"
          aria-label={ariaLabel}
          className="w-full border-collapse"
        >
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                {columns.map((col) => (
                  <td
                    key={`${rowIdx}-${col.key}`}
                    className="px-6 py-3 text-sm text-gray-700"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div
          role="status"
          className="text-center py-8 text-gray-500"
          aria-label="No hay datos disponibles"
        >
          <p className="text-base">No hay datos para mostrar</p>
        </div>
      )}
    </div>
  );
};

/**
 * Mobile Card View (alternativa a tabla en mobile)
 */
interface CardViewProps {
  data: any[];
  renderCard: (item: any, index: number) => React.ReactNode;
  ariaLabel: string;
}

export const MobileCardView: React.FC<CardViewProps> = ({
  data,
  renderCard,
  ariaLabel,
}) => {
  return (
    <div role="list" aria-label={ariaLabel} className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} role="listitem">
          {renderCard(item, idx)}
        </div>
      ))}
    </div>
  );
};

/**
 * Card component para mobile view
 */
interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}

export const Card: React.FC<CardProps> = ({ children, onClick, ariaLabel }) => {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : -1}
      aria-label={ariaLabel}
      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
    >
      {children}
    </div>
  );
};
