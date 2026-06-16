import React, { useState } from 'react';
import './App.css';
import Finanse from './components/Finanse';
import Ekwipunek from './components/Ekwipunek';
import Ekipa from './components/Ekipa';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'finanse':
        return <Finanse />;
      case 'ekwipunek':
        return <Ekwipunek />;
      case 'ekipa':
        return <Ekipa />;
      case 'dashboard':
      default:
        return (
          <div className="dashboard-layout-grid">
            <Ekipa isWidget={true} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <Finanse isWidget={true} />
              <Ekwipunek isWidget={true} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* PANEL BOCZNY (SIDEBAR) */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏔️</div>
          <h2>LAPLAND</h2>
          <p>Expedition Management</p>
        </div>

        <ul className="menu-list">
          <li 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span>📊</span> Dashboard
          </li>
          <li 
            className={`menu-item ${activeTab === 'finanse' ? 'active' : ''}`}
            onClick={() => setActiveTab('finanse')}
          >
            <span>💰</span> Finanse
          </li>
          <li 
            className={`menu-item ${activeTab === 'ekwipunek' ? 'active' : ''}`}
            onClick={() => setActiveTab('ekwipunek')}
          >
            <span>🎒</span> Ekwipunek
          </li>
          <li 
            className={`menu-item ${activeTab === 'ekipa' ? 'active' : ''}`}
            onClick={() => setActiveTab('ekipa')}
          >
            <span>👥</span> Ekipa
          </li>
        </ul>

        <div className="sidebar-footer">
          <p className="footer-quote">„Małe kroki każdego dnia prowadzą do wielkich zmian.”</p>
        </div>
      </aside>

      {/* GŁÓWNA SEKCJA KOLEJNYCH WIDOKÓW */}
      <main className="main-content">
        <header className="top-bar">
          <div className="welcome-section">
            <h1>Dzień dobry, Ameen!</h1>
            <div className="progress-container">
              <p>Postęp misji</p>
              <div className="progress-bar-wrapper">
                <div className="progress-bar-fill" style={{ width: '70%' }}></div>
              </div>
              <p style={{ fontWeight: 600 }}>70%</p>
            </div>
          </div>

          <div className="top-actions">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">👤</button>
          </div>
        </header>

        {/* CZTERY MINI-STATYSTYKI Z GÓRNEJ SEKCJI GRAFIKI */}
        {activeTab === 'dashboard' && (
          <section className="quick-stats-grid">
            <div className="glass-card stat-card-mini" onClick={() => setActiveTab('ekwipunek')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <div className="stat-icon-wrapper">🎒</div>
                <div className="stat-details">
                  <h4>Kontrola Ekwipunku</h4>
                  <p>Aktywne</p>
                </div>
              </div>
              <span className="arrow-link">→</span>
            </div>
            
            <div className="glass-card stat-card-mini" onClick={() => setActiveTab('finanse')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <div className="stat-icon-wrapper">💳</div>
                <div className="stat-details">
                  <h4>Rozliczenia Finansowe</h4>
                  <p>Aktywne</p>
                </div>
              </div>
              <span className="arrow-link">→</span>
            </div>

            <div className="glass-card stat-card-mini" onClick={() => setActiveTab('ekipa')} style={{ cursor: 'pointer' }}>
              <div className="stat-info">
                <div className="stat-icon-wrapper">👥</div>
                <div className="stat-details">
                  <h4>Zarządzanie Ekipą</h4>
                  <p>Aktywne</p>
                </div>
              </div>
              <span className="arrow-link">→</span>
            </div>

            <div className="glass-card stat-card-mini">
              <div className="stat-info">
                <div className="stat-icon-wrapper">🧭</div>
                <div className="stat-details">
                  <h4>Planowanie Logistyczne</h4>
                  <p>Aktywne</p>
                </div>
              </div>
              <span className="arrow-link">→</span>
            </div>
          </section>
        )}

        {/* AKTYWNA PODSTRONA LUB WIDGETY */}
        {renderContent()}

        {/* DOLNY STATYCZNY PASEK Z GRAFIKI */}
        <div className="bottom-summary-bar">
          <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>🏔️ Lapland Basecamp Monitor v2.0</p>
          <div className="summary-inline-stats">
            <div className="inline-stat">🔥 <span>7 Dni z rzędu</span></div>
            <div className="inline-stat">📈 <span>85% Postęp tygodniowy</span></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
