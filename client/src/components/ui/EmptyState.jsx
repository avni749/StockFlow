import React from 'react';
import { Package } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Package,
  title = 'No items found',
  description = 'There are no records to display matching your criteria.',
  action,
  secondaryAction,
  className = '',
  style = {}
}) {
  return (
    <div className={`card state-container ${className}`} style={style}>
      <div className="state-icon">
        <Icon size={22} />
      </div>
      <div className="state-title">{title}</div>
      {description && <div className="state-description">{description}</div>}
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
}
