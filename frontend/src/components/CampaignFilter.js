import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const CampaignFilter = ({ onFilterChange, onResults }) => {
  const [filters, setFilters] = useState({
    type: '',
    types: [],
    state: '',
    folder_id: '',
    q: '',
    limit: 20,
    offset: 0,
    sort: 'name',
    sort_order: 'desc'
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const campaignTypes = [
    { value: 'email', label: 'Email Campaigns' },
    { value: 'journey', label: 'Journeys' },
    { value: 'sms', label: 'SMS Campaigns' },
    { value: 'push', label: 'Push Notifications' },
    { value: 'whatsapp', label: 'WhatsApp Campaigns' },
    { value: 'playbook', label: 'Playbooks' }
  ];

  const campaignStates = [
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'sending', label: 'Sending' },
    { value: 'sent', label: 'Sent' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'on', label: 'Active' },
    { value: 'off', label: 'Inactive' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'state', label: 'Status' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'edited_at', label: 'Last Modified' },
    { value: 'opens', label: 'Opens' },
    { value: 'clicks', label: 'Clicks' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'conversions', label: 'Conversions' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleTypeChange = (type, checked) => {
    let newTypes = [...filters.types];
    if (checked) {
      newTypes.push(type);
    } else {
      newTypes = newTypes.filter(t => t !== type);
    }
    handleFilterChange('types', newTypes);
  };

  const applyFilters = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.types.length > 0) params.append('types', filters.types.join(','));
      if (filters.state) params.append('state', filters.state);
      if (filters.folder_id) params.append('folder_id', filters.folder_id);
      if (filters.q) params.append('q', filters.q);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);

      const response = await api.get(`/campaigns/filtered?${params.toString()}`);
      
      if (response.data.success) {
        setResults(response.data.data);
        onResults?.(response.data.data);
      } else {
        setError('Failed to fetch campaigns');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while fetching campaigns');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    const defaultFilters = {
      type: '',
      types: [],
      state: '',
      folder_id: '',
      q: '',
      limit: 20,
      offset: 0,
      sort: 'name',
      sort_order: 'desc'
    };
    setFilters(defaultFilters);
    onFilterChange?.(defaultFilters);
  };

  const exportCampaigns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/campaigns/export', filters);
      
      if (response.data.success) {
        // Create downloadable file
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `campaigns-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        setError('Failed to export campaigns');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while exporting campaigns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Campaign Filter</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Query */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Campaigns
          </label>
          <input
            type="text"
            value={filters.q}
            onChange={(e) => handleFilterChange('q', e.target.value)}
            placeholder="Search by campaign name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Campaign Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {campaignTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Campaign State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.state}
            onChange={(e) => handleFilterChange('state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {campaignStates.map(state => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>

        {/* Folder ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Folder ID
          </label>
          <input
            type="text"
            value={filters.folder_id}
            onChange={(e) => handleFilterChange('folder_id', e.target.value)}
            placeholder="Enter folder ID..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Results Limit
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort Options */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={filters.sort_order}
              onChange={(e) => handleFilterChange('sort_order', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Multiple Type Selection */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Multiple Types (overrides single type)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {campaignTypes.map(type => (
            <label key={type.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.types.includes(type.value)}
                onChange={(e) => handleTypeChange(type.value, e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button
          onClick={applyFilters}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Apply Filters'}
        </button>
        
        <button
          onClick={exportCampaigns}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Exporting...' : 'Export Campaigns'}
        </button>
        
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Reset Filters
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            Found {results.campaigns.length} campaigns
            {results.has_more && ` (more available)`}
          </p>
        </div>
      )}
    </div>
  );
};

export default CampaignFilter; 