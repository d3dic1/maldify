import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const MetricCard = ({ title, value, suffix = '', trend, change, changeType, icon, isRate = false }) => {
  const isPositive = changeType === 'positive';
  const trendColor = isPositive ? 'text-success' : 'text-danger';
  const TrendIcon = isPositive ? ArrowUpIcon : ArrowDownIcon;

  // Format value: rates as 1 decimal, counts as integer
  let displayValue = value;
  if (typeof value === 'number') {
    displayValue = isRate ? value.toFixed(1) : value.toLocaleString();
  }

  return (
    <div className="bg-background-secondary p-4 sm:p-6 rounded-xl border border-border flex flex-col justify-between min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="text-text-secondary font-medium text-sm sm:text-base">{title}</h3>
        {icon}
      </div>
      <div>
        <p className="text-2xl sm:text-4xl font-bold text-text mt-2">
          {displayValue}{suffix}
        </p>
        {(change || trend) && (
          <div className={`mt-2 flex items-center text-xs sm:text-sm font-semibold ${trendColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="ml-1">{change || `${Math.abs(trend)}%`}</span>
            <span className="ml-1 text-text-secondary font-normal">from last week</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard; 