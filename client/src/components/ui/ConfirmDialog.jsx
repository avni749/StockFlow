import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose
}) {
  const dialogRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore focus on close
    previouslyFocusedElementRef.current = document.activeElement;

    // Focus the dialog or first focusable button
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      if (previouslyFocusedElementRef.current && previouslyFocusedElementRef.current.focus) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confirmBtnClass = variant === 'danger'
    ? 'btn btn-danger btn-sm'
    : variant === 'warning'
      ? 'btn btn-warning btn-sm'
      : 'btn btn-primary btn-sm';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              backgroundColor: variant === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)',
              color: variant === 'danger' ? 'var(--danger)' : 'var(--warning)',
              border: `1px solid ${variant === 'danger' ? 'var(--danger-border)' : 'var(--warning-border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={18} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              id="confirm-dialog-title"
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em'
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: '6px 0 0 0',
                fontSize: '13px',
                lineHeight: '1.5',
                color: 'var(--text-secondary)'
              }}
            >
              {description}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmBtnClass}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
