import React, { useState, useEffect } from 'react';

const IdManager = ({ isOpen, onClose, onSave, initialIds, entityType }) => {
  const [ids, setIds] = useState(initialIds || []);
  const [newId, setNewId] = useState('');

  useEffect(() => {
    setIds(initialIds || []);
  }, [initialIds, isOpen]);

  const handleAddId = () => {
    if (newId && !ids.includes(newId)) {
      setIds([...ids, newId.trim()]);
      setNewId('');
    }
  };

  const handleRemoveId = (idToRemove) => {
    setIds(ids.filter(id => id !== idToRemove));
  };

  const handleSave = () => {
    onSave(ids);
  };

  if (!isOpen) {
    return null;
  }

  const title = entityType === 'campaign' ? 'Manage Campaign IDs' : 'Manage Journey IDs';
  const placeholder = entityType === 'campaign' ? 'Enter a campaign ID...' : 'Enter a journey ID...';

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-primary rounded-xl shadow-xl p-8 w-full max-w-md border border-border">
        <h2 className="text-2xl font-bold mb-4 text-text">{title}</h2>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder={placeholder}
            className="flex-grow bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-text"
            onKeyPress={(e) => e.key === 'Enter' && handleAddId()}
          />
          <button
            onClick={handleAddId}
            className="bg-accent text-background px-4 py-2 rounded-lg font-semibold hover:bg-accent-hover transition-colors"
          >
            Add
          </button>
        </div>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {ids.length > 0 ? (
            ids.map(id => (
              <div key={id} className="flex justify-between items-center bg-background/50 p-3 rounded-lg border border-border">
                <span className="font-mono text-sm text-text">{id}</span>
                <button 
                  onClick={() => handleRemoveId(id)} 
                  className="text-danger hover:text-danger/80 font-bold text-lg hover:bg-danger/10 p-1 rounded transition-colors"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <p className="text-text-secondary text-center py-4">No IDs added yet.</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="bg-background text-text px-6 py-2 rounded-lg font-semibold hover:bg-background/80 transition-colors border border-border"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="bg-accent text-background px-6 py-2 rounded-lg font-semibold hover:bg-accent-hover transition-colors"
          >
            Save Selections
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdManager; 