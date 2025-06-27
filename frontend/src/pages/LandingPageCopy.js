import React from 'react';
import { FileText, Sparkles } from 'lucide-react';

const LandingPageCopy = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <FileText size={40} className="text-accent" />
        <div>
          <h1 className="text-3xl font-bold text-text">Landing Page Copy Generator</h1>
          <p className="text-text-secondary mt-1">AI-powered landing page content creation with high-converting copy and SEO optimization</p>
        </div>
      </div>

      <div className="bg-primary border border-border rounded-xl p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles size={48} className="text-accent" />
        </div>
        <h2 className="text-2xl font-semibold text-text mb-4">Coming Soon!</h2>
        <p className="text-text-secondary mb-6">
          The Landing Page Copy Generator is currently in development. This feature will allow you to generate 
          high-converting landing page content with compelling headlines, CTAs, and persuasive copy optimized for conversions.
        </p>
        <div className="bg-background/50 p-4 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-medium text-text mb-2">Planned Features:</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Hero section with compelling headlines and CTAs</li>
            <li>• Benefits section with persuasive copy</li>
            <li>• Social proof and testimonials</li>
            <li>• Pricing section optimization</li>
            <li>• SEO meta tags and descriptions</li>
            <li>• Conversion optimization recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LandingPageCopy;
