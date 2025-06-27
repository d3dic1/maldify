import React, { useState } from 'react';
import api from '../services/api';
import { 
  BarChart3, 
  Copy, 
  Download, 
  Eye,
  Palette,
  Layout,
  Target,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  Type,
  Settings
} from 'lucide-react';

const InfographicCreator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    data: {
      title: '',
      metrics: [
        { label: '', value: '', unit: '' },
        { label: '', value: '', unit: '' },
        { label: '', value: '', unit: '' }
      ],
      chart_data: [],
      key_insights: []
    },
    theme: 'professional',
    target_audience: 'general'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/create-infographic', formData);
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

  const addMetric = () => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        metrics: [...prev.data.metrics, { label: '', value: '', unit: '' }]
      }
    }));
  };

  const removeMetric = (index) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        metrics: prev.data.metrics.filter((_, i) => i !== index)
      }
    }));
  };

  const updateMetric = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        metrics: prev.data.metrics.map((metric, i) => 
          i === index ? { ...metric, [field]: value } : metric
        )
      }
    }));
  };

  const addKeyInsight = () => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        key_insights: [...prev.data.key_insights, '']
      }
    }));
  };

  const removeKeyInsight = (index) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        key_insights: prev.data.key_insights.filter((_, i) => i !== index)
      }
    }));
  };

  const updateKeyInsight = (index, value) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        key_insights: prev.data.key_insights.map((insight, i) => 
          i === index ? value : insight
        )
      }
    }));
  };

  const themes = [
    'professional',
    'creative',
    'minimal',
    'bold',
    'elegant',
    'tech',
    'playful'
  ];

  const audiences = [
    'general',
    'business',
    'marketing',
    'sales',
    'executives',
    'customers',
    'partners'
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <BarChart3 size={40} className="text-accent" />
        <div>
          <h1 className="text-3xl font-bold text-text">Infographic Creator</h1>
          <p className="text-text-secondary mt-1">AI-powered infographic design with data visualization and engaging visuals</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-primary border border-border rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Infographic Title
              </label>
              <input
                type="text"
                value={formData.data.title}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  data: { ...prev.data, title: e.target.value }
                }))}
                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                placeholder="Enter infographic title..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Theme
              </label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  theme: e.target.value
                }))}
                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
              >
                {themes.map(theme => (
                  <option key={theme} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Target Audience
              </label>
              <select
                value={formData.target_audience}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  target_audience: e.target.value
                }))}
                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
              >
                {audiences.map(audience => (
                  <option key={audience} value={audience}>
                    {audience.charAt(0).toUpperCase() + audience.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Metrics */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-text-secondary">
                Key Metrics
              </label>
              <button
                type="button"
                onClick={addMetric}
                className="text-accent hover:text-accent/80 text-sm font-medium"
              >
                + Add Metric
              </button>
            </div>
            <div className="space-y-3">
              {formData.data.metrics.map((metric, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={metric.label}
                    onChange={(e) => updateMetric(index, 'label', e.target.value)}
                    className="bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                    placeholder="Metric label..."
                  />
                  <input
                    type="text"
                    value={metric.value}
                    onChange={(e) => updateMetric(index, 'value', e.target.value)}
                    className="bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                    placeholder="Value..."
                  />
                  <input
                    type="text"
                    value={metric.unit}
                    onChange={(e) => updateMetric(index, 'unit', e.target.value)}
                    className="bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                    placeholder="Unit (%)"
                  />
                  <button
                    type="button"
                    onClick={() => removeMetric(index)}
                    className="text-red-500 hover:text-red-600 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-text-secondary">
                Key Insights
              </label>
              <button
                type="button"
                onClick={addKeyInsight}
                className="text-accent hover:text-accent/80 text-sm font-medium"
              >
                + Add Insight
              </button>
            </div>
            <div className="space-y-3">
              {formData.data.key_insights.map((insight, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={insight}
                    onChange={(e) => updateKeyInsight(index, e.target.value)}
                    className="flex-1 bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                    placeholder="Enter key insight..."
                  />
                  <button
                    type="button"
                    onClick={() => removeKeyInsight(index)}
                    className="text-red-500 hover:text-red-600 text-sm font-medium px-3"
                  >
                    Remove
                  </button>
                </div>
              ))}
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
                  Creating Infographic...
                </>
              ) : (
                <>
                  <BarChart3 size={16} className="mr-2" />
                  Create Infographic
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
          <h3 className="text-xl font-semibold text-text">Generated Infographic Design</h3>
          
          {/* Design Overview */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <Eye size={16} className="mr-2" />
              Design Overview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-text-secondary mb-2">Layout & Structure</h5>
                <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                  <p><strong>Layout Type:</strong> {result.infographic_design?.layout}</p>
                  <p><strong>Visual Elements:</strong> {result.infographic_design?.visual_elements?.length || 0} elements</p>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-text-secondary mb-2">Color Palette</h5>
                <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: result.infographic_design?.color_palette?.primary }}></div>
                    <span>Primary: {result.infographic_design?.color_palette?.primary}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: result.infographic_design?.color_palette?.secondary }}></div>
                    <span>Secondary: {result.infographic_design?.color_palette?.secondary}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: result.infographic_design?.color_palette?.accent }}></div>
                    <span>Accent: {result.infographic_design?.color_palette?.accent}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Elements */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <ImageIcon size={16} className="mr-2" />
              Visual Elements
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.infographic_design?.visual_elements?.map((element, index) => (
                <div key={index} className="text-sm text-text bg-background/50 p-3 rounded-md">
                  <div className="flex items-center mb-2">
                    {element.type === 'chart' ? <BarChart3 size={16} className="mr-2" /> : <ImageIcon size={16} className="mr-2" />}
                    <span className="font-medium">{element.type}</span>
                  </div>
                  <p><strong>Data:</strong> {element.data}</p>
                  <p><strong>Style:</strong> {element.style}</p>
                  {element.colors && (
                    <div className="flex items-center space-x-1 mt-2">
                      <span className="text-xs">Colors:</span>
                      {element.colors.map((color, idx) => (
                        <div key={idx} className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content Structure */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <Type size={16} className="mr-2" />
              Content Structure
            </h4>
            <div className="space-y-3">
              {result.content_structure?.map((section, index) => (
                <div key={index} className="text-sm text-text bg-background/50 p-3 rounded-md">
                  <div className="flex items-center mb-2">
                    <Layout size={16} className="mr-2" />
                    <span className="font-medium">{section.section}</span>
                  </div>
                  <p><strong>Content:</strong> {section.content}</p>
                  <p><strong>Style:</strong> {section.style}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Design Recommendations */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <CheckCircle size={16} className="mr-2" />
              Design Recommendations
            </h4>
            <div className="text-sm text-text bg-background/50 p-3 rounded-md">
              <ul className="space-y-2">
                {result.design_recommendations?.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Export Specifications */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <Settings size={16} className="mr-2" />
              Export Specifications
            </h4>
            <div className="text-sm text-text bg-background/50 p-3 rounded-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <strong>Format:</strong> {result.export_specifications?.format}
                </div>
                <div>
                  <strong>Dimensions:</strong> {result.export_specifications?.dimensions}
                </div>
                <div>
                  <strong>Resolution:</strong> {result.export_specifications?.resolution}
                </div>
                <div>
                  <strong>Color Mode:</strong> {result.export_specifications?.color_mode}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfographicCreator; 