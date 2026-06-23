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
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15,35,24,0.45)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "16px",
    }}>
      <div style={{
        background: "var(--night-raise)",
        border: "1px solid var(--night-border)",
        borderRadius: "var(--radius-xl)",
        padding: "28px",
        width: "100%", maxWidth: "380px",
        boxShadow: "var(--shadow-md)",
        animation: "fadeIn 0.18s ease-out",
      }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px", fontWeight: 700,
          color: "var(--snow)", marginBottom: "10px",
        }}>
          {title}
        </h2>
        <p style={{
          fontSize: "14px", color: "var(--snow-faint)",
          lineHeight: 1.6, marginBottom: "24px",
        }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--night-border)",
              background: "transparent",
              color: "var(--snow-dim)",
              fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "10px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: isDangerous ? "var(--danger)" : "var(--aurora)",
              color: "#ffffff",
              fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700,
              cursor: "pointer", transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
