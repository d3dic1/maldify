import React, { useState } from 'react';
import api from '../services/api';
import { 
  Users, 
  TrendingDown, 
  Activity, 
  UserCheck, 
  Copy, 
  AlertTriangle, 
  CheckCircle,
  Target,
  BarChart3,
  Lightbulb,
  Clock,
  DollarSign
} from 'lucide-react';

const IntelligenceCard = ({ title, content, type = 'info', onCopy, icon: Icon }) => (
  <div className={`bg-primary border border-border rounded-xl p-4 ${
    type === 'success' ? 'border-green-500/30' : 
    type === 'warning' ? 'border-yellow-500/30' : 
    type === 'error' ? 'border-red-500/30' : ''
  }`}>
    <div className="flex justify-between items-center mb-3">
      <h4 className="font-semibold text-accent flex items-center">
        <Icon size={16} className="mr-2" />
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

const AudienceIntelligence = () => {
  const [activeTab, setActiveTab] = useState('segments');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({});

  // Predictive Segmentation
  const [segmentData, setSegmentData] = useState({
    subscriber_data: [],
    historical_behavior: {}
  });

  // Churn Prediction
  const [churnData, setChurnData] = useState({
    subscriber_data: [],
    engagement_history: {},
    purchase_history: {}
  });

  // Engagement Scoring
  const [engagementData, setEngagementData] = useState({
    subscriber_data: [],
    recent_activity: {}
  });

  // Persona Development
  const [personaData, setPersonaData] = useState({
    subscriber_data: [],
    behavior_patterns: {},
    demographics: {}
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
        case 'segments':
          endpoint = '/ai/predict-segments';
          data = segmentData;
          break;
        case 'churn':
          endpoint = '/ai/predict-churn';
          data = churnData;
          break;
        case 'engagement':
          endpoint = '/ai/calculate-engagement';
          data = engagementData;
          break;
        case 'personas':
          endpoint = '/ai/develop-personas';
          data = personaData;
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
    { id: 'segments', name: 'Predictive Segmentation', icon: Target },
    { id: 'churn', name: 'Churn Prediction', icon: TrendingDown },
    { id: 'engagement', name: 'Engagement Scoring', icon: Activity },
    { id: 'personas', name: 'Persona Development', icon: Users }
  ];

  const renderSegmentForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Subscriber Data (JSON)
        </label>
        <textarea
          value={JSON.stringify(segmentData.subscriber_data, null, 2)}
          onChange={(e) => {
            try {
              setSegmentData(prev => ({
                ...prev,
                subscriber_data: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="8"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Enter subscriber data in JSON format..."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Historical Behavior (JSON)
        </label>
        <textarea
          value={JSON.stringify(segmentData.historical_behavior, null, 2)}
          onChange={(e) => {
            try {
              setSegmentData(prev => ({
                ...prev,
                historical_behavior: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="6"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Enter historical behavior data in JSON format..."
        />
      </div>
    </div>
  );

  const renderChurnForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Subscriber Data (JSON)
        </label>
        <textarea
          value={JSON.stringify(churnData.subscriber_data, null, 2)}
          onChange={(e) => {
            try {
              setChurnData(prev => ({
                ...prev,
                subscriber_data: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="8"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Enter subscriber data in JSON format..."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Engagement History (JSON)
        </label>
        <textarea
          value={JSON.stringify(churnData.engagement_history, null, 2)}
          onChange={(e) => {
            try {
              setChurnData(prev => ({
                ...prev,
                engagement_history: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="6"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Enter engagement history in JSON format..."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Purchase History (JSON)
        </label>
        <textarea
          value={JSON.stringify(churnData.purchase_history, null, 2)}
          onChange={(e) => {
            try {
              setChurnData(prev => ({
                ...prev,
                purchase_history: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="6"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Enter purchase history in JSON format..."
        />
      </div>
    </div>
  );

  const renderEngagementForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Subscriber Data (JSON)
        </label>
        <textarea
          value={JSON.stringify(engagementData.subscriber_data, null, 2)}
          onChange={(e) => {
            try {
              setEngagementData(prev => ({
                ...prev,
                subscriber_data: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="8"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Enter subscriber data in JSON format..."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Recent Activity (JSON)
        </label>
        <textarea
          value={JSON.stringify(engagementData.recent_activity, null, 2)}
          onChange={(e) => {
            try {
              setEngagementData(prev => ({
                ...prev,
                recent_activity: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="6"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Enter recent activity data in JSON format..."
        />
      </div>
    </div>
  );

  const renderPersonaForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Subscriber Data (JSON)
        </label>
        <textarea
          value={JSON.stringify(personaData.subscriber_data, null, 2)}
          onChange={(e) => {
            try {
              setPersonaData(prev => ({
                ...prev,
                subscriber_data: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="8"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Enter subscriber data in JSON format..."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Behavior Patterns (JSON)
        </label>
        <textarea
          value={JSON.stringify(personaData.behavior_patterns, null, 2)}
          onChange={(e) => {
            try {
              setPersonaData(prev => ({
                ...prev,
                behavior_patterns: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="6"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Enter behavior patterns in JSON format..."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Demographics (JSON)
        </label>
        <textarea
          value={JSON.stringify(personaData.demographics, null, 2)}
          onChange={(e) => {
            try {
              setPersonaData(prev => ({
                ...prev,
                demographics: JSON.parse(e.target.value)
              }));
            } catch (err) {
              // Handle invalid JSON
            }
          }}
          rows="6"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text font-mono text-sm"
          placeholder="Enter demographics data in JSON format..."
        />
      </div>
    </div>
  );

  const renderForm = () => {
    switch (activeTab) {
      case 'segments':
        return renderSegmentForm();
      case 'churn':
        return renderChurnForm();
      case 'engagement':
        return renderEngagementForm();
      case 'personas':
        return renderPersonaForm();
      default:
        return null;
    }
  };

  const renderResults = () => {
    const result = results[activeTab];
    if (!result) return null;

    switch (activeTab) {
      case 'segments':
        return (
          <div className="space-y-4">
            {result.predicted_segments?.map((segment, index) => (
              <IntelligenceCard
                key={index}
                title={`${segment.segment_name} (${segment.confidence_score}% confidence)`}
                content={segment.recommended_actions}
                type="success"
                onCopy={copyToClipboard}
                icon={Target}
              />
            ))}
            {result.insights && (
              <IntelligenceCard
                title="Key Insights"
                content={result.insights}
                type="info"
                onCopy={copyToClipboard}
                icon={Lightbulb}
              />
            )}
            {result.recommendations && (
              <IntelligenceCard
                title="Recommendations"
                content={result.recommendations}
                type="info"
                onCopy={copyToClipboard}
                icon={CheckCircle}
              />
            )}
          </div>
        );

      case 'churn':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-primary border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Overall Churn Rate</span>
                  <TrendingDown size={20} className="text-red-500" />
                </div>
                <div className="text-2xl font-bold text-text mt-2">{result.overall_churn_rate}</div>
              </div>
              <div className="bg-primary border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">High Risk</span>
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div className="text-2xl font-bold text-text mt-2">{result.high_risk_count}</div>
              </div>
              <div className="bg-primary border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Low Risk</span>
                  <CheckCircle size={20} className="text-green-500" />
                </div>
                <div className="text-2xl font-bold text-text mt-2">{result.low_risk_count}</div>
              </div>
            </div>
            {result.churn_predictions?.slice(0, 5).map((prediction, index) => (
              <IntelligenceCard
                key={index}
                title={`${prediction.subscriber_id} - ${prediction.churn_probability}% churn risk`}
                content={prediction.recommended_actions}
                type={prediction.risk_level === 'high' ? 'error' : prediction.risk_level === 'medium' ? 'warning' : 'info'}
                onCopy={copyToClipboard}
                icon={TrendingDown}
              />
            ))}
            {result.prevention_strategies && (
              <IntelligenceCard
                title="Prevention Strategies"
                content={result.prevention_strategies}
                type="info"
                onCopy={copyToClipboard}
                icon={Lightbulb}
              />
            )}
          </div>
        );

      case 'engagement':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-primary border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">High Engagement</span>
                  <Activity size={20} className="text-green-500" />
                </div>
                <div className="text-2xl font-bold text-text mt-2">{result.score_breakdown?.high_engagement}%</div>
              </div>
              <div className="bg-primary border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Medium Engagement</span>
                  <BarChart3 size={20} className="text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-text mt-2">{result.score_breakdown?.medium_engagement}%</div>
              </div>
              <div className="bg-primary border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Low Engagement</span>
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div className="text-2xl font-bold text-text mt-2">{result.score_breakdown?.low_engagement}%</div>
              </div>
            </div>
            {result.engagement_scores?.slice(0, 5).map((score, index) => (
              <IntelligenceCard
                key={index}
                title={`${score.subscriber_id} - ${score.overall_score}/100 (${score.engagement_level})`}
                content={score.recommendations}
                type={score.engagement_level === 'high' ? 'success' : score.engagement_level === 'medium' ? 'warning' : 'error'}
                onCopy={copyToClipboard}
                icon={Activity}
              />
            ))}
            {result.engagement_trends && (
              <IntelligenceCard
                title="Engagement Trends"
                content={result.engagement_trends}
                type="info"
                onCopy={copyToClipboard}
                icon={BarChart3}
              />
            )}
          </div>
        );

      case 'personas':
        return (
          <div className="space-y-4">
            {result.personas?.map((persona, index) => (
              <div key={index} className="bg-primary border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-accent flex items-center">
                    <Users size={16} className="mr-2" />
                    {persona.persona_name}
                  </h4>
                  <div className="text-sm text-text-secondary">
                    {persona.segment_size} subscribers • {persona.lifetime_value} LTV
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-text-secondary mb-2">Demographics</h5>
                    <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                      <p>Age: {persona.demographics.age_range}</p>
                      <p>Location: {persona.demographics.location}</p>
                      <p>Income: {persona.demographics.income_level}</p>
                      <p>Occupation: {persona.demographics.occupation}</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-text-secondary mb-2">Behavior Patterns</h5>
                    <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                      <ul className="space-y-1">
                        {persona.behavior_patterns.slice(0, 3).map((pattern, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-accent mr-2">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <h5 className="font-medium text-text-secondary mb-2">Recommended Strategies</h5>
                  <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                    <ul className="space-y-1">
                      {persona.recommended_strategies.map((strategy, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-accent mr-2">•</span>
                          <span>{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
            {result.persona_insights && (
              <IntelligenceCard
                title="Persona Insights"
                content={result.persona_insights}
                type="info"
                onCopy={copyToClipboard}
                icon={Lightbulb}
              />
            )}
            {result.targeting_recommendations && (
              <IntelligenceCard
                title="Targeting Recommendations"
                content={result.targeting_recommendations}
                type="info"
                onCopy={copyToClipboard}
                icon={Target}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">Audience Intelligence</h2>
        <div className="text-sm text-text-secondary">
          AI-powered audience analysis and insights
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-background p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <tab.icon size={16} className="mr-2" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-primary border border-border rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderForm()}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                'Analyze Audience'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle size={20} className="text-red-500 mr-2" />
            <span className="text-red-500">{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-text">Analysis Results</h3>
          {renderResults()}
        </div>
      )}
    </div>
  );
};

export default AudienceIntelligence; 