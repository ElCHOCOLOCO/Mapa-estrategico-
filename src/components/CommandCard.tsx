import React from 'react';
import { X, TrendingUp, Users, BookOpen, Save } from 'lucide-react';
import type { InstituteData } from '../data/institutes';

interface CommandCardProps {
  institute: InstituteData;
  onClose: () => void;
  onUpdate: (updated: InstituteData) => void;
}

const CommandCard: React.FC<CommandCardProps> = ({ institute, onClose, onUpdate }) => {
  const [editedData, setEditedData] = React.useState<InstituteData>(institute);

  // Sync state if institute changes
  React.useEffect(() => {
    setEditedData(institute);
  }, [institute]);

  const handleChange = (field: keyof InstituteData, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(editedData);
  };

  return (
    <div className="tactical-panel command-card-container animate-fade-in">
      <div className="card-header">
        <h2 className="tactical-font">{institute.name}</h2>
        <button onClick={onClose} className="close-btn"><X size={18} /></button>
      </div>

      <div className="card-body">
        <div className="data-row">
          <div className="icon-box"><TrendingUp size={16} /></div>
          <div className="field-group">
            <label>Produção Econômica (Vendas)</label>
            <input 
              type="number" 
              value={editedData.sales} 
              onChange={(e) => handleChange('sales', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="data-row">
          <div className="icon-box"><Users size={16} /></div>
          <div className="field-group">
            <label>Humor Político (1-5)</label>
            <div className="humor-bar">
              {[1, 2, 3, 4, 5].map(lvl => (
                <div 
                  key={lvl}
                  className={`humor-segment ${editedData.humor >= lvl ? 'active' : ''}`}
                  onClick={() => handleChange('humor', lvl)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="data-row">
          <div className="icon-box"><BookOpen size={16} /></div>
          <div className="field-group">
            <label>Projetos Ativos</label>
            <input 
              type="number" 
              value={editedData.projects} 
              onChange={(e) => handleChange('projects', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="card-footer">
        <button className="save-btn" onClick={handleSave}>
          <Save size={16} />
          <span>Aplicar Ordens</span>
        </button>
      </div>

    </div>
  );
};

export default CommandCard;
