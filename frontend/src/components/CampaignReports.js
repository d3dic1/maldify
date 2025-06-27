import React, { useEffect, useState } from 'react';
import api from '../services/api';
import MetricCard from './MetricCard';
import CombinedOverview from './CombinedOverview';
import TopPerformers from './TopPerformers';
import { BarChart2, Mail, MousePointerClick, Send, Users } from 'lucide-react';

const CampaignReports = ({ campaignIds = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [campaignReports, setCampaignReports] = useState(null);

  // Fetch data when campaignIds change
  useEffect(() => {
    console.log('CampaignReports: campaignIds changed:', campaignIds);
    if (campaignIds.length > 0) {
      console.log('CampaignReports: Fetching data for IDs:', campaignIds);
      fetchCampaignReports();
    } else {
      console.log('CampaignReports: No campaign IDs available');
      setCampaignReports(null);
      setError(null);
    }
  }, [campaignIds]); // Use campaignIds array directly instead of join

  const fetchCampaignReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('CampaignReports: Starting fetch with IDs:', campaignIds);
      
      if (!campaignIds || campaignIds.length === 0) {
        setError('No campaign IDs found. Please add campaign IDs using the Campaign Manager.');
        setLoading(false);
        return;
      }

      console.log('CampaignReports: Fetching reports for campaign IDs:', campaignIds);

      // Fetch individual reports for all campaigns
      const response = await api.get(`/campaigns/reports`, {
        params: { campaignIds: campaignIds.join(',') },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = response.data;
      setCampaignReports(data);
    } catch (err) {
      console.error('CampaignReports: Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCampaignId = (id) => {
    return id.substring(0, 8) + '...';
  };

  const calculateMetrics = (campaign) => {
    return {
      openRate: (campaign.unique_opens / campaign.total_recipients) * 100 || 0,
      ctr: (campaign.unique_clicks / campaign.total_recipients) * 100 || 0,
      conversions: campaign.clicks || 0,
      appInstalls: campaign.opens || 0,
    };
  };

  // Aggregate metrics for campaigns
  const metrics = React.useMemo(() => {
    if (!campaignReports || !Array.isArray(campaignReports.campaigns)) return null;
    return campaignReports.campaigns.reduce((acc, c) => {
      acc.totalRecipients += c.total_recipients || 0;
      acc.totalOpens += c.opens || 0;
      acc.totalClicks += c.clicks || 0;
      acc.totalDeliveries += c.deliveries || 0;
      acc.totalBounces += c.bounces || 0;
      acc.totalUnsubscribes += c.unsubscribes || 0;
      acc.totalUniqueOpens += c.unique_opens || 0;
      acc.totalUniqueClicks += c.unique_clicks || 0;
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
  }, [campaignReports]);

  // Top performers (by open rate)
  const topPerformers = React.useMemo(() => {
    if (!campaignReports || !Array.isArray(campaignReports.campaigns)) return [];
    return campaignReports.campaigns
      .map(c => ({
        ...c,
        openRate: c.total_recipients > 0 ? (c.unique_opens / c.total_recipients) * 100 : 0,
        clickRate: c.opens > 0 ? (c.unique_clicks / c.opens) * 100 : 0,
      }))
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);
  }, [campaignReports]);

  return (
    <div className="max-w-7xl mx-auto px-8 py-10 font-sans bg-background min-h-screen">
      {/* Metrics Summary for Campaigns */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <MetricCard title="Total Recipients" value={metrics.totalRecipients} icon={<Users className="text-accent" size={24}/>} />
          <MetricCard title="Total Opens" value={metrics.totalOpens} icon={<Mail className="text-accent" size={24}/>} />
          <MetricCard title="Total Clicks" value={metrics.totalClicks} icon={<MousePointerClick className="text-accent" size={24}/>} />
          <MetricCard title="Total Deliveries" value={metrics.totalDeliveries} icon={<Send className="text-accent" size={24}/>} />
        </div>
      )}
      {/* Combined Overview for Campaigns */}
      {campaignReports && Array.isArray(campaignReports.campaigns) && campaignReports.campaigns.length > 0 && (
        <div className="mb-10">
          <CombinedOverview reportData={campaignReports.campaigns} timeframe="monthly" loading={loading} />
        </div>
      )}
      {/* Top Performers for Campaigns */}
      {topPerformers.length > 0 && (
        <div className="mb-10">
          <TopPerformers data={topPerformers} />
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-extrabold text-text tracking-tight">Campaign Reports</h1>
        <div className="flex gap-3">
          <button 
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold shadow hover:bg-primary-700 transition-colors disabled:opacity-50"
            onClick={fetchCampaignReports}
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
            <span className="ml-3 text-text-secondary font-medium">Loading campaign reports...</span>
          </div>
        </div>
      ) : campaignReports ? (
        <div className="space-y-8">
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <p className="text-primary-800 font-semibold">Showing data for {campaignReports.total} campaign(s)</p>
          </div>
          
          {campaignReports && Array.isArray(campaignReports.campaigns) && campaignReports.campaigns.map((campaign, index) => {
            const metrics = calculateMetrics(campaign);
            
            return (
              <div key={campaign.campaignId} className="bg-card rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-text mb-6 pb-4 border-b border-gray-200">
                  {campaign.name || `Campaign ${index + 1}: ${formatCampaignId(campaign.campaignId)}`}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <MetricCard
                    title="Open Rate"
                    value={`${metrics.openRate.toFixed(1)}%`}
                    trend={{ opens: campaign.opens || 0 }}
                    trendKey="opens"
                  />
                  <MetricCard
                    title="Click-Through Rate"
                    value={`${metrics.ctr.toFixed(1)}%`}
                    trend={{ clicks: campaign.clicks || 0 }}
                    trendKey="clicks"
                  />
                  <MetricCard
                    title="Conversions"
                    value={metrics.conversions}
                    trend={{ conversions: campaign.clicks || 0 }}
                    trendKey="conversions"
                  />
                  <MetricCard
                    title="App Installs"
                    value={metrics.appInstalls}
                    trend={{ app_installs: campaign.opens || 0 }}
                    trendKey="app_installs"
                  />
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-text mb-6">Detailed Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Opens:</span>
                      <span className="text-sm font-bold text-text">{campaign.opens || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Unique Opens:</span>
                      <span className="text-sm font-bold text-text">{campaign.unique_opens || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Clicks:</span>
                      <span className="text-sm font-bold text-text">{campaign.clicks || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Unique Clicks:</span>
                      <span className="text-sm font-bold text-text">{campaign.unique_clicks || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Deliveries:</span>
                      <span className="text-sm font-bold text-text">{campaign.deliveries || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Bounces:</span>
                      <span className="text-sm font-bold text-text">{campaign.bounces || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Unsubscribes:</span>
                      <span className="text-sm font-bold text-text">{campaign.unsubscribes || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                      <span className="text-sm font-semibold text-text-secondary">Total Recipients:</span>
                      <span className="text-sm font-bold text-text">{campaign.total_recipients || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default CampaignReports; 