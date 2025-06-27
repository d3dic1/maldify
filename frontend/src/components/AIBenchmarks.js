import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

const BenchmarkCard = ({ title, benchmark, icon: Icon }) => {
    const getTierColor = (tier) => {
        if (tier === 'excellent') return 'text-success';
        if (tier === 'good') return 'text-accent';
        return 'text-warning';
    };

    return (
        <div className="bg-primary border border-border rounded-xl p-4">
            <div className="flex items-center mb-3">
                <Icon size={20} className="text-accent mr-2" />
                <h4 className="font-semibold text-text">{title}</h4>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Excellent</span>
                    <span className={`font-medium ${getTierColor('excellent')}`}>{benchmark.excellent}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Good</span>
                    <span className={`font-medium ${getTierColor('good')}`}>{benchmark.good}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Average</span>
                    <span className={`font-medium ${getTierColor('average')}`}>{benchmark.average}</span>
                </div>
            </div>
        </div>
    );
};

// Fallback benchmark data
const fallbackBenchmarks = {
    benchmarks: {
        open_rate: {
            average: "21.5%",
            good: "25.0%",
            excellent: "30.0%"
        },
        click_rate: {
            average: "2.5%",
            good: "3.5%",
            excellent: "5.0%"
        },
        conversion_rate: {
            average: "1.2%",
            good: "2.0%",
            excellent: "3.5%"
        },
        best_practices: [
            "Keep subject lines under 50 characters",
            "Use clear call-to-actions",
            "Personalize content when possible",
            "Test different send times",
            "Segment your audience"
        ],
        common_mistakes: [
            "Avoid spam trigger words",
            "Don't send too frequently",
            "Don't use all caps in subject lines",
            "Avoid generic content",
            "Don't forget mobile optimization"
        ]
    }
};

const AIBenchmarks = () => {
    const [loading, setLoading] = useState(true);
    const [benchmarks, setBenchmarks] = useState(null);
    const [error, setError] = useState(null);
    const [selectedIndustry, setSelectedIndustry] = useState('general');
    const [useFallback, setUseFallback] = useState(false);

    const industries = [
        { value: 'general', label: 'General' },
        { value: 'ecommerce', label: 'E-commerce' },
        { value: 'saas', label: 'SaaS' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'finance', label: 'Finance' },
    ];

    useEffect(() => {
        const fetchBenchmarks = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/ai/benchmarks?industry=${selectedIndustry}`);
                setBenchmarks(response.data);
                setUseFallback(false);
            } catch (err) {
                console.error('Error fetching benchmarks:', err);
                setError(err.response?.data?.error || 'Failed to load benchmarks from API.');
                // Use fallback data if API fails
                setBenchmarks(fallbackBenchmarks);
                setUseFallback(true);
            } finally {
                setLoading(false);
            }
        };
        fetchBenchmarks();
    }, [selectedIndustry]);

    return (
        <div>
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-text mb-2">Industry Benchmarks</h2>
                <p className="text-text-secondary">
                    Compare your email performance against industry standards.
                </p>
                {useFallback && (
                    <div className="mt-2 text-sm text-warning bg-warning/10 p-2 rounded-lg">
                        ⚠️ Using fallback data. API connection unavailable.
                    </div>
                )}
            </header>

            <div className="mb-6">
                <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="w-full md:w-1/3 bg-background border border-border rounded-lg p-3 focus:ring-2 focus:ring-accent text-text"
                >
                    {industries.map((industry) => (
                        <option key={industry.value} value={industry.value} className="bg-primary">
                            {industry.label}
                        </option>
                    ))}
                </select>
            </div>

            {loading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading benchmarks...</p>
                </div>
            )}

            {error && !useFallback && (
                <div className="text-sm text-danger bg-danger/10 p-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {benchmarks && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <BenchmarkCard title="Open Rate" benchmark={benchmarks.benchmarks.open_rate} icon={TrendingUp} />
                        <BenchmarkCard title="Click Rate" benchmark={benchmarks.benchmarks.click_rate} icon={TrendingUp} />
                        <BenchmarkCard title="Conversion Rate" benchmark={benchmarks.benchmarks.conversion_rate} icon={TrendingUp} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-primary border border-border rounded-xl p-4">
                            <h3 className="font-semibold text-text mb-3 flex items-center">
                                <CheckCircle size={18} className="mr-2 text-success" />
                                Best Practices
                            </h3>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                {benchmarks.benchmarks.best_practices.map((item, i) => (
                                    <li key={i} className="flex items-start">
                                        <span className="mr-2 mt-1">∙</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-primary border border-border rounded-xl p-4">
                            <h3 className="font-semibold text-text mb-3 flex items-center">
                                <XCircle size={18} className="mr-2 text-danger" />
                                Common Mistakes
                            </h3>
                            <ul className="space-y-2 text-sm text-text-secondary">
                                {benchmarks.benchmarks.common_mistakes.map((item, i) => (
                                    <li key={i} className="flex items-start">
                                        <span className="mr-2 mt-1">∙</span>
                                        {item}
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

export default AIBenchmarks; 