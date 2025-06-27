import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TopEmailsChart = ({ emails, metric }) => {
  const labels = emails.map(e => e.name || e.campaignId || 'N/A');
  const data = emails.map(e => metric === 'open' ? e.openRate : e.clickRate);

  const chartData = {
    labels,
    datasets: [
      {
        label: metric === 'open' ? 'Open Rate (%)' : 'Click Rate (%)',
        data,
        backgroundColor: metric === 'open' ? '#2563eb' : '#f59e42', // Figma blue or orange
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Top 5 Emails by ${metric === 'open' ? 'Open Rate' : 'Click Rate'}`,
        color: '#1a1a1a',
        font: { size: 18, weight: 'bold', family: 'Inter, sans-serif' },
        padding: { bottom: 16 },
      },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`,
        },
        backgroundColor: '#fff',
        titleColor: '#1a1a1a',
        bodyColor: '#1a1a1a',
        borderColor: '#e5e7eb',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Rate (%)',
          color: '#6b7280',
          font: { size: 14, family: 'Inter, sans-serif' },
        },
        ticks: {
          color: '#6b7280',
          font: { family: 'Inter, sans-serif' },
        },
        grid: {
          color: '#f4f6fa',
        },
      },
      x: {
        ticks: {
          color: '#6b7280',
          font: { family: 'Inter, sans-serif' },
        },
        grid: {
          color: '#f4f6fa',
        },
      },
    },
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg p-8 font-sans">
      <Bar data={chartData} options={options} height={320} />
    </div>
  );
};

export default TopEmailsChart; 