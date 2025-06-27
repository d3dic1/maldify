import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary p-4 rounded-lg border border-border shadow-lg">
          <p className="label text-text-secondary">{`${label}`}</p>
          <p className="intro text-accent">{`Opens : ${payload[0].value}`}</p>
          <p className="intro text-secondary">{`Clicks : ${payload[1].value}`}</p>
        </div>
      );
    }
  
    return null;
};

// Helper to group data by week (for monthly view)
function groupByWeek(reports) {
  // Assume each report has a 'week' or 'date' property, otherwise group by 4 equal chunks
  if (!reports || reports.length === 0) return [];
  // If reports have a 'week' property, use it
  if (reports[0].week) {
    const weekMap = {};
    reports.forEach(r => {
      if (!weekMap[r.week]) weekMap[r.week] = { name: r.week, Opens: 0, Clicks: 0 };
      weekMap[r.week].Opens += r.opens || 0;
      weekMap[r.week].Clicks += r.clicks || 0;
    });
    return Object.values(weekMap);
  }
  // Otherwise, split into 4 weeks
  const chunkSize = Math.ceil(reports.length / 4);
  const result = [];
  for (let i = 0; i < 4; i++) {
    const chunk = reports.slice(i * chunkSize, (i + 1) * chunkSize);
    result.push({
      name: `Week ${i + 1}`,
      Opens: chunk.reduce((sum, r) => sum + (r.opens || 0), 0),
      Clicks: chunk.reduce((sum, r) => sum + (r.clicks || 0), 0),
    });
  }
  return result;
}

// Helper to group data by day (for weekly view)
function groupByDay(reports) {
  // If reports have a 'day' property, use it
  if (!reports || reports.length === 0) return [];
  if (reports[0].day) {
    const dayMap = {};
    reports.forEach(r => {
      if (!dayMap[r.day]) dayMap[r.day] = { name: r.day, Opens: 0, Clicks: 0 };
      dayMap[r.day].Opens += r.opens || 0;
      dayMap[r.day].Clicks += r.clicks || 0;
    });
    return Object.values(dayMap);
  }
  // Otherwise, just show a single week summary
  return [
    {
      name: 'This Week',
      Opens: reports.reduce((sum, r) => sum + (r.opens || 0), 0),
      Clicks: reports.reduce((sum, r) => sum + (r.clicks || 0), 0),
    },
  ];
}

const CombinedOverview = ({ reportData = [], timeframe = 'monthly', loading }) => {
  // Memoize processed data
  const weeklyData = useMemo(() => groupByDay(reportData), [reportData]);
  const monthlyData = useMemo(() => groupByWeek(reportData), [reportData]);
  const data = timeframe === 'weekly' ? weeklyData : monthlyData;

  return (
    <div className="bg-primary p-4 sm:p-6 rounded-xl border border-border min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-text">Performance Overview</h2>
        <div className="flex space-x-2">
            {/* The timeframe toggle is now handled by Dashboard */}
            <span className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-md transition ${timeframe === 'weekly' ? 'bg-accent text-background' : 'bg-transparent text-text-secondary'}`}>Weekly</span>
            <span className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-md transition ${timeframe === 'monthly' ? 'bg-accent text-background' : 'bg-transparent text-text-secondary'}`}>Monthly</span>
        </div>
      </div>
      <div className="w-full" style={{ minHeight: 250, height: '40vw', maxHeight: 400 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-text-secondary">Loading chart...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#A0A0A0" />
              <YAxis stroke="#A0A0A0" />
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2A4C" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#E0E0E0' }}/>
              <Area type="monotone" dataKey="Opens" stroke="#34D399" fillOpacity={1} fill="url(#colorOpens)" />
              <Area type="monotone" dataKey="Clicks" stroke="#A855F7" fillOpacity={1} fill="url(#colorClicks)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CombinedOverview;