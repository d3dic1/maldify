import React, { useState } from 'react';
import { FileText, Download, Upload, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const AIBlogCreator = () => {
  const [formData, setFormData] = useState({
    topic: '',
    target_audience: '',
    blog_type: 'informational',
    tone: 'professional',
    length: 'medium',
    include_images: false,
    seo_focus: 'general',
    call_to_action: '',
    additional_requirements: ''
  });

  const [shopifyCredentials, setShopifyCredentials] = useState({
    shop_domain: '',
    access_token: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [blogPost, setBlogPost] = useState(null);
  const [publishResult, setPublishResult] = useState(null);
  const [error, setError] = useState(null);
  const [showShopifyForm, setShowShopifyForm] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleShopifyChange = (e) => {
    const { name, value } = e.target;
    setShopifyCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createBlogPost = async () => {
    setIsGenerating(true);
    setError(null);
    setBlogPost(null);

    try {
      const response = await api.post('/ai/create-blog-post', formData);
      setBlogPost(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create blog post');
    } finally {
      setIsGenerating(false);
    }
  };

  const publishToShopify = async () => {
    if (!blogPost) return;

    setIsPublishing(true);
    setError(null);

    try {
      const response = await api.post('/ai/publish-to-shopify', {
        blog_post: blogPost,
        shopify_credentials: shopifyCredentials
      });
      setPublishResult(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to publish to Shopify');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadFiles = async () => {
    if (!blogPost) return;

    setIsDownloading(true);
    setError(null);

    try {
      const response = await api.post('/ai/download-blog-files', {
        blog_post: blogPost
      });

      // Create and download HTML file
      const htmlBlob = new Blob([response.data.files.html_content], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      const htmlLink = document.createElement('a');
      htmlLink.href = htmlUrl;
      htmlLink.download = `${response.data.files.filename}.html`;
      htmlLink.click();

      // Create and download JSON file
      const jsonBlob = new Blob([response.data.files.metadata_json], { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `${response.data.files.filename}-metadata.json`;
      jsonLink.click();

      // Clean up URLs
      URL.revokeObjectURL(htmlUrl);
      URL.revokeObjectURL(jsonUrl);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to download files');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <FileText size={40} className="text-accent" />
        <div>
          <h1 className="text-3xl font-bold text-text">AI Blog Creator</h1>
          <p className="text-text-secondary mt-1">Generate and publish blog posts automatically to your Shopify store</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="text-red-500" size={20} />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blog Creation Form */}
        <div className="bg-primary border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-accent">Blog Post Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Blog Topic *</label>
              <textarea
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                placeholder="Describe what you want the blog post to be about..."
                className="w-full p-3 border border-border rounded-lg bg-background text-text"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Target Audience *</label>
              <input
                type="text"
                name="target_audience"
                value={formData.target_audience}
                onChange={handleInputChange}
                placeholder="e.g., Small business owners, Tech professionals, Fitness enthusiasts"
                className="w-full p-3 border border-border rounded-lg bg-background text-text"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Blog Type</label>
                <select
                  name="blog_type"
                  value={formData.blog_type}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-lg bg-background text-text"
                >
                  <option value="informational">Informational</option>
                  <option value="how-to">How-to Guide</option>
                  <option value="case-study">Case Study</option>
                  <option value="product-review">Product Review</option>
                  <option value="industry-news">Industry News</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Tone</label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-lg bg-background text-text"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Length</label>
                <select
                  name="length"
                  value={formData.length}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-lg bg-background text-text"
                >
                  <option value="short">Short (500-800 words)</option>
                  <option value="medium">Medium (800-1200 words)</option>
                  <option value="long">Long (1200-2000 words)</option>
                  <option value="comprehensive">Comprehensive (2000+ words)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">SEO Focus</label>
                <select
                  name="seo_focus"
                  value={formData.seo_focus}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-border rounded-lg bg-background text-text"
                >
                  <option value="general">General SEO</option>
                  <option value="keyword-focused">Keyword Focused</option>
                  <option value="local-seo">Local SEO</option>
                  <option value="ecommerce">E-commerce</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="include_images"
                checked={formData.include_images}
                onChange={handleInputChange}
                className="rounded border-border"
              />
              <label className="text-sm text-text">Include image descriptions for AI generation</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Call to Action</label>
              <input
                type="text"
                name="call_to_action"
                value={formData.call_to_action}
                onChange={handleInputChange}
                placeholder="e.g., Subscribe to our newsletter, Download the guide, Contact us"
                className="w-full p-3 border border-border rounded-lg bg-background text-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Additional Requirements</label>
              <textarea
                name="additional_requirements"
                value={formData.additional_requirements}
                onChange={handleInputChange}
                placeholder="Any specific requirements, keywords, or instructions..."
                className="w-full p-3 border border-border rounded-lg bg-background text-text"
                rows={2}
              />
            </div>

            <button
              onClick={createBlogPost}
              disabled={isGenerating || !formData.topic || !formData.target_audience}
              className="w-full bg-accent text-white py-3 px-6 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Blog Post...</span>
                </>
              ) : (
                <>
                  <FileText size={20} />
                  <span>Create Blog Post</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results and Publishing */}
        <div className="space-y-6">
          {blogPost && (
            <>
              {/* Blog Post Preview */}
              <div className="bg-primary border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-accent">Generated Blog Post</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-text mb-2">Title</h3>
                    <p className="text-text-secondary">{blogPost.blog_post?.title}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-text mb-2">Meta Description</h3>
                    <p className="text-text-secondary text-sm">{blogPost.blog_post?.meta_description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-text mb-2">Category</h3>
                      <p className="text-text-secondary">{blogPost.blog_post?.category}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-text mb-2">Read Time</h3>
                      <p className="text-text-secondary">{blogPost.blog_post?.estimated_read_time}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-text mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {blogPost.blog_post?.tags?.map((tag, index) => (
                        <span key={index} className="bg-accent/10 text-accent px-2 py-1 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-text mb-2">Content Preview</h3>
                    <div className="bg-background p-4 rounded-lg max-h-40 overflow-y-auto">
                      <div 
                        className="text-text-secondary text-sm"
                        dangerouslySetInnerHTML={{ 
                          __html: blogPost.blog_post?.content?.substring(0, 300) + '...' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Publishing Options */}
              <div className="bg-primary border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-accent">Publishing Options</h2>
                
                <div className="space-y-4">
                  {/* Shopify Publishing */}
                  <div>
                    <button
                      onClick={() => setShowShopifyForm(!showShopifyForm)}
                      className="flex items-center space-x-2 text-accent hover:text-accent/80 transition-colors"
                    >
                      <Settings size={20} />
                      <span>Configure Shopify Integration</span>
                    </button>
                    
                    {showShopifyForm && (
                      <div className="mt-4 space-y-4 p-4 bg-background rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">Shop Domain</label>
                          <input
                            type="text"
                            name="shop_domain"
                            value={shopifyCredentials.shop_domain}
                            onChange={handleShopifyChange}
                            placeholder="your-store.myshopify.com"
                            className="w-full p-3 border border-border rounded-lg bg-primary text-text"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text mb-2">Access Token</label>
                          <input
                            type="password"
                            name="access_token"
                            value={shopifyCredentials.access_token}
                            onChange={handleShopifyChange}
                            placeholder="shpat_..."
                            className="w-full p-3 border border-border rounded-lg bg-primary text-text"
                          />
                        </div>
                        <button
                          onClick={publishToShopify}
                          disabled={isPublishing || !shopifyCredentials.shop_domain || !shopifyCredentials.access_token}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          {isPublishing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Publishing...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={16} />
                              <span>Publish to Shopify</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Download Files */}
                  <div>
                    <button
                      onClick={handleDownloadFiles}
                      disabled={isDownloading}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isDownloading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Generating Files...</span>
                        </>
                      ) : (
                        <>
                          <Download size={20} />
                          <span>Download HTML & JSON Files</span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-text-secondary mt-2">
                      Download files for manual publishing to any platform
                    </p>
                  </div>
                </div>
              </div>

              {/* Publish Result */}
              {publishResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <div>
                      <h3 className="font-medium text-green-800">Published Successfully!</h3>
                      <p className="text-green-700 text-sm">{publishResult.message}</p>
                      {publishResult.published_url && (
                        <a 
                          href={publishResult.published_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-sm underline"
                        >
                          View Published Post
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIBlogCreator; 