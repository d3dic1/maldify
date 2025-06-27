import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const InstallTracking = () => {
  const [installData, setInstallData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30daysAgo');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    loadProperties();
    loadInstallData();
  }, [dateRange]);

  const loadProperties = async () => {
    try {
      const response = await api.get('/analytics/properties');
      setProperties(response.data.properties || []);
    } catch (err) {
      console.error('Error loading properties:', err);
    }
  };

  const loadInstallData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: dateRange,
        endDate: 'today'
      });

      let endpoint = '/install-tracking/all';
      if (selectedProperty !== 'all') {
        endpoint = `/install-tracking/property/${selectedProperty}`;
      }

      const response = await api.get(`${endpoint}?${params}`);
      setInstallData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load install data');
      console.error('Error loading install data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getDateRangeLabel = (range) => {
    const ranges = {
      '7daysAgo': 'Last 7 Days',
      '30daysAgo': 'Last 30 Days',
      '90daysAgo': 'Last 90 Days',
      '365daysAgo': 'Last Year'
    };
    return ranges[range] || range;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Install Data</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadInstallData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Install Tracking</h1>
          <p className="text-gray-600">App install events from all GA4 properties</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7daysAgo">Last 7 Days</option>
            <option value="30daysAgo">Last 30 Days</option>
            <option value="90daysAgo">Last 90 Days</option>
            <option value="365daysAgo">Last Year</option>
          </select>
          
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.propertyId} value={property.propertyId}>
                {property.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={loadInstallData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {installData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Installs</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatNumber(installData.summary?.totalInstalls || 0)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Across {installData.summary?.propertiesAnalyzed || 0} properties
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Unique Installs</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatNumber(installData.summary?.totalUniqueInstalls || 0)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Deduplicated users
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Date Range</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {getDateRangeLabel(dateRange)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {installData.dateRange?.startDate} to {installData.dateRange?.endDate}
            </p>
          </div>
        </div>
      )}

      {/* Source Breakdown */}
      {installData?.summary?.sourceBreakdown && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Install Sources</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medium</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Installs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Installs</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {installData.summary.sourceBreakdown.map((source, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {source.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {source.medium}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(source.installs)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(source.uniqueInstalls)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaign Breakdown */}
      {installData?.summary?.campaignBreakdown && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ortto Campaign ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Installs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Installs</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {installData.summary.campaignBreakdown.map((campaign, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {campaign.campaign}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.orttoCampaignId ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {campaign.orttoCampaignId}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not mapped</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(campaign.installs)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(campaign.uniqueInstalls)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Property Details */}
      {installData?.data && Array.isArray(installData.data) && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Property Details</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {installData.data.map((propertyData, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    {propertyData.propertyLabel} ({propertyData.propertyId})
                  </h4>
                  <div className="text-sm text-gray-500">
                    {propertyData.success ? (
                      <span className="text-green-600">✓ Success</span>
                    ) : (
                      <span className="text-red-600">✗ Failed</span>
                    )}
                  </div>
                </div>
                
                {propertyData.success ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Installs: {formatNumber(propertyData.totalInstalls)}</p>
                      <p className="text-sm text-gray-600">Unique Installs: {formatNumber(propertyData.uniqueInstalls)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Install Records: {propertyData.installs.length}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-600">{propertyData.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallTracking; 