import React from 'react';

function Finanse({ isWidget }) {
  return (
    <div className="glass-card">
      <h3 className="card-title">💰 Finanse i Budżet Ekspedycji</h3>
      <div className="finance-summary">
        <div className="data-item">
          <label>Całkowity budżet</label>
          <div className="value">34 900 Rs.</div>
        </div>
        <div className="data-item">
          <label>Wydatki (Pojazdy/Żywność)</label>
          <div className="value" style={{ color: 'var(--text-main)', opacity: 0.9 }}>3 350 Rs.</div>
          <div className="progress-bar-wrapper" style={{ width: '100%', marginTop: '5px', height: '6px' }}>
            <div className="progress-bar-fill" style={{ width: '15%', background: 'var(--accent-green)' }}></div>
          </div>
        </div>
        {!isWidget && (
          <div className="data-item" style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <label>Dostępne fundusze rezerwowe</label>
            <div className="value" style={{ color: 'var(--accent-green-light)' }}>31 550 Rs.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Finanse;
