import React from 'react';
import { Users, Eye, MousePointerClick, TrendingUp, AlertCircle, TrendingDown, Mail } from 'lucide-react';

// Placeholder data
const metrics = [
  {
    icon: Users,
    label: 'Total Recipients',
    value: '125,663',
    change: '+15.2%',
    changeType: 'increase',
  },
  {
    icon: Eye,
    label: 'Total Opens',
    value: '82,345',
    change: '+8.7%',
    changeType: 'increase',
  },
  {
    icon: MousePointerClick,
    label: 'Total Clicks',
    value: '12,789',
    change: '-2.1%',
    changeType: 'decrease',
  },
  {
    icon: Mail,
    label: 'Delivery Rate',
    value: '99.8%',
    change: '+0.1%',
    changeType: 'increase',
  },
];

const MetricCard = ({ icon: Icon, label, value, change, changeType }) => (
  <div className="bg-primary p-6 rounded-xl border border-border flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-text-secondary">{label}</h3>
      <Icon className="text-accent" size={24} />
    </div>
    <div>
      <p className="text-4xl font-bold text-text">{value}</p>
      <div className="flex items-center mt-1">
        {changeType === 'increase' ? (
          <TrendingUp className="text-success" size={16} />
        ) : (
          <TrendingDown className="text-danger" size={16} />
        )}
        <span className={`ml-2 text-sm font-medium ${changeType === 'increase' ? 'text-success' : 'text-danger'}`}>
          {change}
        </span>
        <span className="ml-2 text-xs text-text-secondary">from last week</span>
      </div>
    </div>
  </div>
);

const MetricsOverview = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
};

export default MetricsOverview; 