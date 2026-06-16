import React from 'react';

function Ekipa({ isWidget }) {
  const czlonkowie = [
    { id: 1, imie: 'Jan Kowalski', rola: 'Lider wyprawy', status: 'Zdrowy' },
    { id: 2, imie: 'Anna Nowak', rola: 'Medyk', status: 'Wymaga uwagi' },
    { id: 3, imie: 'Ameen Jalia', rola: 'Nawigator', status: 'Zdrowy' }
  ];

  return (
    <div className="glass-card">
      <h3 className="card-title">👥 Ekipa - Przegląd Statusu</h3>
      <div className="team-list">
        {czlonkowie.map((osoba) => (
          <div key={osoba.id} className="team-member-row">
            <div className="member-profile">
              <div className="member-avatar">
                {osoba.imie.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{osoba.imie}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{osoba.rola}</p>
              </div>
            </div>
            <span className={`member-status ${osoba.status === 'Zdrowy' ? 'status-zdrowy' : 'status-uwaga'}`}>
              {osoba.status}
            </span>
          </div>
        ))}
      </div>
      {!isWidget && (
        <div style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <p>💡 Kliknij członka ekipy, aby zobaczyć szczegółowe parametry życiowe i przydzielony sprzęt zimowy.</p>
        </div>
      )}
    </div>
  );
}

export default Ekipa;
