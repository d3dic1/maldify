import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

const QualityAssurance = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <Shield size={40} className="text-accent" />
        <div>
          <h1 className="text-3xl font-bold text-text">Quality Assurance</h1>
          <p className="text-text-secondary mt-1">AI-powered quality control tools for content validation, compliance checking, and quality scoring</p>
        </div>
      </div>

      <div className="bg-primary border border-border rounded-xl p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles size={48} className="text-accent" />
        </div>
        <h2 className="text-2xl font-semibold text-text mb-4">Coming Soon!</h2>
        <p className="text-text-secondary mb-6">
          The Quality Assurance tools are currently in development. This feature will provide AI-powered 
          quality control capabilities including content validation, compliance checking, and quality scoring.
        </p>
        <div className="bg-background/50 p-4 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-medium text-text mb-2">Planned Features:</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Content Validation - AI-powered content quality checks</li>
            <li>• Compliance Checking - Ensure content meets regulatory requirements</li>
            <li>• Quality Scoring - Automated quality assessment and scoring</li>
            <li>• Brand Consistency - Maintain brand voice and guidelines</li>
            <li>• Error Detection - Identify potential issues before sending</li>
            <li>• Quality Workflows - Automated quality control processes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QualityAssurance; 