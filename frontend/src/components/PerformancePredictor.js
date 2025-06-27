import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Zap, Activity, BarChart, CheckCircle, HelpCircle } from 'lucide-react';

const FormField = ({ label, name, value, onChange, placeholder, required, component = 'input', rows }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-semibold text-text-secondary mb-2">
            {label} {required && '*'}
        </label>
        {component === 'textarea' ? (
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                rows={rows}
                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent focus:border-accent transition"
                placeholder={placeholder}
                required={required}
            />
        ) : (
            <input
                type="text"
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent focus:border-accent transition"
                placeholder={placeholder}
                required={required}
            />
        )}
    </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-semibold text-text-secondary mb-2">
            {label}
        </label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent focus:border-accent transition appearance-none"
        >
            {options.map(option => (
                <option key={option.value} value={option.value} className="bg-primary text-text">
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

const PerformancePredictor = ({ emailData, onEmailDataUpdate }) => {
    const [formData, setFormData] = useState({
        subject_line: emailData.subject_line || '',
        preview_text: emailData.preview_text || '',
        email_content: emailData.email_content || '',
        target_audience: emailData.target_audience || 'general',
        campaign_type: emailData.campaign_type || 'newsletter',
        use_historical_data: false,
        campaign_ids: []
    });
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [availableCampaigns, setAvailableCampaigns] = useState([]);

    const audienceOptions = [
        { value: 'general', label: 'General Audience' },
        { value: 'new_subscribers', label: 'New Subscribers' },
    ];

    const campaignTypes = [
        { value: 'newsletter', label: 'Newsletter' },
        { value: 'promotional', label: 'Promotional' },
    ];

    useEffect(() => {
        const savedCampaignIds = localStorage.getItem('campaignIds');
        if (savedCampaignIds) {
            const campaignIds = savedCampaignIds.split(',').map(id => id.trim()).filter(Boolean);
            setAvailableCampaigns(campaignIds);
            setFormData(prev => ({ ...prev, campaign_ids: campaignIds }));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        const newData = { ...formData, [name]: newValue };
        setFormData(newData);
        if(onEmailDataUpdate) onEmailDataUpdate(newData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResults(null);
        try {
            const response = await api.post('/ai/predict-performance', formData);
            setResults(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-text mb-2">Performance Predictor</h2>
                <p className="text-text-secondary">
                    Forecast your email's potential success.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormField
                    label="Subject Line"
                    name="subject_line"
                    value={formData.subject_line}
                    onChange={handleInputChange}
                    placeholder="Enter your subject line..."
                    required
                />
                <FormField
                    label="Preview Text"
                    name="preview_text"
                    value={formData.preview_text}
                    onChange={handleInputChange}
                    placeholder="Enter preview text..."
                />
                <FormField
                    label="Email Content"
                    name="email_content"
                    value={formData.email_content}
                    onChange={handleInputChange}
                    placeholder="Enter your email content..."
                    required
                    rows="6"
                />
                <SelectField
                    label="Target Audience"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    options={audienceOptions}
                />
                <SelectField
                    label="Campaign Type"
                    name="campaign_type"
                    value={formData.campaign_type}
                    onChange={handleInputChange}
                    options={campaignTypes}
                />
                <div className="bg-background/50 p-4 rounded-lg border border-border">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="use_historical_data"
                            name="use_historical_data"
                            checked={formData.use_historical_data}
                            onChange={handleInputChange}
                            className="h-4 w-4 rounded bg-primary border-border text-accent focus:ring-accent"
                        />
                        <label htmlFor="use_historical_data" className="ml-3 text-sm font-medium text-text">
                            Use Historical Data for Prediction
                        </label>
                    </div>
                    {formData.use_historical_data && (
                        <p className="text-xs text-text-secondary mt-2 pl-7">
                            Using data from {availableCampaigns.length} available campaign(s).
                        </p>
                    )}
                </div>
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading || !formData.subject_line || !formData.email_content}
                        className="px-6 py-3 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Predicting...' : 'Predict Performance'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="mt-6 text-sm text-danger bg-danger/10 p-3 rounded-lg border border-danger/20">
                    {error}
                </div>
            )}
            
            {results && (
                <div className="mt-10 pt-8 border-t border-border space-y-6">
                    <h3 className="text-xl font-bold text-text">Prediction Results</h3>
                    <div className="mb-6">
                        <div className="flex items-center mb-2">
                            <span className="text-2xl mr-2">
                                {results.predictions.confidence_level === 'high' ? '🎯' : 
                                 results.predictions.confidence_level === 'medium' ? '⚠️' : '❓'}
                            </span>
                            <span className={`font-medium ${
                                results.predictions.confidence_level === 'high' ? 'text-green-600' :
                                results.predictions.confidence_level === 'medium' ? 'text-yellow-600' :
                                'text-red-600'
                            }`}>
                                Confidence Level: {results.predictions.confidence_level.charAt(0).toUpperCase() + results.predictions.confidence_level.slice(1)}
                            </span>
                        </div>
                        <p className="text-sm text-text-secondary">
                            Based on {formData.use_historical_data ? 'your historical data and ' : ''}industry benchmarks
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Predicted Open Rate</h4>
                            <div className="text-2xl font-bold text-blue-600">
                                {results.predictions.predicted_open_rate}
                            </div>
                            <p className="text-sm text-text-secondary">Expected open rate</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Predicted Click Rate</h4>
                            <div className="text-2xl font-bold text-green-600">
                                {results.predictions.predicted_click_rate}
                            </div>
                            <p className="text-sm text-text-secondary">Expected click-through rate</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Predicted Conversion Rate</h4>
                            <div className="text-2xl font-bold text-purple-600">
                                {results.predictions.predicted_conversion_rate}
                            </div>
                            <p className="text-sm text-text-secondary">Expected conversion rate</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {results.predictions.risk_factors && results.predictions.risk_factors.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">⚠️ Risk Factors</h4>
                                <ul className="space-y-2">
                                    {results.predictions.risk_factors.map((risk, index) => (
                                        <li key={index} className="flex items-start text-sm text-red-700">
                                            <span className="mr-2">•</span>
                                            {risk}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {results.predictions.opportunities && results.predictions.opportunities.length > 0 && (
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">💡 Opportunities</h4>
                                <ul className="space-y-2">
                                    {results.predictions.opportunities.map((opportunity, index) => (
                                        <li key={index} className="flex items-start text-sm text-green-700">
                                            <span className="mr-2">✓</span>
                                            {opportunity}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <h4 className="font-medium text-yellow-800 mb-2">💡 Recommendations</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• These predictions are based on AI analysis and industry benchmarks</li>
                            <li>• Actual performance may vary based on your specific audience and timing</li>
                            <li>• Consider A/B testing to validate predictions</li>
                            <li>• Use historical data for more accurate predictions</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformancePredictor; 