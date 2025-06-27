import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { UsersIcon, EyeIcon, CursorArrowRaysIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';
import { setAuthToken, authorizedRequest } from '../services/api';
import IdManager from './IdManager';
import MetricCard from './MetricCard';
import CombinedOverview from './CombinedOverview';
import TopPerformers from './TopPerformers';
import AutoDiscovery from './AutoDiscovery';
import { useAuth } from '../services/firebase';

const TIMEFRAMES = [
  { label: '7 Days', value: 'last-7-days' },
  { label: '14 Days', value: 'last-14-days' },
  { label: '30 Days', value: 'last-30-days' },
  { label: 'All Time', value: 'all-time' },
];

const BATCH_SIZE = 10;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({});
  const [isCampaignManagerOpen, setIsCampaignManagerOpen] = useState(false);
  const [isJourneyManagerOpen, setIsJourneyManagerOpen] = useState(false);
  const [isAutoDiscoveryOpen, setIsAutoDiscoveryOpen] = useState(false);
  const [campaignIds, setCampaignIds] = useState([]);
  const [journeyIds, setJourneyIds] = useState([]);
  const [timeframe, setTimeframe] = useState('all-time');
  const [pendingItems, setPendingItems] = useState([]);
  const [rateLimitedItems, setRateLimitedItems] = useState([]);
  const [isPartial, setIsPartial] = useState(false);
  const [partialMessage, setPartialMessage] = useState('');
  const [summary, setSummary] = useState(null);
  const { user } = useAuth();

  // Load cached data on mount
  const loadCachedData = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      setAuthToken(token);
      const response = await authorizedRequest({ method: 'get', url: `/reports/cached-reports?timeframe=${timeframe}` });
      
      if (response.data.reports && response.data.reports.length > 0) {
        setReportData(prev => ({ ...prev, [timeframe]: response.data.reports }));
        setPartialMessage(`Loaded ${response.data.count} cached reports (${response.data.cacheAge} minutes old)`);
        setIsPartial(true);
        console.log('Loaded cached data:', response.data.message);
      }
    } catch (error) {
      console.log('No cached data available or error loading cache:', error.message);
    }
  }, [user, timeframe]);

  // Load IDs from backend or localStorage on mount
  useEffect(() => {
    const fetchIds = async () => {
      if (user) {
        const token = await user.getIdToken();
        setAuthToken(token);
        try {
          const res = await authorizedRequest({ method: 'get', url: '/auth/ids' });
          setCampaignIds(res.data.campaignIds || []);
          setJourneyIds(res.data.journeyIds || []);
          
          // Load cached data after IDs are loaded
          await loadCachedData();
        } catch (err) {
          setCampaignIds([]);
          setJourneyIds([]);
        }
      } else {
        const savedCampaignIds = localStorage.getItem('campaignIds');
        const savedJourneyIds = localStorage.getItem('journeyIds');
        if (savedCampaignIds) setCampaignIds(savedCampaignIds.split(',').filter(Boolean));
        if (savedJourneyIds) setJourneyIds(savedJourneyIds.split(',').filter(Boolean));
      }
    };
    fetchIds();
    // eslint-disable-next-line
  }, [user, loadCachedData]);

  // Reset and start batch loading when IDs or timeframe change
  useEffect(() => {
    const allItems = [
      ...campaignIds.map(id => ({ id, type: 'campaign' })),
      ...journeyIds.map(id => ({ id, type: 'journey' })),
    ];
    
    // Don't reset reportData immediately - let the API call determine what's cached
    setPendingItems(allItems);
    setRateLimitedItems([]); // Clear rate limited items when IDs change
    setIsPartial(false);
    setPartialMessage('');
    setSummary(null);
    setError(null);
    
    if (allItems.length > 0) {
      loadNextBatch(allItems, reportData[timeframe] || [], timeframe, false);
    }
    // eslint-disable-next-line
  }, [campaignIds.join(','), journeyIds.join(','), timeframe]);

  // Helper to merge reports by ID
  function mergeReportsById(existing, incoming) {
    const map = new Map();
    existing.forEach(r => map.set(r.id, r));
    incoming.forEach(r => map.set(r.id, { ...map.get(r.id), ...r }));
    return Array.from(map.values());
  }

  // Batch loading function
  const loadNextBatch = useCallback(async (pending, loaded, tf, forceRefresh) => {
    setLoading(true);
    setError(null);
    setIsPartial(false);
    setPartialMessage('');
    setSummary(null);
    const batch = pending.slice(0, BATCH_SIZE);
    const remaining = pending.slice(BATCH_SIZE);
    try {
      const response = await authorizedRequest({ method: 'post', url: '/reports/dashboard-reports', data: { items: batch, timeframe: tf, forceRefresh: !!forceRefresh } });
      let newReports = response.data.reports || response.data || [];
      // If backend returns a single object, wrap in array
      if (!Array.isArray(newReports)) newReports = [newReports];

      // Merge new reports with existing loaded data, updating by ID
      const updatedLoaded = mergeReportsById(loaded, newReports);
      setReportData(prev => ({ ...prev, [tf]: updatedLoaded }));
      setPendingItems(remaining);

      // Handle rate limited items
      if (response.data.rateLimited && response.data.rateLimited.length > 0) {
        setRateLimitedItems(prev => mergeReportsById(prev, response.data.rateLimited));
      }

      // Handle partial/rate-limited
      if (response.data.partial) {
        setIsPartial(true);
        setPartialMessage(response.data.message || 'Some data is still loading...');
        setSummary(response.data.summary || null);
      } else {
        setIsPartial(false);
        setPartialMessage('');
        setSummary(response.data.summary || null);
      }

      // Show background refresh notification
      if (response.data.summary?.source === 'cache_refreshing') {
        setPartialMessage('Data loaded from cache. Fresh data is being fetched in the background...');
        setIsPartial(true);
      }

      // Only schedule next batch if there are more to load AND we're not rate limited
      if (remaining.length > 0 && (!response.data.rateLimited || response.data.rateLimited.length === 0)) {
        setTimeout(() => loadNextBatch(remaining, updatedLoaded, tf, false), 2000); // Increased delay to 2 seconds
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    // Restart batch loading with forceRefresh false, but maintain existing data
    const allItems = [
      ...campaignIds.map(id => ({ id, type: 'campaign' })),
      ...journeyIds.map(id => ({ id, type: 'journey' })),
    ];
    
    // Don't clear reportData - let the API determine what's cached
    setPendingItems(allItems);
    setRateLimitedItems([]); // Clear rate limited items on refresh
    setIsPartial(false);
    setPartialMessage('');
    setSummary(null);
    setError(null);
    
    if (allItems.length > 0) {
      loadNextBatch(allItems, reportData[timeframe] || [], timeframe, false);
    }
  }, [campaignIds, journeyIds, timeframe, loadNextBatch, reportData]);

  // Force refresh function (bypasses cache)
  const handleForceRefresh = useCallback(async () => {
    const allItems = [
      ...campaignIds.map(id => ({ id, type: 'campaign' })),
      ...journeyIds.map(id => ({ id, type: 'journey' })),
    ];
    setReportData(prev => ({ ...prev, [timeframe]: [] }));
    setPendingItems(allItems);
    setRateLimitedItems([]); // Clear rate limited items on force refresh
    setIsPartial(false);
    setPartialMessage('');
    setSummary(null);
    setError(null);
    if (allItems.length > 0) {
      loadNextBatch(allItems, [], timeframe, true);
    }
  }, [campaignIds, journeyIds, timeframe, loadNextBatch]);

  // Clear cache function
  const handleClearCache = useCallback(async () => {
    try {
      await authorizedRequest({ method: 'delete', url: '/reports/cache' });
      // Refresh data after clearing cache (force refresh)
      setReportData(prev => ({ ...prev, [timeframe]: [] }));
      handleForceRefresh();
    } catch (error) {
      setError('Failed to clear cache: ' + error.message);
    }
  }, [handleForceRefresh]);

  // Clear rate limits function
  const handleClearRateLimits = useCallback(async () => {
    try {
      await authorizedRequest({ method: 'delete', url: '/reports/rate-limits' });
      setRateLimitedItems([]);
      setError(null);
      // Refresh data after clearing rate limits
      handleRefresh();
    } catch (error) {
      setError('Failed to clear rate limits: ' + error.message);
    }
  }, [handleRefresh]);

  const aggregatedMetrics = useMemo(() => {
    return (reportData[timeframe] || []).reduce((acc, report) => {
      acc.totalRecipients += report.total_recipients || 0;
      acc.totalOpens += report.opens || 0;
      acc.totalClicks += report.clicks || 0;
      acc.totalDeliveries += report.deliveries || 0;
      return acc;
    }, {
      totalRecipients: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalDeliveries: 0,
    });
  }, [reportData, timeframe]);
  
  const deliveryRate = aggregatedMetrics.totalRecipients > 0
    ? (aggregatedMetrics.totalDeliveries / aggregatedMetrics.totalRecipients) * 100
    : 0;

  const topPerformers = useMemo(() => {
    return (reportData[timeframe] || [])
      .map(report => ({
        name: report.name || `Campaign: ${report.id}`,
        type: report.type,
        id: report.id,
        openRate: report.total_recipients > 0 ? (report.unique_opens / report.total_recipients) * 100 : 0,
        clickRate: report.opens > 0 ? (report.unique_clicks / report.opens) * 100 : 0,
      }))
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);
  }, [reportData, timeframe]);

  // Handle auto-discovery completion
  const handleAutoDiscoveryComplete = async (discoveredData) => {
    // Update the local state with discovered IDs
    setCampaignIds(discoveredData.campaignIds || []);
    setJourneyIds(discoveredData.journeyIds || []);
    setIsAutoDiscoveryOpen(false);
    
    // Refresh the dashboard data
    await handleRefresh();
  };

  // Auto-refresh for pending data
  useEffect(() => {
    if (isPartial && (pendingItems.length > 0 || rateLimitedItems.length > 0)) {
      // Don't auto-refresh if we have rate limited items - wait longer
      if (rateLimitedItems.length > 0) {
        console.log('Rate limited items detected, waiting 5 minutes before retry');
        const timer = setTimeout(() => {
          console.log('Retrying after rate limit cooldown...');
          // Retry with existing data maintained, but only for non-rate-limited items
          const allItems = [
            ...campaignIds.map(id => ({ id, type: 'campaign' })),
            ...journeyIds.map(id => ({ id, type: 'journey' })),
          ];
          
          // Filter out items that are currently rate limited
          const rateLimitedIds = new Set(rateLimitedItems.map(item => item.id));
          const availableItems = allItems.filter(item => !rateLimitedIds.has(item.id));
          
          setPendingItems(availableItems);
          setRateLimitedItems([]); // Clear rate limited items for retry
          loadNextBatch(availableItems, reportData[timeframe] || [], timeframe, false);
        }, 300000); // 5 minutes for rate limited items

        return () => clearTimeout(timer);
      }
      
      // For pending items only, wait 2 minutes
      const timer = setTimeout(() => {
        console.log('Auto-refreshing dashboard data for pending items...');
        // Retry with existing data maintained
        const allItems = [
          ...campaignIds.map(id => ({ id, type: 'campaign' })),
          ...journeyIds.map(id => ({ id, type: 'journey' })),
        ];
        setPendingItems(allItems);
        loadNextBatch(allItems, reportData[timeframe] || [], timeframe, false);
      }, 120000); // 2 minutes for pending items

      return () => clearTimeout(timer);
    }
  }, [isPartial, pendingItems.length, rateLimitedItems, campaignIds, journeyIds, loadNextBatch, reportData, timeframe]);

  return (
    <div className="space-y-8 px-2 sm:px-4 md:px-8 max-w-full w-full">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Dashboard</h1>
          <p className="text-text-secondary">Welcome back, here's a look at your performance.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-2 font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? '🔄' : '🔄'} Refresh
          </button>
          <button 
            onClick={handleForceRefresh}
            disabled={loading}
            className="px-3 py-2 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? '⚡' : '⚡'} Force Refresh
          </button>
          <button 
            onClick={handleClearCache}
            disabled={loading}
            className="px-3 py-2 font-semibold rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? '🗑️' : '🗑️'} Clear Cache
          </button>
          <button 
            onClick={handleClearRateLimits}
            disabled={loading}
            className="px-3 py-2 font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? '🗑️' : '🗑️'} Clear Rate Limits
          </button>
          <button 
            onClick={() => setIsAutoDiscoveryOpen(true)} 
            className="px-4 py-2 font-semibold rounded-lg text-white bg-accent hover:bg-accent-hover transition-colors"
          >
            🚀 Auto-Discover All
          </button>
          <button onClick={() => setIsCampaignManagerOpen(true)} className="px-4 py-2 font-semibold rounded-lg text-white bg-accent hover:bg-accent-hover transition-colors">Manage Campaign IDs</button>
          <button onClick={() => setIsJourneyManagerOpen(true)} className="px-4 py-2 font-semibold rounded-lg text-white bg-primary hover:bg-primary/80 transition-colors border border-border">Manage Journey IDs</button>
        </div>
      </header>

      <div className="flex justify-end">
        <div className="flex items-center gap-2 p-1 rounded-lg bg-background-secondary border border-border">
          {TIMEFRAMES.map(item => (
            <button
              key={item.value}
              onClick={() => setTimeframe(item.value)}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                timeframe === item.value
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-background'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-danger/10 border border-danger text-danger px-6 py-4 rounded-xl font-medium">{error}</div>}

      {/* Warning for too many campaigns */}
      {campaignIds.length > 50 && (
        <div className="bg-warning/10 border border-warning text-warning px-6 py-4 rounded-xl font-medium">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>
              You are loading {campaignIds.length} campaigns/journeys. This may cause rate limiting and slow loading. Consider reducing the number of items or use the auto-discovery feature to get the most recent data.
            </span>
          </div>
        </div>
      )}

      {/* Data source indicator */}
      {summary && summary.source && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
          summary.source === 'firebase_cache' 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : summary.source === 'cache_refreshing'
            ? 'bg-blue-100 border border-blue-300 text-blue-800'
            : summary.source === 'partial_cache'
            ? 'bg-yellow-100 border border-yellow-300 text-yellow-800'
            : 'bg-blue-100 border border-blue-300 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {summary.source === 'firebase_cache' ? '💾' : 
             summary.source === 'cache_refreshing' ? '🔄' :
             summary.source === 'partial_cache' ? '⚠️' : '🔄'}
            <span>
              {summary.source === 'firebase_cache' 
                ? 'Using cached data from Firebase (5-minute cache)' 
                : summary.source === 'cache_refreshing'
                ? 'Using cached data (refreshing in background)'
                : summary.source === 'partial_cache'
                ? 'Using partial cached data (some items missing)'
                : 'Fresh data from Ortto API'
              }
            </span>
            {summary.source === 'firebase_cache' && summary.lastUpdated && (
              <span className="text-xs opacity-75">
                (Last updated: {new Date(summary.lastUpdated).toLocaleString()})
              </span>
            )}
            <span className="text-xs opacity-75">
              • Showing {summary.fetched}/{summary.total} items
            </span>
          </div>
          {summary.source === 'firebase_cache' && (
            <div className="mt-1 text-xs opacity-75">
              💡 Use "Force Refresh" to bypass cache or "Clear Cache" to remove all cached data
            </div>
          )}
          {summary.source === 'cache_refreshing' && (
            <div className="mt-1 text-xs opacity-75">
              💡 Fresh data is being fetched in the background to avoid rate limits
            </div>
          )}
        </div>
      )}

      {/* Partial results warning */}
      {isPartial && partialMessage && (
        <div className="bg-warning/10 border border-warning text-warning px-6 py-4 rounded-xl font-medium">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{partialMessage}</span>
              {summary && (
                <span className="text-sm opacity-75">
                  ({summary.fetched}/{summary.total} fetched)
                </span>
              )}
            </div>
            <button
              onClick={handleRefresh}
              className="px-3 py-1 text-sm font-semibold rounded-md bg-warning text-white hover:bg-warning/80 transition-colors"
            >
              Refresh Now
            </button>
          </div>
          <div className="mt-2 text-sm opacity-75">
            {pendingItems.length > 0 && `Pending: ${pendingItems.length} items due to batching. `}
            {rateLimitedItems.length > 0 && (
              <span className="text-red-600 font-semibold">
                Rate limited: {rateLimitedItems.length} items. Will retry in 5 minutes.
              </span>
            )}
            {pendingItems.length > 0 && !rateLimitedItems.length && 
              "The remaining data will be automatically fetched in 2 minutes, or you can refresh manually."
            }
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading dashboard data...</p>
        </div>
      ) : (campaignIds.length > 0 || journeyIds.length > 0) && reportData[timeframe] && reportData[timeframe].length > 0 ? (
        <div className="space-y-8">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Recipients" value={aggregatedMetrics.totalRecipients} icon={<UsersIcon className="w-6 h-6 text-text-secondary" />} change="+15.2%" changeType="positive" />
            <MetricCard title="Total Opens" value={aggregatedMetrics.totalOpens} icon={<EyeIcon className="w-6 h-6 text-text-secondary" />} change="+8.7%" changeType="positive" />
            <MetricCard title="Total Clicks" value={aggregatedMetrics.totalClicks} icon={<CursorArrowRaysIcon className="w-6 h-6 text-text-secondary" />} change="-2.1%" changeType="negative" />
            <MetricCard title="Delivery Rate" value={deliveryRate} isRate={true} suffix="%" icon={<EnvelopeOpenIcon className="w-6 h-6 text-text-secondary" />} change="+0.1%" changeType="positive" />
          </div>

          <CombinedOverview reportData={reportData[timeframe]} timeframe={timeframe === 'last-7-days' ? 'weekly' : 'monthly'} loading={loading} />
          <TopPerformers data={topPerformers} />
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">No data to display.</p>
          <p className="text-text-secondary mt-2">
            Please add campaign or journey IDs to view the dashboard.
          </p>
        </div>
      )}

      <IdManager isOpen={isCampaignManagerOpen} onClose={() => setIsCampaignManagerOpen(false)} onSave={setCampaignIds} initialIds={campaignIds} entityType="campaign" />
      <IdManager isOpen={isJourneyManagerOpen} onClose={() => setIsJourneyManagerOpen(false)} onSave={setJourneyIds} initialIds={journeyIds} entityType="journey" />
      
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

export default Dashboard; 