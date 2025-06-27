import React, { useState } from 'react';
import api from '../services/api';
import { 
  TestTube, 
  Edit3, 
  Image, 
  MousePointer, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Target,
  BarChart3,
  Lightbulb,
  Eye,
  Palette
} from 'lucide-react';

const RecommendationCard = ({ title, content, type = 'info', onCopy, icon: Icon }) => (
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

const SmartRecommendations = () => {
  const [activeTab, setActiveTab] = useState('ab-tests');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({});

  // Subject Line A/B Testing
  const [abTestData, setAbTestData] = useState({
    campaign_data: {
      campaign_type: 'newsletter',
      product_service: '',
      target_audience: 'general',
      offer: ''
    },
    historical_performance: {}
  });

  // Content Optimization
  const [contentData, setContentData] = useState({
    email_content: '',
    target_audience: 'general',
    campaign_goals: ''
  });

  // Image Recommendations
  const [imageData, setImageData] = useState({
    campaign_theme: '',
    target_audience: 'general',
    content_type: 'email'
  });

  // CTA Optimization
  const [ctaData, setCtaData] = useState({
    cta_data: {
      current_cta: '',
      button_text: '',
      placement: ''
    },
    conversion_goals: ''
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
        case 'ab-tests':
          endpoint = '/ai/generate-subject-line-tests';
          data = abTestData;
          break;
        case 'content':
          endpoint = '/ai/optimize-email-content';
          data = contentData;
          break;
        case 'images':
          endpoint = '/ai/recommend-images';
          data = imageData;
          break;
        case 'cta':
          endpoint = '/ai/optimize-cta';
          data = ctaData;
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
    { id: 'ab-tests', name: 'Subject Line A/B Tests', icon: TestTube },
    { id: 'content', name: 'Content Optimization', icon: Edit3 },
    { id: 'images', name: 'Image Recommendations', icon: Image },
    { id: 'cta', name: 'CTA Optimization', icon: MousePointer }
  ];

  const renderABTestForm = () => (
    <div className="space-y-6">
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
          <option value="abandoned_cart">Abandoned Cart</option>
          <option value="welcome">Welcome Series</option>
          <option value="re_engagement">Re-engagement</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Product/Service
        </label>
        <input
          type="text"
          value={abTestData.campaign_data.product_service}
          onChange={(e) => setAbTestData(prev => ({
            ...prev,
            campaign_data: { ...prev.campaign_data, product_service: e.target.value }
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="Describe your product or service..."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Target Audience
        </label>
        <select
          value={abTestData.campaign_data.target_audience}
          onChange={(e) => setAbTestData(prev => ({
            ...prev,
            campaign_data: { ...prev.campaign_data, target_audience: e.target.value }
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
        >
          <option value="general">General</option>
          <option value="new_subscribers">New Subscribers</option>
          <option value="engaged_users">Engaged Users</option>
          <option value="customers">Customers</option>
          <option value="prospects">Prospects</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Special Offer (Optional)
        </label>
        <input
          type="text"
          value={abTestData.campaign_data.offer}
          onChange={(e) => setAbTestData(prev => ({
            ...prev,
            campaign_data: { ...prev.campaign_data, offer: e.target.value }
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="e.g., 50% off, Free shipping, etc."
        />
      </div>
    </div>
  );

  const renderContentForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Email Content
        </label>
        <textarea
          value={contentData.email_content}
          onChange={(e) => setContentData(prev => ({
            ...prev,
            email_content: e.target.value
          }))}
          rows="8"
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="Paste your email content here..."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Target Audience
        </label>
        <select
          value={contentData.target_audience}
          onChange={(e) => setContentData(prev => ({
            ...prev,
            target_audience: e.target.value
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
        >
          <option value="general">General</option>
          <option value="new_subscribers">New Subscribers</option>
          <option value="engaged_users">Engaged Users</option>
          <option value="customers">Customers</option>
          <option value="prospects">Prospects</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Campaign Goals
        </label>
        <input
          type="text"
          value={contentData.campaign_goals}
          onChange={(e) => setContentData(prev => ({
            ...prev,
            campaign_goals: e.target.value
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="e.g., Increase sales, Drive traffic, Build awareness..."
        />
      </div>
    </div>
  );

  const renderImageForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Campaign Theme
        </label>
        <input
          type="text"
          value={imageData.campaign_theme}
          onChange={(e) => setImageData(prev => ({
            ...prev,
            campaign_theme: e.target.value
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="e.g., Professional, Casual, Luxury, Tech, etc."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Target Audience
        </label>
        <select
          value={imageData.target_audience}
          onChange={(e) => setImageData(prev => ({
            ...prev,
            target_audience: e.target.value
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
        >
          <option value="general">General</option>
          <option value="business">Business</option>
          <option value="young_professionals">Young Professionals</option>
          <option value="parents">Parents</option>
          <option value="students">Students</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Content Type
        </label>
        <select
          value={imageData.content_type}
          onChange={(e) => setImageData(prev => ({
            ...prev,
            content_type: e.target.value
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
        >
          <option value="email">Email</option>
          <option value="social_media">Social Media</option>
          <option value="landing_page">Landing Page</option>
          <option value="blog">Blog</option>
        </select>
      </div>
    </div>
  );

  const renderCTAForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Current CTA Text
        </label>
        <input
          type="text"
          value={ctaData.cta_data.current_cta}
          onChange={(e) => setCtaData(prev => ({
            ...prev,
            cta_data: { ...prev.cta_data, current_cta: e.target.value }
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="e.g., Click Here, Learn More, etc."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Button Text
        </label>
        <input
          type="text"
          value={ctaData.cta_data.button_text}
          onChange={(e) => setCtaData(prev => ({
            ...prev,
            cta_data: { ...prev.cta_data, button_text: e.target.value }
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="e.g., Get Started, Download Now, etc."
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          CTA Placement
        </label>
        <select
          value={ctaData.cta_data.placement}
          onChange={(e) => setCtaData(prev => ({
            ...prev,
            cta_data: { ...prev.cta_data, placement: e.target.value }
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
        >
          <option value="">Select placement...</option>
          <option value="header">Header</option>
          <option value="above_fold">Above the Fold</option>
          <option value="middle">Middle of Content</option>
          <option value="end">End of Content</option>
          <option value="footer">Footer</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-2">
          Conversion Goals
        </label>
        <input
          type="text"
          value={ctaData.conversion_goals}
          onChange={(e) => setCtaData(prev => ({
            ...prev,
            conversion_goals: e.target.value
          }))}
          className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
          placeholder="e.g., Increase sign-ups, Boost sales, Drive downloads..."
        />
      </div>
    </div>
  );

  const renderForm = () => {
    switch (activeTab) {
      case 'ab-tests':
        return renderABTestForm();
      case 'content':
        return renderContentForm();
      case 'images':
        return renderImageForm();
      case 'cta':
        return renderCTAForm();
      default:
        return null;
    }
  };

  const renderResults = () => {
    const result = results[activeTab];
    if (!result) return null;

    switch (activeTab) {
      case 'ab-tests':
        return (
          <div className="space-y-4">
            {result.ab_tests?.map((test, index) => (
              <div key={index} className="bg-primary border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-accent flex items-center">
                    <TestTube size={16} className="mr-2" />
                    {test.test_name}
                  </h4>
                  <div className="text-sm text-text-secondary">
                    Expected: {test.expected_improvement}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-text-secondary mb-2">Variant A</h5>
                    <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                      <p className="font-medium">{test.variant_a.subject_line}</p>
                      <p className="text-text-secondary mt-1">Type: {test.variant_a.type}</p>
                      <p className="text-text-secondary">Predicted: {test.variant_a.predicted_open_rate}</p>
                      <ul className="mt-2 space-y-1">
                        {test.variant_a.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-accent mr-2">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-text-secondary mb-2">Variant B</h5>
                    <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                      <p className="font-medium">{test.variant_b.subject_line}</p>
                      <p className="text-text-secondary mt-1">Type: {test.variant_b.type}</p>
                      <p className="text-text-secondary">Predicted: {test.variant_b.predicted_open_rate}</p>
                      <ul className="mt-2 space-y-1">
                        {test.variant_b.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-accent mr-2">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-accent/10 rounded-md">
                  <p className="text-sm font-medium">
                    Recommended Winner: <span className="text-accent">Variant {test.recommended_winner}</span>
                  </p>
                  <p className="text-sm text-text-secondary">Confidence: {test.confidence}</p>
                </div>
              </div>
            ))}
            {result.test_strategies && (
              <RecommendationCard
                title="Test Strategies"
                content={result.test_strategies}
                type="info"
                onCopy={copyToClipboard}
                icon={Target}
              />
            )}
            {result.best_practices && (
              <RecommendationCard
                title="Best Practices"
                content={result.best_practices}
                type="info"
                onCopy={copyToClipboard}
                icon={CheckCircle}
              />
            )}
          </div>
        );

      case 'content':
        return (
          <div className="space-y-4">
            <div className="bg-primary border border-border rounded-xl p-4">
              <h4 className="font-semibold text-accent flex items-center mb-3">
                <Edit3 size={16} className="mr-2" />
                Content Optimization Results
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-text">{result.content_scores?.readability_score}</div>
                  <div className="text-sm text-text-secondary">Readability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text">{result.content_scores?.engagement_score}</div>
                  <div className="text-sm text-text-secondary">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text">{result.content_scores?.conversion_score}</div>
                  <div className="text-sm text-text-secondary">Conversion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{result.content_scores?.overall_score}</div>
                  <div className="text-sm text-text-secondary">Overall</div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-medium text-text-secondary">Key Improvements</h5>
                <ul className="space-y-1">
                  {result.optimized_content?.key_improvements?.map((improvement, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-accent mr-2">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {result.optimization_suggestions?.map((suggestion, index) => (
              <RecommendationCard
                key={index}
                title={`${suggestion.section} - ${suggestion.impact} impact`}
                content={`${suggestion.suggestion} (Expected: ${suggestion.expected_improvement})`}
                type={suggestion.impact === 'high' ? 'warning' : 'info'}
                onCopy={copyToClipboard}
                icon={Lightbulb}
              />
            ))}
            {result.best_practices_applied && (
              <RecommendationCard
                title="Best Practices Applied"
                content={result.best_practices_applied}
                type="success"
                onCopy={copyToClipboard}
                icon={CheckCircle}
              />
            )}
          </div>
        );

      case 'images':
        return (
          <div className="space-y-4">
            {result.image_recommendations?.map((image, index) => (
              <div key={index} className="bg-primary border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-accent flex items-center">
                    <Image size={16} className="mr-2" />
                    {image.image_type}
                  </h4>
                  <div className="text-sm text-text-secondary">
                    {image.size_recommendation}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-text-secondary mb-1">Description</h5>
                    <p className="text-sm text-text bg-background/50 p-3 rounded-md">{image.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-text-secondary mb-1">Style & Colors</h5>
                      <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                        <p>Style: {image.style}</p>
                        <p>Colors: {image.colors.join(', ')}</p>
                        <p>Emotions: {image.emotions.join(', ')}</p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-text-secondary mb-1">Technical Details</h5>
                      <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                        <p>Placement: {image.placement}</p>
                        <p>Alt Text: {image.alt_text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {result.visual_strategy && (
              <RecommendationCard
                title="Visual Strategy"
                content={[
                  `Theme: ${result.visual_strategy.overall_theme}`,
                  `Colors: ${result.visual_strategy.color_palette.join(', ')}`,
                  `Style: ${result.visual_strategy.image_style}`
                ]}
                type="info"
                onCopy={copyToClipboard}
                icon={Palette}
              />
            )}
            {result.stock_photo_suggestions && (
              <RecommendationCard
                title="Stock Photo Suggestions"
                content={result.stock_photo_suggestions}
                type="info"
                onCopy={copyToClipboard}
                icon={Eye}
              />
            )}
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            {result.cta_optimizations?.map((optimization, index) => (
              <div key={index} className="bg-primary border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-accent flex items-center">
                    <MousePointer size={16} className="mr-2" />
                    CTA Optimization
                  </h4>
                  <div className="text-sm text-text-secondary">
                    Expected: {optimization.expected_improvement}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-text-secondary mb-1">Original</h5>
                      <p className="text-sm text-text bg-background/50 p-3 rounded-md">{optimization.original_cta}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-text-secondary mb-1">Optimized</h5>
                      <p className="text-sm text-text bg-background/50 p-3 rounded-md font-medium">{optimization.optimized_cta}</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-text-secondary mb-1">Reasoning</h5>
                    <p className="text-sm text-text bg-background/50 p-3 rounded-md">{optimization.reasoning}</p>
                  </div>
                </div>
              </div>
            ))}
            {result.placement_recommendations && (
              <RecommendationCard
                title="Placement Recommendations"
                content={result.placement_recommendations.map(rec => 
                  `${rec.position}: ${rec.recommendation} (${rec.importance} priority)`
                )}
                type="info"
                onCopy={copyToClipboard}
                icon={Target}
              />
            )}
            {result.design_optimizations && (
              <RecommendationCard
                title="Design Optimizations"
                content={result.design_optimizations.map(opt => 
                  `${opt.element}: ${opt.recommendation} (${opt.impact} impact)`
                )}
                type="info"
                onCopy={copyToClipboard}
                icon={Palette}
              />
            )}
            {result.best_practices && (
              <RecommendationCard
                title="Best Practices"
                content={result.best_practices}
                type="success"
                onCopy={copyToClipboard}
                icon={CheckCircle}
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
        <h2 className="text-2xl font-bold text-text">Smart Recommendations</h2>
        <div className="text-sm text-text-secondary">
          AI-powered optimization suggestions
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
                'Generate Recommendations'
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
          <h3 className="text-xl font-semibold text-text">Recommendations</h3>
          {renderResults()}
        </div>
      )}
    </div>
  );
};

export default SmartRecommendations; 