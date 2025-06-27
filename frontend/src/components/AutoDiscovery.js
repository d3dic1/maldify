import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import api, { setAuthToken, authorizedRequest } from '../services/api';
import { useAuth } from '../services/firebase';

const AutoDiscovery = ({ onDiscoveryComplete }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [discoveredAssets, setDiscoveredAssets] = useState(null);
  const [error, setError] = useState(null);
  const [lastDiscover, setLastDiscover] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const { user } = useAuth();
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchLastDiscovery();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]);

  const fetchLastDiscovery = async () => {
    try {
      const token = await user.getIdToken();
      setAuthToken(token);
      const response = await authorizedRequest({ method: 'get', url: '/auth/ids' });
      if (response.data.lastAutoDiscover) {
        setLastDiscover(new Date(response.data.lastAutoDiscover));
      }
    } catch (err) {
      console.log('No previous discovery found');
    }
  };

  const handleAutoDiscover = async () => {
    if (!user) {
      setError('Please log in to use auto-discovery');
      return;
    }
    setLoading(true);
    setError(null);
    setTimedOut(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      setLoading(false);
      setError('Auto-discovery is taking too long. The Ortto API may be rate-limited. Please try again in a minute.');
    }, 30000); // 30 seconds
    try {
      const token = await user.getIdToken();
      setAuthToken(token);
      const response = await authorizedRequest({ method: 'post', url: '/auth/auto-discover' });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (response.data.success) {
        setDiscoveredAssets(response.data.data);
        setLastDiscover(new Date());
        if (onDiscoveryComplete) {
          onDiscoveryComplete(response.data.data);
        }
        setError(null);
      }
    } catch (err) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setError(err.response?.data?.error || 'Failed to auto-discover assets');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) {
      setError('Please log in to refresh assets');
      return;
    }

    setRefreshing(true);
    setError(null);
    
    try {
      const token = await user.getIdToken();
      setAuthToken(token);
      
      const response = await authorizedRequest({ method: 'post', url: '/auth/refresh-discover' });
      
      if (response.data.success) {
        setDiscoveredAssets(response.data.data);
        setLastDiscover(new Date());
        
        // Call the callback to update parent components
        if (onDiscoveryComplete) {
          onDiscoveryComplete(response.data.data);
        }
        
        // Show success message
        setError(null);
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err.response?.data?.error || 'Failed to refresh assets');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Sparkles className="w-6 h-6 text-primary mr-3" />
          <h2 className="text-xl font-bold text-text">Auto-Discovery</h2>
        </div>
        {lastDiscover && (
          <div className="text-sm text-text-secondary">
            Last updated: {formatDate(lastDiscover)}
          </div>
        )}
      </div>

      <div className="mb-6">
        <p className="text-text-secondary mb-4">
          Automatically discover and categorize all campaigns and journeys from your Ortto account. 
          This will fetch all available assets and automatically add them to the appropriate pages.
        </p>
        
        {discoveredAssets && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-background rounded-xl p-4 border border-gray-200">
              <div className="text-2xl font-bold text-text">{discoveredAssets.campaigns.length}</div>
              <div className="text-sm text-text-secondary">Campaigns</div>
            </div>
            <div className="bg-background rounded-xl p-4 border border-gray-200">
              <div className="text-2xl font-bold text-text">{discoveredAssets.journeys.length}</div>
              <div className="text-sm text-text-secondary">Journeys</div>
            </div>
            <div className="bg-background rounded-xl p-4 border border-gray-200">
              <div className="text-2xl font-bold text-text">{discoveredAssets.all.length}</div>
              <div className="text-sm text-text-secondary">Total Assets</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-xl mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {timedOut && (
        <div className="bg-warning/10 border border-warning text-warning px-4 py-3 rounded-xl mb-6 flex items-center">
          Auto-discovery is taking longer than expected. The Ortto API may be rate-limited. Please try again in a minute.
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleAutoDiscover}
          disabled={loading || !user}
          className="flex items-center px-6 py-3 bg-primary text-white rounded-xl font-semibold shadow hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Discovering...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Auto-Discover All
            </>
          )}
        </button>

        <button
          onClick={handleRefresh}
          disabled={refreshing || !user}
          className="flex items-center px-6 py-3 bg-background border border-gray-300 text-text rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {refreshing ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh
            </>
          )}
        </button>
      </div>

      {discoveredAssets && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-text mb-4">Discovered Assets</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-semibold text-text mb-2">Campaigns ({discoveredAssets.campaigns.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {discoveredAssets.campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-gray-200">
                    <div>
                      <div className="font-medium text-text">{campaign.name}</div>
                      <div className="text-sm text-text-secondary">{campaign.id}</div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold text-text mb-2">Journeys ({discoveredAssets.journeys.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {discoveredAssets.journeys.map((journey) => (
                  <div key={journey.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-gray-200">
                    <div>
                      <div className="font-medium text-text">{journey.name}</div>
                      <div className="text-sm text-text-secondary">{journey.id}</div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoDiscovery; 