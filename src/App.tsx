import { useState } from 'react';
import MapEngine from './components/MapEngine';
import CommandCard from './components/CommandCard';
import { UFJF_INSTITUTES } from './data/institutes';
import type { InstituteData } from './data/institutes';
import { Target, Users, Calendar, TrendingUp } from 'lucide-react';

const App = () => {
  const [institutes, setInstitutes] = useState<InstituteData[]>(UFJF_INSTITUTES);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedInstitute = institutes.find(i => i.id === selectedId);

  const handleUpdateInstitute = (updated: InstituteData) => {
    setInstitutes(prev => prev.map(i => i.id === updated.id ? updated : i));
    // Optional: add a "Saved" notification here
  };

  return (
    <div className="app-container">
      <MapEngine 
        onSelect={(id) => setSelectedId(id)} 
        selectedId={selectedId}
        institutes={institutes}
      />
      
      {/* Tactical Overlay */}
      <div className="overlay-container">
        {/* Top Header */}
        <div className="top-header">
          <div className="tactical-panel mission-brief">
            <h1>Operação Total War UFJF</h1>
            <p>
              CENTRO DE COMANDO E CONTROLE GEOSPATIAL. 
              MONITORAMENTO DE TERRENO, LOGÍSTICA E HUMOR POLÍTICO EM TEMPO REAL.
            </p>
          </div>

          <div className="tactical-panel status-bar">
            <div className="status-item">
              <span className="status-label">Status da Base</span>
              <span className="status-value" style={{ color: '#00ff00' }}>ESTÁVEL</span>
            </div>
            <div className="status-item">
              <span className="status-label">Agentes Ativos</span>
              <span className="status-value">{institutes.length}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Vendas Totais</span>
              <span className="status-value">
                {institutes.reduce((acc, curr) => acc + curr.sales, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Command Card (Phase 2) */}
        {selectedInstitute && (
          <CommandCard 
            institute={selectedInstitute} 
            onClose={() => setSelectedId(null)}
            onUpdate={handleUpdateInstitute}
          />
        )}

        {/* Bottom Navigation / Controls */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="tactical-panel" style={{ display: 'flex', gap: '2rem', padding: '1rem 3rem' }}>
            <button className={`nav-btn ${!selectedId ? 'active' : ''}`} onClick={() => setSelectedId(null)}>
              <Target size={20} />
              <span>Mapa Global</span>
            </button>
            <button className="nav-btn">
              <TrendingUp size={20} />
              <span>Economia</span>
            </button>
            <button className="nav-btn">
              <Users size={20} />
              <span>Política</span>
            </button>
            <button className="nav-btn">
              <Calendar size={20} />
              <span>Agenda</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
