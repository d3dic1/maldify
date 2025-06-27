import React from 'react';
import { Mail, TrendingUp, TrendingDown } from 'lucide-react';

const TopPerformers = ({ data = [] }) => {
  // Use passed data, or an empty array as a fallback
  const topEmails = data.length > 0 ? data : [];

  return (
    <div className="bg-background-secondary p-4 sm:p-6 rounded-xl border border-border min-w-0">
      <h2 className="text-lg sm:text-xl font-bold text-text mb-4">Top Performing Emails</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead>
            <tr className="border-b border-border">
              <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-text-secondary">Email Name</th>
              <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-text-secondary">Type</th>
              <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-text-secondary text-right">Open Rate</th>
              <th className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-text-secondary text-right">Click Rate</th>
            </tr>
          </thead>
          <tbody>
            {topEmails.map((email, index) => (
              <tr key={email.id || index} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                <td className="p-2 sm:p-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-2 sm:mr-4 ${email.type === 'campaign' ? 'bg-secondary/20' : 'bg-accent/20'}`}>
                      <Mail size={20} className={email.type === 'campaign' ? 'text-secondary' : 'text-accent'} />
                    </div>
                    <p className="font-semibold text-text text-xs sm:text-base">{email.name}</p>
                  </div>
                </td>
                <td className="p-2 sm:p-4">
                  <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full capitalize ${email.type === 'campaign' ? 'bg-secondary/20 text-secondary' : 'bg-accent/20 text-accent'}`}>
                    {email.type}
                  </span>
                </td>
                <td className="p-2 sm:p-4 text-right">
                  <div className="flex items-center justify-end">
                    <TrendingUp size={16} className="text-success mr-2" />
                    <span className="font-semibold text-text text-xs sm:text-base">{email.openRate.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="p-2 sm:p-4 text-right">
                    <div className="flex items-center justify-end">
                        <TrendingUp size={16} className="text-success mr-2" />
                        <span className="font-semibold text-text text-xs sm:text-base">{email.clickRate.toFixed(1)}%</span>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopPerformers; 