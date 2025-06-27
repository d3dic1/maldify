/**
 * - On mount: if user is logged in, fetch journeyIds from backend and set state
 * - On save: if user is logged in, save journeyIds to backend; else use localStorage
 */
import React, { useState, useEffect } from 'react';
import JourneyReportsComponent from '../components/JourneyReports';
import IdManager from '../components/IdManager';
import AutoDiscovery from '../components/AutoDiscovery';
import api, { setAuthToken, authorizedRequest } from '../services/api';
import { useAuth } from '../services/firebase';

const LOAD_LIMIT_OPTIONS = [10, 20, 30, 40, 50];

const JourneyReports = () => {
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isAutoDiscoveryOpen, setIsAutoDiscoveryOpen] = useState(false);
  const [journeyIds, setJourneyIds] = useState([]);
  const [maxItems, setMaxItems] = useState(20); // Default to 20
  const { user } = useAuth();

  // Load journey IDs from backend or localStorage on mount
  useEffect(() => {
    const fetchIds = async () => {
      if (user) {
        const token = await user.getIdToken();
        setAuthToken(token);
        try {
          const res = await authorizedRequest({ method: 'get', url: '/auth/ids' });
          setJourneyIds(res.data.journeyIds || []);
        } catch (err) {
          setJourneyIds([]);
        }
      } else {
        // fallback to localStorage for guests
        const savedIds = localStorage.getItem('journeyIds');
        if (savedIds) {
          setJourneyIds(savedIds.split(',').filter(Boolean));
        }
      }
    };
    fetchIds();
    // eslint-disable-next-line
  }, [user]);

  // Save journey IDs to backend or localStorage
  const handleSaveJourneys = async (newJourneyIds) => {
    setJourneyIds(newJourneyIds);
    setIsManagerOpen(false);
    if (user) {
      const token = await user.getIdToken();
      setAuthToken(token);
      try {
        await authorizedRequest({ method: 'post', url: '/auth/ids', data: { journeyIds: newJourneyIds } });
      } catch (err) {
        // Optionally show error
      }
    } else {
      localStorage.setItem('journeyIds', newJourneyIds.join(','));
    }
  };

  // Handle auto-discovery completion
  const handleAutoDiscoveryComplete = async (discoveredData) => {
    // Update the local state with discovered journey IDs
    setJourneyIds(discoveredData.journeyIds || []);
    setIsAutoDiscoveryOpen(false);
  };

  return (
    <div className="px-2 sm:px-4 md:px-8 max-w-6xl mx-auto w-full space-y-8">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1">Journey Reports</h1>
          <p className="text-text-secondary text-sm sm:text-base">Analyze your customer journeys and automation flows.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            className="border border-gray-200 rounded-xl px-4 py-2.5 bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-semibold"
            value={maxItems}
            onChange={e => setMaxItems(Number(e.target.value))}
            style={{ minWidth: 100 }}
          >
            {LOAD_LIMIT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt} journeys</option>
            ))}
          </select>
          <button 
            onClick={() => setIsAutoDiscoveryOpen(true)} 
            className="px-4 py-2 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover transition-colors"
          >
            🚀 Auto-Discover Journeys
          </button>
          <button
            onClick={() => setIsManagerOpen(true)}
            className="px-6 py-3 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover transition-colors"
          >
            Manage Journey IDs
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <JourneyReportsComponent journeyIds={journeyIds.slice(0, maxItems)} />
      </div>

      <IdManager
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onSave={handleSaveJourneys}
        initialIds={journeyIds}
        entityType="journey"
      />

      {/* Auto-Discovery Modal */}
      {isAutoDiscoveryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text">Auto-Discovery</h2>
                <button 
                  onClick={() => setIsAutoDiscoveryOpen(false)}
                  className="text-text-secondary hover:text-text"
                >
                  ✕
                </button>
              </div>
              <AutoDiscovery onDiscoveryComplete={handleAutoDiscoveryComplete} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyReports; 