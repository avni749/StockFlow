import React from 'react';

const STATUS_VARIANT_MAP = {
  // Positive / Healthy (Green)
  ACTIVE: 'success',
  PAID: 'success',
  RECEIVED: 'success',
  PURCHASE_RECEIVED: 'success',
  RESOLVED: 'success',
  IN_STOCK: 'success',
  SUCCESS: 'success',

  // Warning (Amber / Gold)
  PENDING: 'warning',
  PENDING_PAYMENT: 'warning',
  LOW_STOCK: 'warning',
  INITIATED: 'warning',
  ORDER_RESERVED: 'warning',

  // Danger / Terminated (Red / Crimson)
  INACTIVE: 'danger',
  CANCELLED: 'danger',
  EXPIRED: 'danger',
  SUSPENDED: 'danger',
  OUT_OF_STOCK: 'danger',
  FAILED: 'danger',
  ORDER_SOLD: 'danger',

  // Info / Neutral (Teal / Slate)
  ORDER_RELEASED: 'info',
  STOREFRONT: 'neutral',
  SUPER_ADMIN: 'info',
  BUSINESS_ADMIN: 'info',
  STAFF: 'neutral'
};

const STATUS_LABEL_MAP = {
  PURCHASE_RECEIVED: 'Stock In',
  ORDER_RESERVED: 'Reserved',
  ORDER_SOLD: 'Stock Out',
  ORDER_RELEASED: 'Released',
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
  IN_STOCK: 'In Stock',
  BUSINESS_ADMIN: 'Admin',
  STAFF: 'Staff'
};

export default function Badge({
  status,
  variant,
  children,
  showDot = false,
  className = '',
  style = {}
}) {
  const resolvedVariant = variant || (status ? STATUS_VARIANT_MAP[String(status).toUpperCase()] || 'neutral' : 'neutral');
  const label = children || (status ? STATUS_LABEL_MAP[String(status).toUpperCase()] || String(status).replace(/_/g, ' ') : '');

  return (
    <span
      className={`badge badge-${resolvedVariant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        ...style
      }}
    >
      {showDot && (
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: 'currentColor'
          }}
        />
      )}
      {label}
    </span>
  );
}
