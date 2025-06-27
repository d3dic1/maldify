import React, { useState } from 'react';
import EmailAnalyzer from '../components/EmailAnalyzer';
import PerformancePredictor from '../components/PerformancePredictor';
import OptimizationSuggestions from '../components/OptimizationSuggestions';
import EmailIdeasGenerator from '../components/EmailIdeasGenerator';
import AIBenchmarks from '../components/AIBenchmarks';
import EmailCopyGenerator from '../components/EmailCopyGenerator';
import { Bot, Zap, Wand2, Lightbulb, ClipboardCheck, BarChart3 } from 'lucide-react';

const AIEmailOptimizer = () => {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [emailData, setEmailData] = useState({
    subject_line: '',
    preview_text: '',
    email_content: '',
    target_audience: 'general',
    campaign_type: 'newsletter'
  });

  const tabs = [
    { id: 'analyzer', name: 'Email Analyzer', icon: ClipboardCheck, component: EmailAnalyzer },
    { id: 'suggestions', name: 'Optimization Suggestions', icon: Wand2, component: OptimizationSuggestions },
    { id: 'predictor', name: 'Performance Predictor', icon: Zap, component: PerformancePredictor },
    { id: 'copy-generator', name: 'Email Copy Generator', icon: Bot, component: EmailCopyGenerator },
    { id: 'ideas', name: 'Email Ideas Generator', icon: Lightbulb, component: EmailIdeasGenerator },
    { id: 'benchmarks', name: 'Industry Benchmarks', icon: BarChart3, component: AIBenchmarks }
  ];

  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results);
    setActiveTab('suggestions');
  };

  const handleEmailDataUpdate = (newData) => {
    setEmailData(newData);
  };

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-text">AI Email Optimizer</h1>
        <p className="text-text-secondary">Leverage AI to analyze, optimize, and generate high-performing email campaigns.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Tab Navigation */}
        <aside className="w-full md:w-1/4">
          <nav className="flex flex-col space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-accent text-background shadow-md'
                    : 'text-text-secondary hover:bg-primary hover:text-text'
                }`}
              >
                <tab.icon size={20} className="mr-3" />
                <span className="font-semibold">{tab.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Tab Content */}
        <main className="flex-1 bg-primary rounded-xl border border-border p-8">
          {ActiveComponent && (
            <ActiveComponent
              onAnalysisComplete={handleAnalysisComplete}
              onEmailDataUpdate={handleEmailDataUpdate}
              emailData={emailData}
              analysisResults={analysisResults}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AIEmailOptimizer;