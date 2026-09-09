"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icon";

export interface SweetAlertOptions {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose?: () => void;
  autoCloseMs?: number;
  isToast?: boolean;
}

interface Props extends SweetAlertOptions {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  loading?: boolean;
}

export function SweetAlert({
  isOpen,
  type,
  title,
  message,
  confirmText = "OK",
  cancelText = "Batal",
  onConfirm,
  onClose,
  autoCloseMs = 3500,
  isToast = false,
  loading = false,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;

    if (autoCloseMs && isToast) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseMs, isToast, onClose]);

  if (!isOpen) return null;

  const defaultTitle = {
    success: "Berhasil!",
    error: "Terjadi Kesalahan",
    warning: "Perhatian",
    info: "Informasi",
  }[type];

  const displayTitle = title || defaultTitle;

  const iconName = {
    success: "CheckCircle2",
    error: "AlertTriangle",
    warning: "AlertTriangle",
    info: "CircleHelp",
  }[type];

  if (isToast) {
    return (
      <div className={`sweet-toast sweet-toast-${type}`} role="alert">
        <div className={`sweet-toast-icon sweet-toast-icon-${type}`}>
          <Icon name={iconName} size={20} />
        </div>
        <div className="sweet-toast-content">
          <strong>{displayTitle}</strong>
          <p>{message}</p>
        </div>
        <button type="button" className="sweet-toast-close" onClick={onClose} title="Tutup">
          <Icon name="X" size={14} />
        </button>
        {autoCloseMs > 0 && (
          <div
            className="sweet-toast-progress"
            style={{ animationDuration: `${autoCloseMs}ms` }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="sweet-modal-backdrop" onClick={onClose}>
      <div
        className="sweet-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={`sweet-badge-wrapper sweet-badge-${type}`}>
          <div className="sweet-badge-ring" />
          <Icon name={iconName} size={36} />
        </div>

        <h3 className="sweet-modal-title">{displayTitle}</h3>
        <p className="sweet-modal-message">{message}</p>

        <div className="sweet-modal-actions">
          {onConfirm ? (
            <>
              <button
                type="button"
                className="secondary-button sweet-cancel-btn"
                onClick={onClose}
                disabled={loading}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`primary-button sweet-confirm-btn sweet-confirm-${type}`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Memproses…
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`primary-button sweet-confirm-btn sweet-confirm-${type}`}
              onClick={onClose}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
