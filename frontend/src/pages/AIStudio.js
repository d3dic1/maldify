import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Image, Edit3, MousePointer, Users, TrendingUp, Zap, Sparkles, Target, BarChart3, Shield, MessageCircle, FileText } from 'lucide-react';

const features = [
  {
    title: 'Smart Recommendations',
    description: 'AI-powered suggestions for subject lines, content, images, and CTAs.',
    icon: <Wand2 size={32} className="text-accent" />,
    to: '/smart-recommendations',
  },
  {
    title: 'Visual Content Generation',
    description: 'Generate email templates, infographics, and video scripts with AI.',
    icon: <Image size={32} className="text-accent" />,
    to: '/visual-content',
  },
  {
    title: 'Content Enhancement',
    description: 'Personalization, story generation, FAQs, and case study writing.',
    icon: <Edit3 size={32} className="text-accent" />,
    to: '/content-enhancement',
  },
  {
    title: 'AI Blog Creator',
    description: 'Generate and publish blog posts automatically to your Shopify store.',
    icon: <FileText size={32} className="text-accent" />,
    to: '/ai-blog-creator',
  },
  {
    title: 'Smart Automation',
    description: 'AI-driven triggers, workflow design, and drip campaign optimization.',
    icon: <Zap size={32} className="text-accent" />,
    to: '/smart-automation',
  },
  {
    title: 'Audience Intelligence',
    description: 'Predictive segmentation, churn prediction, engagement scoring, personas.',
    icon: <Users size={32} className="text-accent" />,
    to: '/audience-intelligence',
  },
  {
    title: 'Advanced Analytics',
    description: 'Anomaly detection, ROI prediction, A/B test optimizer, trend analysis.',
    icon: <TrendingUp size={32} className="text-accent" />,
    to: '/advanced-analytics',
  },
  {
    title: 'Hyper-Personalization',
    description: 'Dynamic content generation, behavioral targeting, real-time customization.',
    icon: <Target size={32} className="text-accent" />,
    to: '/hyper-personalization',
  },
  {
    title: 'Intelligent Reporting',
    description: 'Automated insights, trend analysis, predictive reporting.',
    icon: <BarChart3 size={32} className="text-accent" />,
    to: '/intelligent-reporting',
  },
  {
    title: 'Quality Assurance',
    description: 'Content validation, compliance checking, quality scoring.',
    icon: <Shield size={32} className="text-accent" />,
    to: '/quality-assurance',
  },
  {
    title: 'Chatbot Integration',
    description: 'Conversation design, response generation, integration capabilities.',
    icon: <MessageCircle size={32} className="text-accent" />,
    to: '/chatbot-integration',
  },
];

const AIStudio = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <Sparkles size={40} className="text-accent" />
        <div>
          <h1 className="text-3xl font-bold text-text">AI Studio</h1>
          <p className="text-text-secondary mt-1">Explore and launch advanced AI-powered marketing tools</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-primary border border-border rounded-xl p-6 flex flex-col items-start shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(feature.to)}
          >
            {feature.icon}
            <h2 className="text-xl font-semibold mt-4 mb-2 text-accent">{feature.title}</h2>
            <p className="text-text-secondary mb-4">{feature.description}</p>
            <button
              className="mt-auto bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors"
              onClick={(e) => { e.stopPropagation(); navigate(feature.to); }}
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIStudio; 