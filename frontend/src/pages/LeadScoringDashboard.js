import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Target, TrendingUp, TrendingDown, Zap } from 'lucide-react';

const LeadScoringDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'finalScore', direction: 'desc' });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        // Temporarily use basic scoring endpoint while AI is rate limited
        const response = await api.get('/lead-scoring/basic-scores');
        setLeads(response.data);
      } catch (err) {
        setError('Failed to fetch lead scores. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const sortedLeads = useMemo(() => {
    let sortableLeads = [...leads];
    if (sortConfig !== null) {
      sortableLeads.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableLeads;
  }, [leads, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusChip = (status) => {
    switch (status.toLowerCase()) {
      case 'hot':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-danger/20 text-danger">Hot</span>;
      case 'warm':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-warning/20 text-warning">Warm</span>;
      case 'cold':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-info/20 text-info">Cold</span>;
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-text-secondary/20 text-text-secondary">{status}</span>;
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading lead scores...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-danger">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <header className="pb-4 border-b border-border">
        <h1 className="text-3xl font-bold text-text flex items-center">
          <Target size={32} className="mr-3 text-accent" />
          Predictive Lead Scoring
        </h1>
        <p className="text-text-secondary mt-1">
          Identify and prioritize your most valuable leads based on their engagement.
        </p>
      </header>

      <div className="bg-primary border border-border rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-sm font-semibold text-text-secondary">Lead</th>
                <th className="p-4 text-sm font-semibold text-text-secondary cursor-pointer" onClick={() => requestSort('finalScore')}>
                  Score
                  {sortConfig.key === 'finalScore' && (sortConfig.direction === 'desc' ? <TrendingDown className="inline ml-1 h-4 w-4" /> : <TrendingUp className="inline ml-1 h-4 w-4" />)}
                </th>
                <th className="p-4 text-sm font-semibold text-text-secondary">Status</th>
                <th className="p-4 text-sm font-semibold text-text-secondary">AI Recommendation</th>
                <th className="p-4 text-sm font-semibold text-text-secondary">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-text">{lead.name}</div>
                    <div className="text-sm text-text-secondary">{lead.email}</div>
                  </td>
                  <td className="p-4 text-lg font-bold text-accent">{lead.finalScore}</td>
                  <td className="p-4">{getStatusChip(lead.status)}</td>
                  <td className="p-4 text-sm text-text-secondary">{lead.recommendation}</td>
                  <td className="p-4 text-sm text-text-secondary">{new Date(lead.lastActivity).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadScoringDashboard; 