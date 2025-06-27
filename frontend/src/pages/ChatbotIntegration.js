import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

const ChatbotIntegration = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <MessageCircle size={40} className="text-accent" />
        <div>
          <h1 className="text-3xl font-bold text-text">Chatbot Integration</h1>
          <p className="text-text-secondary mt-1">AI-powered chatbot tools for conversation design, response generation, and integration capabilities</p>
        </div>
      </div>

      <div className="bg-primary border border-border rounded-xl p-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles size={48} className="text-accent" />
        </div>
        <h2 className="text-2xl font-semibold text-text mb-4">Coming Soon!</h2>
        <p className="text-text-secondary mb-6">
          The Chatbot Integration tools are currently in development. This feature will provide AI-powered 
          chatbot capabilities including conversation design, response generation, and integration capabilities.
        </p>
        <div className="bg-background/50 p-4 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-medium text-text mb-2">Planned Features:</h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Conversation Design - AI-powered chatbot conversation flows</li>
            <li>• Response Generation - Intelligent response creation</li>
            <li>• Integration Capabilities - Connect with various platforms</li>
            <li>• Intent Recognition - Understand user intentions</li>
            <li>• Multi-language Support - Chatbot in multiple languages</li>
            <li>• Analytics & Optimization - Track and improve chatbot performance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChatbotIntegration; 