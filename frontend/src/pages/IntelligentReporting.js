import React from 'react';
import { BarChart3, Sparkles } from 'lucide-react';

const IntelligentReporting = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <BarChart3 size={40} className="text-accent" />
        <div>
          <h1 className="text-3xl font-bold text-text">Intelligent Reporting</h1>
          <p className="text-text-secondary mt-1">AI-powered reporting tools for automated insights, trend analysis, and predictive reporting</p>
        </div>
      </div>

      <div className="bg-primary border border-border rounded-xl p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles size={48} className="text-accent" />
        </div>
        <h2 className="text-2xl font-semibold text-text mb-4">Coming Soon!</h2>
        <p className="text-text-secondary mb-6">
          The Intelligent Reporting tools are currently in development. This feature will provide AI-powered 
          reporting capabilities including automated insights, trend analysis, and predictive reporting.
        </p>
        <div className="bg-background/50 p-4 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-medium text-text mb-2">Planned Features:</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Automated Insights - AI-generated insights from campaign data</li>
            <li>• Trend Analysis - Identify patterns and trends in performance</li>
            <li>• Predictive Reporting - Forecast future performance and trends</li>
            <li>• Custom Report Builder - Create personalized reports with AI assistance</li>
            <li>• Real-time Dashboards - Live performance monitoring with AI alerts</li>
            <li>• Executive Summaries - AI-generated executive-level insights</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IntelligentReporting; 