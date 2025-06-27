import React, { useState } from 'react';
import api from '../services/api';
import { Bot, Copy, ClipboardEdit, RefreshCw, MessageSquare, FileText, Share2 } from 'lucide-react';

const GeneratedCopyCard = ({ title, content, onCopy }) => (
    <div className="bg-primary border border-border rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-accent">{title}</h4>
            <button onClick={() => onCopy(content)} className="text-text-secondary hover:text-accent transition-colors">
                <Copy size={16} />
            </button>
        </div>
        <p className="text-sm text-text bg-background/50 p-3 rounded-md whitespace-pre-wrap">{content}</p>
    </div>
);

const BlogCopyCard = ({ title, content, onCopy }) => (
    <div className="bg-primary border border-border rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-accent">{title}</h4>
            <button onClick={() => onCopy(content)} className="text-text-secondary hover:text-accent transition-colors">
                <Copy size={16} />
            </button>
        </div>
        <div className="text-sm text-text bg-background/50 p-3 rounded-md">
            {typeof content === 'string' ? (
                <p className="whitespace-pre-wrap">{content}</p>
            ) : (
                <div className="space-y-3">
                    {content.map((item, index) => (
                        <div key={index} className="border-l-2 border-accent pl-3">
                            <strong className="text-accent">{item}</strong>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const SocialMediaCard = ({ platform, content, onCopy }) => (
    <div className="bg-primary border border-border rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-accent capitalize">{platform}</h4>
            <div className="flex space-x-2">
                <button onClick={() => onCopy(content.post || content.caption || content.tweet)} className="text-text-secondary hover:text-accent transition-colors">
                    <Copy size={16} />
                </button>
            </div>
        </div>
        <div className="space-y-3">
            <div className="text-sm text-text bg-background/50 p-3 rounded-md">
                <p className="whitespace-pre-wrap">{content.post || content.caption || content.tweet}</p>
            </div>
            {content.hashtags && content.hashtags.length > 0 && (
                <div className="text-sm text-text bg-background/30 p-2 rounded-md">
                    <p className="text-accent font-medium mb-1">Hashtags:</p>
                    <p className="text-text-secondary">{content.hashtags.join(' ')}</p>
                </div>
            )}
            {content.image_description && (
                <div className="text-sm text-text bg-background/30 p-2 rounded-md">
                    <p className="text-accent font-medium mb-1">Image Description:</p>
                    <p className="text-text-secondary text-xs">{content.image_description}</p>
                </div>
            )}
        </div>
    </div>
);

const EmailCopyGenerator = () => {
    const [activeTab, setActiveTab] = useState('email');
    const [formData, setFormData] = useState({
        campaign_purpose: '',
        product_service: '',
        target_audience: 'general',
        campaign_type: 'newsletter',
        tone: 'professional',
        call_to_action: '',
        custom_prompt: ''
    });
    const [loading, setLoading] = useState(false);
    const [generatedCopy, setGeneratedCopy] = useState(null);
    const [generatedBlog, setGeneratedBlog] = useState(null);
    const [generatedSocial, setGeneratedSocial] = useState(null);
    const [generatedAll, setGeneratedAll] = useState(null);
    const [error, setError] = useState(null);
    const [showCustomPrompt, setShowCustomPrompt] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setGeneratedCopy(null);
        setGeneratedBlog(null);
        setGeneratedSocial(null);
        setGeneratedAll(null);
        
        try {
            let response;
            switch (activeTab) {
                case 'email':
                    response = await api.post('/ai/generate-copy', formData);
                    setGeneratedCopy(response.data);
                    break;
                case 'blog':
                    response = await api.post('/ai/generate-blog-copy', formData);
                    setGeneratedBlog(response.data);
                    break;
                case 'social':
                    response = await api.post('/ai/generate-social-media-post', formData);
                    setGeneratedSocial(response.data);
                    break;
                case 'all':
                    // Generate all three formats simultaneously
                    const [emailResponse, blogResponse, socialResponse] = await Promise.all([
                        api.post('/ai/generate-copy', formData),
                        api.post('/ai/generate-blog-copy', formData),
                        api.post('/ai/generate-social-media-post', formData)
                    ]);
                    
                    setGeneratedAll({
                        email: emailResponse.data,
                        blog: blogResponse.data,
                        social: socialResponse.data
                    });
                    break;
                default:
                    break;
            }
        } catch (err) {
            setError(err.response?.data?.error || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateWithPrompt = async () => {
        if (!formData.custom_prompt.trim()) return;
        
        setLoading(true);
        setError(null);
        try {
            let response;
            switch (activeTab) {
                case 'email':
                    response = await api.post('/ai/generate-copy', {
                        ...formData,
                        custom_prompt: formData.custom_prompt,
                        regenerate: true
                    });
                    setGeneratedCopy(response.data);
                    break;
                case 'blog':
                    response = await api.post('/ai/generate-blog-copy', {
                        ...formData,
                        custom_prompt: formData.custom_prompt,
                        regenerate: true
                    });
                    setGeneratedBlog(response.data);
                    break;
                case 'social':
                    response = await api.post('/ai/generate-social-media-post', {
                        ...formData,
                        custom_prompt: formData.custom_prompt,
                        regenerate: true
                    });
                    setGeneratedSocial(response.data);
                    break;
                case 'all':
                    // Regenerate all three formats with custom prompt
                    const [emailResponse, blogResponse, socialResponse] = await Promise.all([
                        api.post('/ai/generate-copy', {
                            ...formData,
                            custom_prompt: formData.custom_prompt,
                            regenerate: true
                        }),
                        api.post('/ai/generate-blog-copy', {
                            ...formData,
                            custom_prompt: formData.custom_prompt,
                            regenerate: true
                        }),
                        api.post('/ai/generate-social-media-post', {
                            ...formData,
                            custom_prompt: formData.custom_prompt,
                            regenerate: true
                        })
                    ]);
                    
                    setGeneratedAll({
                        email: emailResponse.data,
                        blog: blogResponse.data,
                        social: socialResponse.data
                    });
                    break;
                default:
                    break;
            }
            setShowCustomPrompt(false);
        } catch (err) {
            setError(err.response?.data?.error || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };
    
    const audienceOptions = [
        { value: 'general', label: 'General Audience' },
        { value: 'new_subscribers', label: 'New Subscribers' },
        { value: 'engaged_users', label: 'Engaged Users' },
        { value: 'inactive_users', label: 'Inactive Users' },
        { value: 'customers', label: 'Existing Customers' },
        { value: 'prospects', label: 'Prospects' },
        { value: 'vip_customers', label: 'VIP Customers' },
        { value: 'cart_abandoners', label: 'Cart Abandoners' }
    ];

    const campaignTypes = [
        { value: 'newsletter', label: 'Newsletter' },
        { value: 'promotional', label: 'Promotional' },
        { value: 'abandoned_cart', label: 'Abandoned Cart' },
        { value: 'welcome', label: 'Welcome Series' },
        { value: 're_engagement', label: 'Re-engagement' },
        { value: 'upsell', label: 'Upsell' },
        { value: 'cross_sell', label: 'Cross-sell' },
        { value: 'product_launch', label: 'Product Launch' },
        { value: 'event_invitation', label: 'Event Invitation' },
        { value: 'survey', label: 'Survey/Feedback' }
    ];

    const toneOptions = [
        { value: 'professional', label: 'Professional' },
        { value: 'friendly', label: 'Friendly' },
        { value: 'casual', label: 'Casual' },
        { value: 'urgent', label: 'Urgent' },
        { value: 'excited', label: 'Excited' },
        { value: 'empathetic', label: 'Empathetic' },
        { value: 'humorous', label: 'Humorous' },
        { value: 'authoritative', label: 'Authoritative' }
    ];

    const tabs = [
        { id: 'email', name: 'Email Copy', icon: Bot },
        { id: 'blog', name: 'Blog Copy', icon: FileText },
        { id: 'social', name: 'Social Media', icon: Share2 },
        { id: 'all', name: 'All Formats', icon: ClipboardEdit }
    ];

    const getButtonText = () => {
        switch (activeTab) {
            case 'email': return loading ? 'Generating Email...' : 'Generate Email Copy';
            case 'blog': return loading ? 'Generating Blog...' : 'Generate Blog Copy';
            case 'social': return loading ? 'Generating Social...' : 'Generate Social Media';
            case 'all': return loading ? 'Generating All Formats...' : 'Generate All Formats';
            default: return 'Generate Copy';
        }
    };

    const getGeneratedContent = () => {
        switch (activeTab) {
            case 'email': return generatedCopy;
            case 'blog': return generatedBlog;
            case 'social': return generatedSocial;
            case 'all': return generatedAll;
            default: return null;
        }
    };

    return (
        <div>
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-text mb-2">AI Content Generator</h2>
                <p className="text-text-secondary">
                    Let AI create compelling content for your next campaign. Choose a specific format or generate all formats at once for a complete content package.
                </p>
            </header>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-primary rounded-lg p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">
                            Campaign Purpose *
                        </label>
                        <textarea
                            name="campaign_purpose"
                            value={formData.campaign_purpose}
                            onChange={(e) => setFormData({...formData, campaign_purpose: e.target.value})}
                            rows="3"
                            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                            placeholder="What is the main purpose of this content? (e.g., Promote our new feature, re-engage inactive users)"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">
                            Product/Service
                        </label>
                        <textarea
                            name="product_service"
                            value={formData.product_service}
                            onChange={(e) => setFormData({...formData, product_service: e.target.value})}
                            rows="3"
                            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                            placeholder="Describe the product or service you're promoting"
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">
                            Target Audience
                        </label>
                        <select 
                            name="target_audience" 
                            value={formData.target_audience} 
                            onChange={(e) => setFormData({...formData, target_audience: e.target.value})} 
                            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text appearance-none"
                        >
                            {audienceOptions.map(o => (
                                <option key={o.value} value={o.value} className="bg-primary">
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">
                            Campaign Type
                        </label>
                        <select 
                            name="campaign_type" 
                            value={formData.campaign_type} 
                            onChange={(e) => setFormData({...formData, campaign_type: e.target.value})} 
                            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text appearance-none"
                        >
                            {campaignTypes.map(o => (
                                <option key={o.value} value={o.value} className="bg-primary">
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">
                            Tone
                        </label>
                        <select 
                            name="tone" 
                            value={formData.tone} 
                            onChange={(e) => setFormData({...formData, tone: e.target.value})} 
                            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text appearance-none"
                        >
                            {toneOptions.map(o => (
                                <option key={o.value} value={o.value} className="bg-primary">
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">
                            Call to Action
                        </label>
                        <input
                            type="text"
                            name="call_to_action"
                            value={formData.call_to_action}
                            onChange={(e) => setFormData({...formData, call_to_action: e.target.value})}
                            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                            placeholder="e.g., Shop Now, Learn More"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={loading || !formData.campaign_purpose}
                        className="flex items-center justify-center px-6 py-3 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                    >
                        <Bot size={20} className="mr-2" />
                        {getButtonText()}
                    </button>
                </div>
            </form>

            {error && <div className="mt-6 text-sm text-danger bg-danger/10 p-3 rounded-lg">{error}</div>}

            {getGeneratedContent() && (
                <div className="mt-10 pt-8 border-t border-border space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-text">Generated Content</h3>
                        <button
                            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                            className="flex items-center px-4 py-2 font-semibold rounded-lg text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
                        >
                            <MessageSquare size={16} className="mr-2" />
                            {showCustomPrompt ? 'Hide Custom Prompt' : 'Add Custom Prompt'}
                        </button>
                    </div>

                    {showCustomPrompt && (
                        <div className="bg-primary border border-border rounded-xl p-4">
                            <label className="block text-sm font-semibold text-text-secondary mb-2">
                                Custom Instructions for Regeneration
                            </label>
                            <textarea
                                value={formData.custom_prompt}
                                onChange={(e) => setFormData({...formData, custom_prompt: e.target.value})}
                                rows="3"
                                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text mb-3"
                                placeholder="e.g., Make it more urgent, add more personalization, focus on benefits instead of features..."
                            />
                            <button
                                onClick={handleRegenerateWithPrompt}
                                disabled={loading || !formData.custom_prompt.trim()}
                                className="flex items-center px-4 py-2 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                {loading ? 'Regenerating...' : 'Regenerate with Custom Prompt'}
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {activeTab === 'email' && generatedCopy && (
                            <>
                                <GeneratedCopyCard title="Subject Line" content={generatedCopy.subject_line} onCopy={copyToClipboard} />
                                <GeneratedCopyCard title="Preview Text" content={generatedCopy.preview_text} onCopy={copyToClipboard} />
                                <GeneratedCopyCard title="Email Body" content={generatedCopy.email_body} onCopy={copyToClipboard} />
                            </>
                        )}

                        {activeTab === 'blog' && generatedBlog && (
                            <>
                                <GeneratedCopyCard title="Blog Title" content={generatedBlog.title} onCopy={copyToClipboard} />
                                <GeneratedCopyCard title="Meta Description" content={generatedBlog.meta_description} onCopy={copyToClipboard} />
                                <GeneratedCopyCard title="Introduction" content={generatedBlog.introduction} onCopy={copyToClipboard} />
                                <GeneratedCopyCard title="Main Content" content={generatedBlog.main_content} onCopy={copyToClipboard} />
                                <GeneratedCopyCard title="Conclusion" content={generatedBlog.conclusion} onCopy={copyToClipboard} />
                                <BlogCopyCard title="Key Takeaways" content={generatedBlog.key_takeaways} onCopy={copyToClipboard} />
                                <BlogCopyCard title="Suggested Tags" content={generatedBlog.suggested_tags} onCopy={copyToClipboard} />
                                <GeneratedCopyCard title="Estimated Read Time" content={generatedBlog.estimated_read_time} onCopy={copyToClipboard} />
                            </>
                        )}

                        {activeTab === 'social' && generatedSocial && (
                            <>
                                {generatedSocial.platforms && Object.entries(generatedSocial.platforms).map(([platform, content]) => (
                                    <SocialMediaCard 
                                        key={platform} 
                                        platform={platform} 
                                        content={content} 
                                        onCopy={copyToClipboard} 
                                    />
                                ))}
                                {generatedSocial.image_prompt && (
                                    <GeneratedCopyCard title="Image Generation Prompt" content={generatedSocial.image_prompt} onCopy={copyToClipboard} />
                                )}
                                {generatedSocial.content_theme && (
                                    <GeneratedCopyCard title="Content Theme" content={generatedSocial.content_theme} onCopy={copyToClipboard} />
                                )}
                            </>
                        )}

                        {activeTab === 'all' && generatedAll && (
                            <>
                                {generatedAll.email && (
                                    <>
                                        <div className="border-b border-border pb-2 mb-4">
                                            <h4 className="text-lg font-bold text-accent flex items-center">
                                                <Bot size={20} className="mr-2" />
                                                Email Copy
                                            </h4>
                                        </div>
                                        <GeneratedCopyCard title="Subject Line" content={generatedAll.email.subject_line} onCopy={copyToClipboard} />
                                        <GeneratedCopyCard title="Preview Text" content={generatedAll.email.preview_text} onCopy={copyToClipboard} />
                                        <GeneratedCopyCard title="Email Body" content={generatedAll.email.email_body} onCopy={copyToClipboard} />
                                    </>
                                )}
                                
                                {generatedAll.blog && (
                                    <>
                                        <div className="border-b border-border pb-2 mb-4 mt-8">
                                            <h4 className="text-lg font-bold text-accent flex items-center">
                                                <FileText size={20} className="mr-2" />
                                                Blog Copy
                                            </h4>
                                        </div>
                                        <GeneratedCopyCard title="Blog Title" content={generatedAll.blog.title} onCopy={copyToClipboard} />
                                        <GeneratedCopyCard title="Meta Description" content={generatedAll.blog.meta_description} onCopy={copyToClipboard} />
                                        <GeneratedCopyCard title="Introduction" content={generatedAll.blog.introduction} onCopy={copyToClipboard} />
                                        <GeneratedCopyCard title="Main Content" content={generatedAll.blog.main_content} onCopy={copyToClipboard} />
                                        <GeneratedCopyCard title="Conclusion" content={generatedAll.blog.conclusion} onCopy={copyToClipboard} />
                                        <BlogCopyCard title="Key Takeaways" content={generatedAll.blog.key_takeaways} onCopy={copyToClipboard} />
                                        <BlogCopyCard title="Suggested Tags" content={generatedAll.blog.suggested_tags} onCopy={copyToClipboard} />
                                        <GeneratedCopyCard title="Estimated Read Time" content={generatedAll.blog.estimated_read_time} onCopy={copyToClipboard} />
                                    </>
                                )}
                                
                                {generatedAll.social && (
                                    <>
                                        <div className="border-b border-border pb-2 mb-4 mt-8">
                                            <h4 className="text-lg font-bold text-accent flex items-center">
                                                <Share2 size={20} className="mr-2" />
                                                Social Media Content
                                            </h4>
                                        </div>
                                        {generatedAll.social.platforms && Object.entries(generatedAll.social.platforms).map(([platform, content]) => (
                                            <SocialMediaCard 
                                                key={platform} 
                                                platform={platform} 
                                                content={content} 
                                                onCopy={copyToClipboard} 
                                            />
                                        ))}
                                        {generatedAll.social.image_prompt && (
                                            <GeneratedCopyCard title="Image Generation Prompt" content={generatedAll.social.image_prompt} onCopy={copyToClipboard} />
                                        )}
                                        {generatedAll.social.content_theme && (
                                            <GeneratedCopyCard title="Content Theme" content={generatedAll.social.content_theme} onCopy={copyToClipboard} />
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailCopyGenerator; 