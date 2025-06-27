import React, { useState } from 'react';
import api from '../services/api';
import { 
  Palette, 
  Copy, 
  Download, 
  Eye,
  Code,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const EmailTemplateDesigner = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    brand_data: {
      company_name: '',
      primary_color: '#2563eb',
      secondary_color: '#ffffff',
      accent_color: '#f59e0b',
      logo_url: '',
      brand_voice: 'professional'
    },
    campaign_type: 'newsletter'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/generate-email-template', formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const campaignTypes = [
    'newsletter',
    'promotional',
    'welcome',
    'abandoned_cart',
    're_engagement',
    'product_launch',
    'event_invitation'
  ];

  const brandVoices = [
    'professional',
    'casual',
    'friendly',
    'luxury',
    'tech',
    'creative'
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <Palette size={40} className="text-accent" />
        <div>
          <h1 className="text-3xl font-bold text-text">Email Template Designer</h1>
          <p className="text-text-secondary mt-1">AI-powered email template generation based on your brand</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-primary border border-border rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.brand_data.company_name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  brand_data: { ...prev.brand_data, company_name: e.target.value }
                }))}
                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                placeholder="Enter your company name..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Campaign Type
              </label>
              <select
                value={formData.campaign_type}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  campaign_type: e.target.value
                }))}
                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
              >
                {campaignTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Primary Color
              </label>
              <input
                type="color"
                value={formData.brand_data.primary_color}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  brand_data: { ...prev.brand_data, primary_color: e.target.value }
                }))}
                className="w-full h-12 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Secondary Color
              </label>
              <input
                type="color"
                value={formData.brand_data.secondary_color}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  brand_data: { ...prev.brand_data, secondary_color: e.target.value }
                }))}
                className="w-full h-12 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Accent Color
              </label>
              <input
                type="color"
                value={formData.brand_data.accent_color}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  brand_data: { ...prev.brand_data, accent_color: e.target.value }
                }))}
                className="w-full h-12 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Logo URL (Optional)
              </label>
              <input
                type="url"
                value={formData.brand_data.logo_url}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  brand_data: { ...prev.brand_data, logo_url: e.target.value }
                }))}
                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Brand Voice
              </label>
              <select
                value={formData.brand_data.brand_voice}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  brand_data: { ...prev.brand_data, brand_voice: e.target.value }
                }))}
                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
              >
                {brandVoices.map(voice => (
                  <option key={voice} value={voice}>
                    {voice.charAt(0).toUpperCase() + voice.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Template...
                </>
              ) : (
                <>
                  <Palette size={16} className="mr-2" />
                  Generate Template
                </>
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
      {result && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-text">Generated Template</h3>
          
          {/* Template Overview */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <Eye size={16} className="mr-2" />
              Template Overview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-text-secondary mb-2">Layout & Structure</h5>
                <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                  <p><strong>Layout Type:</strong> {result.template_design?.layout_type}</p>
                  <p><strong>Header Style:</strong> {result.template_design?.header_style}</p>
                  <p><strong>Content Structure:</strong> {result.template_design?.content_structure}</p>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-text-secondary mb-2">Color Scheme</h5>
                <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: result.template_design?.color_scheme?.primary }}></div>
                    <span>Primary: {result.template_design?.color_scheme?.primary}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: result.template_design?.color_scheme?.secondary }}></div>
                    <span>Secondary: {result.template_design?.color_scheme?.secondary}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: result.template_design?.color_scheme?.accent }}></div>
                    <span>Accent: {result.template_design?.color_scheme?.accent}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Responsive Design */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <Smartphone size={16} className="mr-2" />
              Responsive Design
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.responsive_breakpoints?.map((breakpoint, index) => (
                <div key={index} className="text-sm text-text bg-background/50 p-3 rounded-md">
                  <div className="flex items-center mb-2">
                    {breakpoint.device === 'desktop' ? <Monitor size={16} className="mr-2" /> : <Smartphone size={16} className="mr-2" />}
                    <span className="font-medium">{breakpoint.device} ({breakpoint.width})</span>
                  </div>
                  <ul className="space-y-1">
                    {breakpoint.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-accent mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* HTML Structure */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-accent flex items-center">
                <Code size={16} className="mr-2" />
                HTML Structure
              </h4>
              <button
                onClick={() => copyToClipboard(JSON.stringify(result.html_structure, null, 2))}
                className="text-text-secondary hover:text-accent transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="text-sm text-text bg-background/50 p-3 rounded-md font-mono">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result.html_structure, null, 2)}</pre>
            </div>
          </div>

          {/* CSS Recommendations */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <CheckCircle size={16} className="mr-2" />
              CSS Recommendations
            </h4>
            <div className="text-sm text-text bg-background/50 p-3 rounded-md">
              <ul className="space-y-2">
                {result.css_recommendations?.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateDesigner; 