import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Palette, 
  BarChart3, 
  Video, 
  FileText,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const VisualContent = () => {
  const features = [
    {
      title: 'Email Template Designer',
      description: 'AI-powered email template generation with responsive design, brand customization, and modern layouts.',
      icon: Palette,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      link: '/visual-content/email-template',
      status: 'Available'
    },
    {
      title: 'Infographic Creator',
      description: 'Generate stunning infographics with data visualization, charts, and engaging visual elements.',
      icon: BarChart3,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      link: '/visual-content/infographic',
      status: 'Available'
    },
    {
      title: 'Video Script Generator',
      description: 'Create compelling video scripts for marketing campaigns, product demos, and social media content.',
      icon: Video,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      link: '/visual-content/video-script',
      status: 'Available'
    },
    {
      title: 'Landing Page Copy',
      description: 'Generate high-converting landing page copy with compelling headlines, CTAs, and persuasive content.',
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      link: '/visual-content/landing-page',
      status: 'Coming Soon'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <Palette size={40} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text">Visual Content Generation</h1>
          <p className="text-text-secondary mt-1">AI-powered tools for creating stunning visual content and templates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="bg-primary border border-border rounded-xl p-6 hover:border-accent/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                <feature.icon size={24} className={feature.color} />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                feature.status === 'Available' 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {feature.status}
              </span>
            </div>
            
            <h3 className="text-xl font-semibold text-text mb-2">{feature.title}</h3>
            <p className="text-text-secondary mb-4">{feature.description}</p>
            
            {feature.status === 'Available' ? (
              <Link 
                to={feature.link}
                className="inline-flex items-center text-accent hover:text-accent/80 transition-colors font-medium"
              >
                Get Started
                <ArrowRight size={16} className="ml-2" />
              </Link>
            ) : (
              <Link 
                to={feature.link}
                className="inline-flex items-center text-text-secondary hover:text-accent transition-colors font-medium"
              >
                <Sparkles size={16} className="mr-2" />
                <span className="text-sm">Preview</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text mb-2">About Visual Content Generation</h3>
        <p className="text-text-secondary">
          Our AI-powered visual content tools help you create professional, engaging content that resonates with your audience. 
          From email templates to infographics, video scripts to landing pages - generate stunning visuals that drive results.
        </p>
      </div>
    </div>
  );
};

export default VisualContent; 