import React, { useState } from 'react';
import api from '../services/api';
import { Lightbulb, Copy, Check } from 'lucide-react';

const IdeaCard = ({ idea, onCopy }) => {
    return (
        <div className="bg-primary border border-border rounded-xl p-3 sm:p-4 space-y-3 transform hover:scale-[1.02] transition-transform duration-300 min-w-0">
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-accent text-sm sm:text-base">{idea.title}</h4>
                <button onClick={() => onCopy(idea.content)} className="text-text-secondary hover:text-accent transition-colors">
                    <Copy size={16} />
                </button>
            </div>
            <div>
                <p className="text-xs sm:text-sm font-semibold text-text-secondary">Subject:</p>
                <p className="text-xs sm:text-sm text-text bg-background/50 p-2 rounded-md">{idea.subject_line}</p>
            </div>
            <div>
                <p className="text-xs sm:text-sm font-semibold text-text-secondary">Preview:</p>
                <p className="text-xs sm:text-sm text-text bg-background/50 p-2 rounded-md">{idea.preview_text}</p>
            </div>
        </div>
    );
};

const EmailIdeasGenerator = () => {
    const [formData, setFormData] = useState({
        campaign_type: 'newsletter',
        audience: 'general',
        goals: ''
    });
    const [loading, setLoading] = useState(false);
    const [ideas, setIdeas] = useState(null);
    const [error, setError] = useState(null);

    const campaignTypes = [
        { value: 'newsletter', label: 'Newsletter' },
        { value: 'promotional', label: 'Promotional' },
        { value: 'welcome', label: 'Welcome' },
        { value: 'product_launch', label: 'Product Launch' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setIdeas(null);
        try {
            const response = await api.post('/ai/generate-ideas', formData);
            setIdeas(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Toast notification can be added here
    };

    return (
        <div className="px-2 sm:px-4 md:px-8 max-w-3xl mx-auto w-full">
            <header className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-text mb-2">Email Idea Generator</h2>
                <p className="text-text-secondary text-sm sm:text-base">
                    Spark your creativity with AI-generated campaign ideas.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs sm:text-sm font-semibold text-text-secondary mb-2">Campaign Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {campaignTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, campaign_type: type.value }))}
                                className={`p-2 sm:p-3 border rounded-lg text-center transition-all duration-200 text-xs sm:text-sm ${
                                    formData.campaign_type === type.value
                                        ? 'border-accent bg-accent/10 text-accent font-semibold scale-105'
                                        : 'border-border bg-primary hover:bg-border'
                                }`}
                            >
                                <span>{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="goals" className="block text-xs sm:text-sm font-semibold text-text-secondary mb-2">Campaign Goals</label>
                    <textarea
                        id="goals"
                        name="goals"
                        value={formData.goals}
                        onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                        rows="3"
                        className="w-full bg-background border border-border rounded-lg p-2 sm:p-3 focus:ring-2 focus:ring-accent text-xs sm:text-sm"
                        placeholder="e.g., Increase engagement for our new feature"
                        required
                    />
                </div>
                
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={loading || !formData.goals}
                        className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors text-xs sm:text-base"
                    >
                        <Lightbulb size={20} className="mr-2" />
                        {loading ? 'Generating Ideas...' : 'Generate Ideas'}
                    </button>
                </div>
            </form>

            {error && <div className="mt-6 text-xs sm:text-sm text-danger bg-danger/10 p-3 rounded-lg">{error}</div>}

            {ideas && (
                <div className="mt-10 pt-8 border-t border-border">
                    <h3 className="text-lg sm:text-xl font-bold text-text mb-4">Generated Ideas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ideas.ideas.map((idea, index) => (
                            <IdeaCard key={index} idea={idea} onCopy={copyToClipboard} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailIdeasGenerator; 