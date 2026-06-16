import React from 'react';

function Ekwipunek({ isWidget }) {
  const przedmioty = [
    { id: 1, nazwa: 'Termalne Zapasy', stan: 'Optymalny', ilosc: '4/5' },
    { id: 2, nazwa: 'Skutery Śnieżne (Snowmobiles)', stan: 'W użyciu', ilosc: '2/2' },
    { id: 3, nazwa: 'Racje Wysokoenergetyczne', stan: 'Niski stan', ilosc: '12/50' }
  ];

  return (
    <div className="glass-card">
      <h3 className="card-title">🎒 Status Floty i Zapasów</h3>
      <div className="inventory-summary">
        {isWidget ? (
          // Skrócona lista na pulpit główny
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {przedmioty.slice(0, 2).map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{item.nazwa}</span>
                <strong style={{ color: 'var(--accent-green)' }}>{item.ilosc}</strong>
              </div>
            ))}
          </div>
        ) : (
          // Pełna tabela w widoku dedykowanym ekwipunkowi
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                <th style={{ paddingBottom: '10px' }}>Przedmiot</th>
                <th style={{ paddingBottom: '10px' }}>Stan</th>
                <th style={{ paddingBottom: '10px' }}>Ilość</th>
              </tr>
            </thead>
            <tbody>
              {przedmioty.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '12px 0' }}>{item.nazwa}</td>
                  <td style={{ padding: '12px 0', color: item.stan === 'Niski stan' ? 'var(--status-attention)' : 'inherit' }}>
                    {item.stan}
                  </td>
                  <td style={{ padding: '12px 0', fontWeight: 'bold' }}>{item.ilosc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Ekwipunek;
