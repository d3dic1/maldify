import React, { useState } from 'react';
import api from '../services/api';

const EmailAnalyzer = ({ onAnalysisComplete, onEmailDataUpdate, emailData }) => {
  const [formData, setFormData] = useState({
    subject_line: emailData.subject_line || '',
    preview_text: emailData.preview_text || '',
    email_content: emailData.email_content || '',
    target_audience: emailData.target_audience || 'general',
    campaign_type: emailData.campaign_type || 'newsletter'
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const FormField = ({ label, name, value, onChange, placeholder, required, charCount, maxCount, component = 'input', rows }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-text-secondary mb-2">
        {label} {required && '*'}
      </label>
      {component === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent focus:border-accent transition"
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent focus:border-accent transition"
          placeholder={placeholder}
          required={required}
        />
      )}
      {charCount !== undefined && (
        <p className="mt-2 text-xs text-text-secondary text-right">
          {charCount}/{maxCount}
        </p>
      )}
    </div>
  );

  const SelectField = ({ label, name, value, onChange, options }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-text-secondary mb-2">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent focus:border-accent transition appearance-none"
      >
        {options.map(option => (
          <option key={option.value} value={option.value} className="bg-primary text-text">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const audienceOptions = [
    { value: 'general', label: 'General Audience' },
    { value: 'new_subscribers', label: 'New Subscribers' },
    { value: 'engaged_users', label: 'Engaged Users' },
    { value: 'inactive_users', label: 'Inactive Users' },
    { value: 'customers', label: 'Existing Customers' },
    { value: 'prospects', label: 'Prospects' }
  ];

  const campaignTypes = [
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'abandoned_cart', label: 'Abandoned Cart' },
    { value: 'welcome', label: 'Welcome Series' },
    { value: 're_engagement', label: 'Re-engagement' },
    { value: 'upsell', label: 'Upsell' },
    { value: 'cross_sell', label: 'Cross-sell' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    onEmailDataUpdate(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/analyze-email', formData);
      setResults(response.data);
      onAnalysisComplete(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    return 'text-danger';
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  const getSpamRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-success';
      case 'medium': return 'text-accent';
      case 'high': return 'text-danger';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-text mb-2">Email Content Analyzer</h2>
        <p className="text-text-secondary">
          Get AI-powered analysis of your email content to improve open rates, click rates, and engagement.
        </p>
      </header>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          label="Subject Line"
          name="subject_line"
          value={formData.subject_line}
          onChange={handleInputChange}
          placeholder="e.g., ✨ New Features to Boost Your Workflow"
          required
          charCount={formData.subject_line.length}
          maxCount={60}
        />
        
        <FormField
          label="Preview Text"
          name="preview_text"
          value={formData.preview_text}
          onChange={handleInputChange}
          placeholder="A short, catchy phrase that appears after the subject."
          component="textarea"
          rows={2}
          charCount={formData.preview_text.length}
          maxCount={150}
        />

        <FormField
          label="Email Content"
          name="email_content"
          value={formData.email_content}
          onChange={handleInputChange}
          placeholder="Paste your full email body here..."
          required
          component="textarea"
          rows={10}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Target Audience"
            name="target_audience"
            value={formData.target_audience}
            onChange={handleInputChange}
            options={audienceOptions}
          />
          <SelectField
            label="Campaign Type"
            name="campaign_type"
            value={formData.campaign_type}
            onChange={handleInputChange}
            options={campaignTypes}
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading || !formData.subject_line || !formData.email_content}
            className="px-6 py-3 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Email'}
          </button>
        </div>
      </form>

      {results && (
        <div className="mt-10 pt-8 border-t border-border space-y-6">
          <h3 className="text-xl font-bold text-text">Analysis Results</h3>
          
          {/* Overall Score */}
          <div className="bg-background rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-text mb-4">Overall Score</h4>
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold ${getScoreColor(results.overall_score)}`}>
                {results.overall_score}/10
              </div>
              <div>
                <div className={`text-lg font-semibold ${getScoreColor(results.overall_score)}`}>
                  {getScoreLabel(results.overall_score)}
                </div>
                <div className="text-sm text-text-secondary">
                  {results.overall_feedback}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-text mb-4">Subject Line Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Score:</span>
                  <span className={`font-bold ${getScoreColor(results.subject_line_score)}`}>
                    {results.subject_line_score}/10
                  </span>
                </div>
                <div className="text-sm text-text-secondary">
                  {results.subject_line_feedback}
                </div>
              </div>
            </div>

            <div className="bg-background rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-text mb-4">Content Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Score:</span>
                  <span className={`font-bold ${getScoreColor(results.content_score)}`}>
                    {results.content_score}/10
                  </span>
                </div>
                <div className="text-sm text-text-secondary">
                  {results.content_feedback}
                </div>
              </div>
            </div>
          </div>

          {/* Spam Risk */}
          <div className="bg-background rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-text mb-4">Spam Risk Assessment</h4>
            <div className="flex items-center gap-4">
              <div className={`text-xl font-bold ${getSpamRiskColor(results.spam_risk)}`}>
                {results.spam_risk.charAt(0).toUpperCase() + results.spam_risk.slice(1)} Risk
              </div>
              <div className="text-sm text-text-secondary">
                {results.spam_feedback}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="bg-background rounded-xl p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-text mb-4">Recommendations</h4>
              <ul className="space-y-2">
                {results.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-success text-lg">•</span>
                    <span className="text-sm text-text-secondary">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailAnalyzer; 