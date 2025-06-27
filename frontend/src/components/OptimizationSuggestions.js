import React, { useState } from 'react';
import api from '../services/api';
import { Wand2, Lightbulb, Copy, Check, X } from 'lucide-react';

const SuggestionCard = ({ title, suggestions, onSelect, onCopy, type }) => {
    return (
        <div className="bg-background rounded-lg border border-border p-4">
            <h3 className="font-semibold text-text mb-3">{title}</h3>
            <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-primary/50 p-3 rounded-md flex justify-between items-center">
                        <p className="text-sm text-text-secondary">{suggestion}</p>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => onSelect(suggestion, type)} className="text-accent hover:text-accent-hover transition-colors">
                                <Check size={16} />
                            </button>
                            <button onClick={() => onCopy(suggestion)} className="text-text-secondary hover:text-text transition-colors">
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const OptimizationSuggestions = ({ analysisResults, emailData, onEmailDataUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState(null);
    const [error, setError] = useState(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);

    const handleGenerateSuggestions = async () => {
        if (!analysisResults) {
            setError('Please run an email analysis first to get optimization suggestions.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/ai/generate-suggestions', {
                analysis: analysisResults,
                email_data: emailData
            });
            setSuggestions(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const applySuggestion = () => {
        if (!selectedSuggestion) return;
        const { suggestion, type } = selectedSuggestion;
        const newEmailData = { ...emailData };

        if (type === 'subject_line') newEmailData.subject_line = suggestion;
        if (type === 'preview_text') newEmailData.preview_text = suggestion;
        
        onEmailDataUpdate(newEmailData);
        setSelectedSuggestion(null);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Maybe add a toast here in the future
    };

    if (!analysisResults) {
        return (
            <div className="text-center py-10">
                <Lightbulb size={40} className="mx-auto text-accent mb-4" />
                <h3 className="text-xl font-semibold text-text mb-2">
                    No Analysis Results
                </h3>
                <p className="text-text-secondary mb-4">
                    Run an email analysis to get personalized suggestions.
                </p>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-text mb-2">Optimization Suggestions</h2>
                <p className="text-text-secondary">
                    AI-powered suggestions to improve your email based on your analysis.
                </p>
            </header>

            <div className="mb-6">
                <button
                    onClick={handleGenerateSuggestions}
                    disabled={loading}
                    className="flex items-center justify-center w-full px-6 py-3 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                    <Wand2 size={20} className="mr-2" />
                    {loading ? 'Generating Suggestions...' : 'Generate Optimization Suggestions'}
                </button>
            </div>

            {error && <div className="mb-6 p-3 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20">{error}</div>}

            {suggestions && (
                <div className="space-y-6">
                    {suggestions.suggestions.subject_line_alternatives && (
                        <SuggestionCard 
                            title="Subject Line Alternatives"
                            suggestions={suggestions.suggestions.subject_line_alternatives}
                            onSelect={setSelectedSuggestion}
                            onCopy={copyToClipboard}
                            type="subject_line"
                        />
                    )}
                    {/* ... other suggestion cards ... */}
                </div>
            )}
            
            {selectedSuggestion && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-primary rounded-xl border border-border shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-text mb-4">
                            Apply Suggestion
                        </h3>
                        <p className="text-text-secondary mb-4 text-sm">
                            Replace your current {selectedSuggestion.type.replace(/_/g, ' ')} with:
                        </p>
                        <div className="bg-background p-3 rounded-md mb-6">
                            <p className="text-text">{selectedSuggestion.suggestion}</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={applySuggestion}
                                className="flex-1 px-4 py-2 rounded-lg bg-accent text-background font-semibold hover:bg-accent-hover transition-colors"
                            >
                                Apply
                            </button>
                            <button
                                onClick={() => setSelectedSuggestion(null)}
                                className="flex-1 px-4 py-2 rounded-lg bg-border text-text-secondary font-semibold hover:bg-border/80 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OptimizationSuggestions; 