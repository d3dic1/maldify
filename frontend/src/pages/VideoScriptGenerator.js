import React, { useState } from 'react';
import api from '../services/api';
import { 
  Video, 
  Copy, 
  Download, 
  Eye,
  Play,
  Target,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Smartphone,
  Monitor,
  Youtube
} from 'lucide-react';

const VideoScriptGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    video_type: 'product_demo',
    target_audience: 'general',
    key_message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/generate-video-script', formData);
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

  const videoTypes = [
    'product_demo',
    'explainer',
    'testimonial',
    'how_to',
    'brand_story',
    'promotional',
    'educational',
    'social_media'
  ];

  const audiences = [
    'general',
    'business',
    'marketing',
    'sales',
    'executives',
    'customers',
    'partners',
    'investors'
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <Video size={40} className="text-accent" />
        <div>
          <h1 className="text-3xl font-bold text-text">Video Script Generator</h1>
          <p className="text-text-secondary mt-1">AI-powered video script creation for marketing campaigns and social media content</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-primary border border-border rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Video Type
              </label>
              <select
                value={formData.video_type}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  video_type: e.target.value
                }))}
                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
              >
                {videoTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                Duration
              </label>
              <div className="text-sm text-text-secondary bg-background/50 p-3 rounded-md">
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" />
                  <span>Auto-generated based on content</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Key Message
            </label>
            <textarea
              value={formData.key_message}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                key_message: e.target.value
              }))}
              className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text h-32 resize-none"
              placeholder="Describe the main message you want to convey in your video..."
              required
            />
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
                  Generating Script...
                </>
              ) : (
                <>
                  <Video size={16} className="mr-2" />
                  Generate Script
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
          <h3 className="text-xl font-semibold text-text">Generated Video Script</h3>
          
          {/* Script Overview */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <Eye size={16} className="mr-2" />
              Script Overview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-text-secondary mb-2">Basic Information</h5>
                <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                  <p><strong>Title:</strong> {result.video_script?.title}</p>
                  <p><strong>Duration:</strong> {result.video_script?.duration}</p>
                  <p><strong>Hook:</strong> {result.video_script?.hook}</p>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-text-secondary mb-2">Call to Action</h5>
                <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                  <p className="font-medium text-accent">{result.video_script?.call_to_action}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scenes */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <Play size={16} className="mr-2" />
              Video Scenes
            </h4>
            <div className="space-y-4">
              {result.video_script?.scenes?.map((scene, index) => (
                <div key={index} className="text-sm text-text bg-background/50 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                        {scene.scene_number}
                      </div>
                      <span className="font-medium">Scene {scene.scene_number}</span>
                    </div>
                    <div className="flex items-center text-text-secondary">
                      <Clock size={14} className="mr-1" />
                      <span>{scene.duration}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h6 className="font-medium text-text-secondary mb-1">Visual</h6>
                      <p>{scene.visual}</p>
                    </div>
                    <div>
                      <h6 className="font-medium text-text-secondary mb-1">Script</h6>
                      <p>{scene.script}</p>
                    </div>
                    <div>
                      <h6 className="font-medium text-text-secondary mb-1">Audio</h6>
                      <p>{scene.audio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Production Notes */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <Settings size={16} className="mr-2" />
              Production Notes
            </h4>
            <div className="text-sm text-text bg-background/50 p-3 rounded-md">
              <ul className="space-y-2">
                {result.production_notes?.map((note, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-accent mr-2">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Platform Optimizations */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <h4 className="font-semibold text-accent mb-4 flex items-center">
              <Monitor size={16} className="mr-2" />
              Platform Optimizations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.platform_optimizations && Object.entries(result.platform_optimizations).map(([platform, specs]) => (
                <div key={platform} className="text-sm text-text bg-background/50 p-3 rounded-md">
                  <div className="flex items-center mb-2">
                    {platform === 'instagram' ? (
                      <Smartphone size={16} className="mr-2 text-pink-500" />
                    ) : platform === 'facebook' ? (
                      <Monitor size={16} className="mr-2 text-blue-500" />
                    ) : (
                      <Youtube size={16} className="mr-2 text-red-500" />
                    )}
                    <span className="font-medium capitalize">{platform}</span>
                  </div>
                  <p>{specs}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-primary border border-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-accent flex items-center">
                <Download size={16} className="mr-2" />
                Export Options
              </h4>
              <button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                className="text-text-secondary hover:text-accent transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="text-sm text-text-secondary">
              <p>Copy the complete script data or use the individual sections above for your video production workflow.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoScriptGenerator; 