import React from 'react';

const TopEmailsTable = ({ emails, metric }) => {
  return (
    <div className="bg-card rounded-2xl shadow-lg p-8 font-sans">
      <h2 className="text-xl font-bold text-text mb-6 tracking-tight">Top 5 Emails by {metric === 'open' ? 'Open Rate' : 'Click Rate'}</h2>
      <table className="min-w-full rounded-xl overflow-hidden">
        <thead className="bg-background">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Open Rate</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Click Rate</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Sent Date</th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-background">
          {emails.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-6 text-text-secondary">No data</td></tr>
          ) : (
            emails.map((email, idx) => (
              <tr key={email.campaignId || email.journeyId || idx} className="hover:bg-background transition-colors">
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    email.type === 'campaign' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {email.type === 'campaign' ? 'Campaign' : 'Journey'}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium text-text">{email.name || 'N/A'}</td>
                <td className="px-5 py-3 text-primary font-semibold">{email.openRate?.toFixed(2)}%</td>
                <td className="px-5 py-3 text-accent font-semibold">{email.clickRate?.toFixed(2)}%</td>
                <td className="px-5 py-3 text-text-secondary">{email.sent_date ? new Date(email.sent_date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TopEmailsTable; 