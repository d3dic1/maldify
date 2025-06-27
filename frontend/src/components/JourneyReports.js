import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import MetricCard from './MetricCard';
import CombinedOverview from './CombinedOverview';
import TopPerformers from './TopPerformers';
import { BarChart2, Mail, MousePointerClick, Send, Users } from 'lucide-react';

const TIMEFRAMES = [
  { label: 'Last 7 days', value: 'last-7-days' },
  { label: 'Last 14 days', value: 'last-14-days' },
  { label: 'Last 30 days', value: 'last-30-days' },
  { label: 'All time', value: 'all-time' },
];

const JourneyReports = ({ journeyIds = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [journeyReports, setJourneyReports] = useState(null);
  const [timeframe, setTimeframe] = useState('last-7-days');

  const fetchJourneyReports = useCallback(async (selectedTimeframe) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('JourneyReports: Starting fetch with IDs:', journeyIds);
      
      if (!journeyIds || journeyIds.length === 0) {
        setError('No journey IDs found. Please add journey IDs using the Journey Manager.');
        setLoading(false);
        return;
      }
      
      console.log('JourneyReports: Fetching reports for journey IDs:', journeyIds);
      
      // Fetch journey reports
      const response = await api.get('/journeys/reports', {
        params: { journeyIds: journeyIds.join(','), timeframe: selectedTimeframe || timeframe },
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('JourneyReports: Received data:', response.data);
      setJourneyReports(response.data);
    } catch (err) {
      console.error('JourneyReports: Error fetching reports:', err);
      // Handle Ortto API rate limiting (429)
      if (err.response && (err.response.status === 429 || (err.response.data && err.response.data.error && err.response.data.error.toLowerCase().includes('too many requests')))) {
        setError('Too many requests to Ortto API. Please wait 10 minutes and try again.');
      } else {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [journeyIds, timeframe]);

  // Fetch journey reports when component mounts or journeyIds/timeframe changes
  useEffect(() => {
    if (journeyIds && journeyIds.length > 0) {
      console.log('JourneyReports: Fetching reports for journey IDs:', journeyIds);
      fetchJourneyReports(timeframe);
    } else {
      console.log('JourneyReports: No journey IDs available');
      setJourneyReports(null);
      setError(null);
    }
  }, [journeyIds, timeframe, fetchJourneyReports]);

  const formatJourneyName = (journey) => {
    // If the name is just "Journey [ID]", try to make it more user-friendly
    if (journey.name && journey.name.startsWith('Journey ')) {
      const journeyId = journey.journeyId || journey.id;
      // Try to extract a meaningful name from the ID or use a shorter format
      return `Journey ${journeyId.substring(0, 8)}...`;
    }
    return journey.name || `Journey ${journey.journeyId || journey.id}`;
  };

  const calculateJourneyMetrics = (journey) => {
    const totalRecipients = Number(journey.total_recipients) || 0;
    const uniqueOpens = Number(journey.unique_opens) || 0;
    const uniqueClicks = Number(journey.unique_clicks) || 0;
    const deliveries = Number(journey.deliveries) || 0;
    const bounces = Number(journey.bounces) || 0;
    const entered = Number(journey.entered) || 0;
    const exited = Number(journey.exited) || 0;
    const inJourney = Number(journey.in_journey) || 0;
    const revenue = Number(journey.revenue) || 0;
    
    return {
      entryRate: (entered + exited) > 0 ? (entered / (entered + exited)) * 100 : 0,
      exitRate: (entered + exited) > 0 ? (exited / (entered + exited)) * 100 : 0,
      retentionRate: entered > 0 ? (inJourney / entered) * 100 : 0,
      avgRevenue: entered > 0 ? (revenue / entered) : 0,
      openRate: totalRecipients > 0 ? (uniqueOpens / totalRecipients) * 100 : 0,
      ctr: totalRecipients > 0 ? (uniqueClicks / totalRecipients) * 100 : 0,
      deliveryRate: totalRecipients > 0 ? (deliveries / totalRecipients) * 100 : 0,
      bounceRate: totalRecipients > 0 ? (bounces / totalRecipients) * 100 : 0,
    };
  };

  // Aggregate metrics for journeys
  const metrics = React.useMemo(() => {
    if (!journeyReports || !Array.isArray(journeyReports.journeys)) return null;
    return journeyReports.journeys.reduce((acc, j) => {
      acc.totalRecipients += Number(j.total_recipients) || 0;
      acc.totalOpens += Number(j.opens) || 0;
      acc.totalClicks += Number(j.clicks) || 0;
      acc.totalDeliveries += Number(j.deliveries) || 0;
      acc.totalBounces += Number(j.bounces) || 0;
      acc.totalUnsubscribes += Number(j.unsubscribes) || 0;
      acc.totalUniqueOpens += Number(j.unique_opens) || 0;
      acc.totalUniqueClicks += Number(j.unique_clicks) || 0;
      return acc;
    }, {
      totalRecipients: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalDeliveries: 0,
      totalBounces: 0,
      totalUnsubscribes: 0,
      totalUniqueOpens: 0,
      totalUniqueClicks: 0,
    });
  }, [journeyReports]);

  // Top performers (by open rate)
  const topPerformers = React.useMemo(() => {
    if (!journeyReports || !Array.isArray(journeyReports.journeys)) return [];
    return journeyReports.journeys
      .map(j => ({
        ...j,
        openRate: j.total_recipients > 0 ? (j.unique_opens / j.total_recipients) * 100 : 0,
        clickRate: j.opens > 0 ? (j.unique_clicks / j.opens) * 100 : 0,
      }))
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);
  }, [journeyReports]);

  return (
    <div className="max-w-7xl mx-auto px-8 py-10 font-sans bg-background min-h-screen">
      {/* Metrics Summary for Journeys */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <MetricCard title="Total Recipients" value={metrics.totalRecipients} icon={<Users className="text-accent" size={24}/>} />
          <MetricCard title="Total Opens" value={metrics.totalOpens} icon={<Mail className="text-accent" size={24}/>} />
          <MetricCard title="Total Clicks" value={metrics.totalClicks} icon={<MousePointerClick className="text-accent" size={24}/>} />
          <MetricCard title="Total Deliveries" value={metrics.totalDeliveries} icon={<Send className="text-accent" size={24}/>} />
        </div>
      )}
      {/* Combined Overview for Journeys */}
      {journeyReports && Array.isArray(journeyReports.journeys) && journeyReports.journeys.length > 0 && (
        <div className="mb-10">
          <CombinedOverview reportData={journeyReports.journeys} timeframe="monthly" loading={loading} />
        </div>
      )}
      {/* Top Performers for Journeys */}
      {topPerformers.length > 0 && (
        <div className="mb-10">
          <TopPerformers data={topPerformers} />
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-extrabold text-text tracking-tight">Journey Reports</h1>
        <div className="flex gap-3 items-center">
          <select
            className="border border-gray-200 rounded-xl px-4 py-2.5 bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-semibold"
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
            style={{ minWidth: 140 }}
          >
            {TIMEFRAMES.map(tf => (
              <option key={tf.value} value={tf.value}>{tf.label}</option>
            ))}
          </select>
          <button 
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold shadow hover:bg-primary-700 transition-colors disabled:opacity-50"
            onClick={() => fetchJourneyReports(timeframe)} 
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-card rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="bg-danger/10 border border-danger text-danger px-6 py-4 rounded-xl font-medium">
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-card rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-text-secondary font-medium">Loading journey reports...</span>
          </div>
        </div>
      ) : journeyReports && journeyReports.journeys ? (
        <div className="space-y-8">
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <p className="text-primary-800 font-semibold">
              Showing data for {journeyReports.total} journey(s) - {timeframe.replace(/-/g, ' ')}
            </p>
          </div>

          {Array.isArray(journeyReports.journeys) && journeyReports.journeys.map((journey, index) => {
            const metrics = calculateJourneyMetrics(journey);
            
            return (
              <div key={journey.journeyId} className="bg-card rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-text mb-6 pb-4 border-b border-gray-200">
                  {formatJourneyName(journey)}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <MetricCard
                    title="Entry Rate"
                    value={`${metrics.entryRate.toFixed(1)}%`}
                    trend={{ entered: journey.entered || 0 }}
                    trendKey="entered"
                  />
                  <MetricCard
                    title="Exit Rate"
                    value={`${metrics.exitRate.toFixed(1)}%`}
                    trend={{ exited: journey.exited || 0 }}
                    trendKey="exited"
                  />
                  <MetricCard
                    title="Retention Rate"
                    value={`${metrics.retentionRate.toFixed(1)}%`}
                    trend={{ in_journey: journey.in_journey || 0 }}
                    trendKey="in_journey"
                  />
                  <MetricCard
                    title="Avg Revenue"
                    value={`$${metrics.avgRevenue.toFixed(2)}`}
                    trend={{ revenue: journey.revenue || 0 }}
                    trendKey="revenue"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <MetricCard
                    title="Open Rate"
                    value={`${metrics.openRate.toFixed(1)}%`}
                    trend={{ opens: journey.opens || 0 }}
                    trendKey="opens"
                  />
                  <MetricCard
                    title="Click-Through Rate"
                    value={`${metrics.ctr.toFixed(1)}%`}
                    trend={{ clicks: journey.clicks || 0 }}
                    trendKey="clicks"
                  />
                  <MetricCard
                    title="Delivery Rate"
                    value={`${metrics.deliveryRate.toFixed(1)}%`}
                    trend={{ deliveries: journey.deliveries || 0 }}
                    trendKey="deliveries"
                  />
                  <MetricCard
                    title="Bounce Rate"
                    value={`${metrics.bounceRate.toFixed(1)}%`}
                    trend={{ bounces: journey.bounces || 0 }}
                    trendKey="bounces"
                  />
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-text mb-6">Detailed Metrics</h3>
                  
                  <h4 className="text-md font-semibold text-text mb-4">Journey Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Entered:</span>
                      <span className="text-sm font-bold text-text">{journey.entered || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">In Journey:</span>
                      <span className="text-sm font-bold text-text">{journey.in_journey || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Exited:</span>
                      <span className="text-sm font-bold text-text">{journey.exited || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Revenue:</span>
                      <span className="text-sm font-bold text-text">${journey.revenue || 0}</span>
                    </div>
                  </div>
                  
                  <h4 className="text-md font-semibold text-text mb-4">Email Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Opens:</span>
                      <span className="text-sm font-bold text-text">{journey.opens || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Unique Opens:</span>
                      <span className="text-sm font-bold text-text">{journey.unique_opens || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Clicks:</span>
                      <span className="text-sm font-bold text-text">{journey.clicks || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Unique Clicks:</span>
                      <span className="text-sm font-bold text-text">{journey.unique_clicks || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Deliveries:</span>
                      <span className="text-sm font-bold text-text">{journey.deliveries || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Bounces:</span>
                      <span className="text-sm font-bold text-text">{journey.bounces || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Unsubscribes:</span>
                      <span className="text-sm font-bold text-text">{journey.unsubscribes || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Total Recipients:</span>
                      <span className="text-sm font-bold text-text">{journey.total_recipients || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-text-secondary">No journey reports to display.</p>
          <p className="text-text-secondary mt-2">
            Use the "Manage Journeys" button to add some journeys.
          </p>
        </div>
      )}
    </div>
  );
};

export default JourneyReports; 