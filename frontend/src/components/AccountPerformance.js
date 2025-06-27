import React from 'react';

const AccountPerformance = ({ data }) => {
  if (!data) return null;

  // Calculate performance metrics
  const totalSent = Number(data.total_recipients) || 0;
  const totalDelivered = Number(data.deliveries) || 0;
  const totalOpened = Number(data.total_opens) || 0;
  const totalClicked = Number(data.total_clicks) || 0;
  const totalBounced = Number(data.total_bounces) || 0;
  const totalInvalid = Number(data.invalid) || 0;
  const totalUnsubscribed = Number(data.total_unsubscribes) || 0;

  // Calculate rates
  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
  const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
  const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
  const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
  const invalidRate = totalSent > 0 ? (totalInvalid / totalSent) * 100 : 0;
  const unsubscribeRate = totalDelivered > 0 ? (totalUnsubscribed / totalDelivered) * 100 : 0;

  const metrics = [
    { label: 'Delivery Rate', value: deliveryRate, color: 'text-success' },
    { label: 'Open Rate', value: openRate, color: 'text-primary' },
    { label: 'Click Rate', value: clickRate, color: 'text-accent' },
    { label: 'Bounce Rate', value: bounceRate, color: 'text-danger' },
    { label: 'Invalid Rate', value: invalidRate, color: 'text-text-secondary' },
    { label: 'Unsubscribe Rate', value: unsubscribeRate, color: 'text-text-secondary' },
  ];

  return (
    <div className="bg-card rounded-2xl shadow-lg p-8 font-sans border border-[#E5E7EB] flex flex-col gap-6">
      <h2 className="text-xl font-bold text-text mb-4 tracking-tight">Account Performance</h2>
      <div className="grid grid-cols-2 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{m.label}</span>
            <span className={`text-2xl font-extrabold ${m.color}`}>{m.value.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountPerformance; 