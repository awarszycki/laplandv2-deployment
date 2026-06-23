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
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15,35,24,0.50)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "16px",
    }}>
      <div style={{
        background: "var(--night-raise)",
        border: "1px solid var(--night-border)",
        borderRadius: "var(--radius-xl)",
        padding: "28px",
        width: "100%", maxWidth: "400px",
        boxShadow: "var(--shadow-md)",
        animation: "fadeIn 0.18s ease-out",
      }}>

        {/* Nagłówek */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <div style={{
            width: "40px", height: "40px",
            borderRadius: "var(--radius-md)",
            background: "var(--danger-dim)",
            border: "1px solid rgba(220,38,38,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {/* Prawidłowa ikona trójkąta ostrzegawczego */}
            <svg width="20" height="20" fill="none" stroke="var(--danger)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px", fontWeight: 700,
            color: "var(--snow)",
          }}>
            Usuń wyprawę
          </h2>
        </div>

        {/* Ostrzeżenie */}
        <div style={{
          background: "var(--danger-dim)",
          border: "1px solid rgba(220,38,38,0.22)",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          marginBottom: "18px",
        }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger)", marginBottom: "6px" }}>
            ⚠ Operacja jest nieodwracalna
          </p>
          <p style={{ fontSize: "13px", color: "var(--snow-dim)", lineHeight: 1.6 }}>
            Usunięcie wyprawy <strong>„{projectName}"</strong> trwale usunie wszystkich uczestników,
            wydatki i cały ekwipunek.
          </p>
        </div>

        {/* Pole potwierdzenia */}
        <div style={{ marginBottom: "22px" }}>
          <label style={{
            display: "block",
            fontSize: "12px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.8px", color: "var(--snow-faint)",
            marginBottom: "8px", fontFamily: "var(--font-display)",
          }}>
            Wpisz{" "}
            <code style={{
              fontFamily: "var(--font-mono)", fontSize: "12px",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid var(--night-border)",
              borderRadius: "5px", padding: "1px 6px",
              color: "var(--danger)",
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
            style={{
              width: "100%",
              padding: "10px 13px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${isConfirmed ? "var(--danger)" : "var(--night-border)"}`,
              background: "rgba(0,0,0,0.12)",
              color: "var(--snow)",
              fontFamily: "var(--font-mono)", fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
          <p style={{
            fontSize: "11px", marginTop: "6px",
            color: isConfirmed ? "var(--danger)" : "var(--snow-faint)",
            fontFamily: "var(--font-display)",
          }}>
            {isConfirmed ? "✓ Możesz teraz usunąć wyprawę" : "⏳ Wpisz \"delete\" aby odblokować przycisk"}
          </p>
        </div>

        {/* Przyciski */}
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
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed}
            style={{
              flex: 1, padding: "10px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: isConfirmed ? "var(--danger)" : "rgba(220,38,38,0.25)",
              color: isConfirmed ? "#ffffff" : "rgba(255,255,255,0.35)",
              fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700,
              cursor: isConfirmed ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            Usuń na zawsze
          </button>
        </div>

      </div>
    </div>
  );
}
