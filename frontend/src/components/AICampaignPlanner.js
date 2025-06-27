import React, { useState } from 'react';
import api from '../services/api';
import { 
  Clock, 
  Calendar, 
  TestTube, 
  AlertTriangle, 
  Route, 
  Copy, 
  TrendingUp, 
  Target,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const RecommendationCard = ({ title, content, type = 'info', onCopy }) => (
  <div className={`bg-primary border border-border rounded-xl p-4 ${
    type === 'success' ? 'border-green-500/30' : 
    type === 'warning' ? 'border-yellow-500/30' : 
    type === 'error' ? 'border-red-500/30' : ''
  }`}>
    <div className="flex justify-between items-center mb-3">
      <h4 className="font-semibold text-accent flex items-center">
        {type === 'success' && <CheckCircle size={16} className="mr-2 text-green-500" />}
        {type === 'warning' && <AlertCircle size={16} className="mr-2 text-yellow-500" />}
        {type === 'error' && <AlertTriangle size={16} className="mr-2 text-red-500" />}
        {type === 'info' && <Lightbulb size={16} className="mr-2" />}
        {title}
      </h4>
      {onCopy && (
        <button onClick={() => onCopy(content)} className="text-text-secondary hover:text-accent transition-colors">
          <Copy size={16} />
        </button>
      )}
    </div>
    <div className="text-sm text-text bg-background/50 p-3 rounded-md">
      {typeof content === 'string' ? (
        <p className="whitespace-pre-wrap">{content}</p>
      ) : Array.isArray(content) ? (
        <ul className="space-y-1">
          {content.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-accent mr-2">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <pre className="text-xs overflow-x-auto">{JSON.stringify(content, null, 2)}</pre>
      )}
    </div>
  </div>
);

const AICampaignPlanner = () => {
  const [activeTab, setActiveTab] = useState('send-time');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({});

  // Send Time Optimization
  const [sendTimeData, setSendTimeData] = useState({
    historical_data: [],
    audience_segment: 'general'
  });

  // Content Calendar
  const [calendarData, setCalendarData] = useState({
    campaign_goals: '',
    industry: 'e-commerce',
    timeframe: '90'
  });

  // A/B Test Suggestions
  const [abTestData, setAbTestData] = useState({
    campaign_data: {
      campaign_type: 'newsletter',
      subject_line: '',
      content_type: 'promotional',
      target_audience: 'general'
    },
    historical_performance: {}
  });

  // Performance Anomalies
  const [anomalyData, setAnomalyData] = useState({
    campaign_data: {
      performance: {
        open_rate: '',
        click_rate: '',
        conversion_rate: '',
        bounce_rate: ''
      }
    },
    historical_baseline: {}
  });

  // Campaign Sequence
  const [sequenceData, setSequenceData] = useState({
    campaign_goals: '',
    audience_data: {
      size: '',
      demographics: '',
      interests: ''
    },
    product_info: {
      type: '',
      features: '',
      benefits: ''
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      let endpoint;
      let data;

      switch (activeTab) {
        case 'send-time':
          endpoint = '/ai/send-time-recommendations';
          data = sendTimeData;
          break;
        case 'calendar':
          endpoint = '/ai/content-calendar';
          data = calendarData;
          break;
        case 'ab-tests':
          endpoint = '/ai/ab-test-suggestions';
          data = abTestData;
          break;
        case 'anomalies':
          endpoint = '/ai/performance-anomalies';
          data = anomalyData;
          break;
        case 'sequence':
          endpoint = '/ai/campaign-sequence';
          data = sequenceData;
          break;
        default:
          return;
      }

      response = await api.post(endpoint, data);
      setResults(prev => ({ ...prev, [activeTab]: response.data }));
    } catch (err) {
      setError(err.response?.data?.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: 'send-time', name: 'Send Time Optimization', icon: Clock },
    { id: 'calendar', name: 'Content Calendar', icon: Calendar },
    { id: 'ab-tests', name: 'A/B Test Suggestions', icon: TestTube },
    { id: 'anomalies', name: 'Performance Anomalies', icon: AlertTriangle },
    { id: 'sequence', name: 'Campaign Sequence', icon: Route }
  ];

  const industries = [
    'e-commerce', 'saas', 'healthcare', 'finance', 'education', 
    'real-estate', 'travel', 'food-beverage', 'fashion', 'technology'
  ];

  const audienceSegments = [
    'general', 'new_subscribers', 'engaged_users', 'customers', 
    'prospects', 'vip_customers', 'cart_abandoners'
  ];

  const renderSendTimeForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Historical Campaign Data (JSON)
        </label>
        <textarea
          value={JSON.stringify(sendTimeData.historical_data, null, 2)}
          onChange={(e) => {
            try {
              setSendTimeData(prev => ({
                ...prev,
                historical_data: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="8"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Paste your historical campaign data in JSON format..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Audience Segment
        </label>
        <select
          value={sendTimeData.audience_segment}
          onChange={(e) => setSendTimeData(prev => ({ ...prev, audience_segment: e.target.value }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
        >
          {audienceSegments.map(segment => (
            <option key={segment} value={segment} className="bg-primary">
              {segment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderCalendarForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Campaign Goals *
        </label>
        <textarea
          value={calendarData.campaign_goals}
          onChange={(e) => setCalendarData(prev => ({ ...prev, campaign_goals: e.target.value }))}
          rows="4"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="Describe your campaign goals and objectives..."
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Industry *
          </label>
          <select
            value={calendarData.industry}
            onChange={(e) => setCalendarData(prev => ({ ...prev, industry: e.target.value }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            required
          >
            {industries.map(industry => (
              <option key={industry} value={industry} className="bg-primary">
                {industry.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Timeframe (days)
          </label>
          <input
            type="number"
            value={calendarData.timeframe}
            onChange={(e) => setCalendarData(prev => ({ ...prev, timeframe: e.target.value }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            min="30"
            max="365"
          />
        </div>
      </div>
    </div>
  );

  const renderABTestForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Campaign Type
          </label>
          <select
            value={abTestData.campaign_data.campaign_type}
            onChange={(e) => setAbTestData(prev => ({
              ...prev,
              campaign_data: { ...prev.campaign_data, campaign_type: e.target.value }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          >
            <option value="newsletter">Newsletter</option>
            <option value="promotional">Promotional</option>
            <option value="welcome">Welcome</option>
            <option value="abandoned_cart">Abandoned Cart</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Content Type
          </label>
          <select
            value={abTestData.campaign_data.content_type}
            onChange={(e) => setAbTestData(prev => ({
              ...prev,
              campaign_data: { ...prev.campaign_data, content_type: e.target.value }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          >
            <option value="promotional">Promotional</option>
            <option value="educational">Educational</option>
            <option value="newsletter">Newsletter</option>
            <option value="product_launch">Product Launch</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Subject Line
        </label>
        <input
          type="text"
          value={abTestData.campaign_data.subject_line}
          onChange={(e) => setAbTestData(prev => ({
            ...prev,
            campaign_data: { ...prev.campaign_data, subject_line: e.target.value }
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="Enter your current subject line..."
        />
      </div>
    </div>
  );

  const renderAnomalyForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Open Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={anomalyData.campaign_data.performance.open_rate}
            onChange={(e) => setAnomalyData(prev => ({
              ...prev,
              campaign_data: {
                ...prev.campaign_data,
                performance: { ...prev.campaign_data.performance, open_rate: e.target.value }
              }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            placeholder="25.5"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Click Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={anomalyData.campaign_data.performance.click_rate}
            onChange={(e) => setAnomalyData(prev => ({
              ...prev,
              campaign_data: {
                ...prev.campaign_data,
                performance: { ...prev.campaign_data.performance, click_rate: e.target.value }
              }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            placeholder="3.2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Conversion Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={anomalyData.campaign_data.performance.conversion_rate}
            onChange={(e) => setAnomalyData(prev => ({
              ...prev,
              campaign_data: {
                ...prev.campaign_data,
                performance: { ...prev.campaign_data.performance, conversion_rate: e.target.value }
              }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            placeholder="1.8"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Bounce Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={anomalyData.campaign_data.performance.bounce_rate}
            onChange={(e) => setAnomalyData(prev => ({
              ...prev,
              campaign_data: {
                ...prev.campaign_data,
                performance: { ...prev.campaign_data.performance, bounce_rate: e.target.value }
              }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            placeholder="2.1"
          />
        </div>
      </div>
    </div>
  );

  const renderSequenceForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Campaign Goals *
        </label>
        <textarea
          value={sequenceData.campaign_goals}
          onChange={(e) => setSequenceData(prev => ({ ...prev, campaign_goals: e.target.value }))}
          rows="3"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="What are your main campaign objectives?"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Audience Size
          </label>
          <input
            type="text"
            value={sequenceData.audience_data.size}
            onChange={(e) => setSequenceData(prev => ({
              ...prev,
              audience_data: { ...prev.audience_data, size: e.target.value }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            placeholder="e.g., 10,000 subscribers"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Demographics
          </label>
          <input
            type="text"
            value={sequenceData.audience_data.demographics}
            onChange={(e) => setSequenceData(prev => ({
              ...prev,
              audience_data: { ...prev.audience_data, demographics: e.target.value }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            placeholder="e.g., 25-45, tech-savvy"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Interests
          </label>
          <input
            type="text"
            value={sequenceData.audience_data.interests}
            onChange={(e) => setSequenceData(prev => ({
              ...prev,
              audience_data: { ...prev.audience_data, interests: e.target.value }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            placeholder="e.g., technology, productivity"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Product Type
          </label>
          <input
            type="text"
            value={sequenceData.product_info.type}
            onChange={(e) => setSequenceData(prev => ({
              ...prev,
              product_info: { ...prev.product_info, type: e.target.value }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            placeholder="e.g., SaaS, E-commerce, Service"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-2">
            Key Features
          </label>
          <input
            type="text"
            value={sequenceData.product_info.features}
            onChange={(e) => setSequenceData(prev => ({
              ...prev,
              product_info: { ...prev.product_info, features: e.target.value }
            }))}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
            placeholder="e.g., automation, analytics, integration"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Key Benefits
        </label>
        <textarea
          value={sequenceData.product_info.benefits}
          onChange={(e) => setSequenceData(prev => ({
            ...prev,
            product_info: { ...prev.product_info, benefits: e.target.value }
          }))}
          rows="3"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="What are the main benefits your product provides?"
        />
      </div>
    </div>
  );

  const renderForm = () => {
    switch (activeTab) {
      case 'send-time': return renderSendTimeForm();
      case 'calendar': return renderCalendarForm();
      case 'ab-tests': return renderABTestForm();
      case 'anomalies': return renderAnomalyForm();
      case 'sequence': return renderSequenceForm();
      default: return null;
    }
  };

  const renderResults = () => {
    const result = results[activeTab];
    if (!result) return null;

    switch (activeTab) {
      case 'send-time':
        return (
          <div className="space-y-4">
            <RecommendationCard 
              title="Best Send Times" 
              content={result.send_time_recommendations?.best_days} 
              type="success"
              onCopy={copyToClipboard}
            />
            <RecommendationCard 
              title="Optimal Hours" 
              content={result.send_time_recommendations?.best_hours} 
              type="info"
              onCopy={copyToClipboard}
            />
            <RecommendationCard 
              title="Optimization Tips" 
              content={result.optimization_tips} 
              type="info"
            />
            <RecommendationCard 
              title="Data Insights" 
              content={result.data_insights} 
              type="info"
            />
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4">
            {result.content_calendar?.map((week, index) => (
              <RecommendationCard 
                key={index}
                title={`Week ${week.week}: ${week.theme}`}
                content={{
                  type: week.campaign_type,
                  topics: week.content_topics,
                  messages: week.key_messages,
                  ctas: week.call_to_actions
                }}
                type="info"
                onCopy={copyToClipboard}
              />
            ))}
            <RecommendationCard 
              title="Campaign Frequency" 
              content={result.campaign_frequency} 
              type="success"
            />
          </div>
        );

      case 'ab-tests':
        return (
          <div className="space-y-4">
            {result.ab_test_suggestions?.map((test, index) => (
              <RecommendationCard 
                key={index}
                title={test.test_name}
                content={{
                  hypothesis: test.hypothesis,
                  variantA: test.variant_a,
                  variantB: test.variant_b,
                  expectedImprovement: test.expected_improvement,
                  confidenceLevel: test.confidence_level
                }}
                type="info"
                onCopy={copyToClipboard}
              />
            ))}
            <RecommendationCard 
              title="Testing Strategy" 
              content={result.testing_strategy} 
              type="success"
            />
          </div>
        );

      case 'anomalies':
        return (
          <div className="space-y-4">
            {result.anomalies_detected?.map((anomaly, index) => (
              <RecommendationCard 
                key={index}
                title={`${anomaly.metric} Anomaly`}
                content={{
                  currentValue: anomaly.current_value,
                  baselineValue: anomaly.baseline_value,
                  deviation: anomaly.deviation,
                  description: anomaly.description,
                  recommendation: anomaly.recommendation
                }}
                type={anomaly.severity === 'high' ? 'error' : 'warning'}
                onCopy={copyToClipboard}
              />
            ))}
            <RecommendationCard 
              title="Recommended Actions" 
              content={result.recommended_actions} 
              type="success"
            />
          </div>
        );

      case 'sequence':
        return (
          <div className="space-y-4">
            {result.campaign_sequence?.map((email, index) => (
              <RecommendationCard 
                key={index}
                title={`Email ${email.email_number}: ${email.type}`}
                content={{
                  subject: email.subject_line,
                  purpose: email.purpose,
                  timing: email.timing,
                  content: email.key_content,
                  cta: email.call_to_action
                }}
                type="info"
                onCopy={copyToClipboard}
              />
            ))}
            <RecommendationCard 
              title="Sequence Strategy" 
              content={result.sequence_strategy} 
              type="success"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-text mb-2">AI Campaign Planner</h2>
        <p className="text-text-secondary">
          Advanced AI-powered tools to optimize your email marketing campaigns and improve performance.
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-primary rounded-lg p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent text-background'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <tab.icon size={16} className="mr-2" />
            {tab.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderForm()}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center px-6 py-3 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            <TrendingUp size={20} className="mr-2" />
            {loading ? 'Analyzing...' : 'Generate Analysis'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 text-sm text-danger bg-danger/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {results[activeTab] && (
        <div className="mt-10 pt-8 border-t border-border">
          <h3 className="text-xl font-bold text-text mb-6">Analysis Results</h3>
          {renderResults()}
        </div>
      )}
    </div>
  );
};

export default AICampaignPlanner; 