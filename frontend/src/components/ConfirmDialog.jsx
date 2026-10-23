import React from "react";

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Potwierdź",
  cancelText  = "Anuluj",
  isDangerous = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog" style={{ maxWidth: "380px" }}>
        <h2 className="dialog-title" style={{ marginBottom: "10px" }}>
          {title}
        </h2>
        <p className="dialog-text" style={{ marginBottom: "24px" }}>
          {message}
        </p>
        <div className="dialog-actions">
          <button className="btn btn-outline" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn ${isDangerous ? "btn-danger-solid" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
