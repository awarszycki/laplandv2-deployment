import React, { useState, useEffect } from "react";

export default function DeleteProjectDialog({
  isOpen,
  projectName,
  onConfirm,
  onCancel,
}) {
  const [input, setInput] = useState("");
  const isConfirmed = input.toLowerCase().trim() === "delete";

  // Czyść pole przy każdym otwarciu dialogu
  useEffect(() => {
    if (isOpen) setInput("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog">

        {/* Nagłówek */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <div style={{
            width: "40px", height: "40px",
            borderRadius: "50%",
            background: "var(--danger-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {/* Prawidłowa ikona trójkąta ostrzegawczego */}
            <svg width="20" height="20" fill="none" stroke="var(--danger)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="dialog-title">
            Usuń wyprawę
          </h2>
        </div>

        {/* Ostrzeżenie */}
        <div style={{
          background: "var(--danger-dim)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          marginBottom: "18px",
        }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--danger)", marginBottom: "6px" }}>
            ⚠ Operacja jest nieodwracalna
          </p>
          <p className="dialog-text" style={{ fontSize: "14px" }}>
            Usunięcie wyprawy <strong style={{ color: "var(--text)" }}>„{projectName}"</strong> trwale usunie wszystkich uczestników,
            wydatki i cały ekwipunek.
          </p>
        </div>

        {/* Pole potwierdzenia */}
        <div style={{ marginBottom: "22px" }}>
          <label className="form-label" style={{ marginBottom: "8px" }}>
            Wpisz{" "}
            <code style={{
              fontSize: "13px",
              background: "var(--surface-2)",
              borderRadius: "6px", padding: "1px 6px",
              color: "var(--danger)",
              textTransform: "none",
            }}>
              delete
            </code>
            {" "}aby potwierdzić
          </label>
          <input
            type="text"
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && isConfirmed && onConfirm()}
            placeholder="Wpisz: delete"
            style={isConfirmed ? { borderColor: "var(--danger)" } : undefined}
          />
          <p style={{
            fontSize: "13px", marginTop: "6px",
            color: isConfirmed ? "var(--danger)" : "var(--text-faint)",
          }}>
            {isConfirmed ? "✓ Możesz teraz usunąć wyprawę" : "⏳ Wpisz \"delete\" aby odblokować przycisk"}
          </p>
        </div>

        {/* Przyciski */}
        <div className="dialog-actions">
          <button className="btn btn-outline" onClick={onCancel}>
            Anuluj
          </button>
          <button
            className="btn btn-danger-solid"
            onClick={onConfirm}
            disabled={!isConfirmed}
          >
            Usuń na zawsze
          </button>
        </div>

      </div>
    </div>
  );
}
