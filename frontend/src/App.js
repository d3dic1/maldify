import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AIEmailOptimizer from './pages/AIEmailOptimizer';
import AIPacingEditor from './pages/AIPacingEditor';
import GoogleAnalytics from './pages/GoogleAnalytics';
import CampaignReports from './pages/CampaignReports';
import JourneyReports from './pages/JourneyReports';
import AudienceIntelligence from './pages/AudienceIntelligence';
import SmartRecommendations from './pages/SmartRecommendations';
import AIStudio from './pages/AIStudio';
import AIBlogCreator from './pages/AIBlogCreator';
import VisualContent from './pages/VisualContent';
import ContentEnhancement from './pages/ContentEnhancement';
import SmartAutomation from './pages/SmartAutomation';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import HyperPersonalization from './pages/HyperPersonalization';
import IntelligentReporting from './pages/IntelligentReporting';
import QualityAssurance from './pages/QualityAssurance';
import ChatbotIntegration from './pages/ChatbotIntegration';
import EmailTemplateDesigner from './pages/EmailTemplateDesigner';
import InfographicCreator from './pages/InfographicCreator';
import VideoScriptGenerator from './pages/VideoScriptGenerator';
import LandingPageCopy from './pages/LandingPageCopy';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import OrttoTutorial from './pages/OrttoTutorial';
import LeadScoringDashboard from './pages/LeadScoringDashboard';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex h-screen bg-background text-text">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="flex-1 flex flex-col">
                    <Navbar />
                    <div className="p-8 overflow-y-auto">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/ai-email-optimizer" element={<AIEmailOptimizer />} />
                        <Route path="/ai-pacing-editor" element={<AIPacingEditor />} />
                        <Route path="/ai-studio" element={<AIStudio />} />
                        <Route path="/ai-blog-creator" element={<AIBlogCreator />} />
                        <Route path="/smart-recommendations" element={<SmartRecommendations />} />
                        <Route path="/visual-content" element={<VisualContent />} />
                        <Route path="/content-enhancement" element={<ContentEnhancement />} />
                        <Route path="/smart-automation" element={<SmartAutomation />} />
                        <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
                        <Route path="/hyper-personalization" element={<HyperPersonalization />} />
                        <Route path="/intelligent-reporting" element={<IntelligentReporting />} />
                        <Route path="/quality-assurance" element={<QualityAssurance />} />
                        <Route path="/chatbot-integration" element={<ChatbotIntegration />} />
                        <Route path="/visual-content/email-template" element={<EmailTemplateDesigner />} />
                        <Route path="/visual-content/infographic" element={<InfographicCreator />} />
                        <Route path="/visual-content/video-script" element={<VideoScriptGenerator />} />
                        <Route path="/visual-content/landing-page" element={<LandingPageCopy />} />
                        <Route path="/audience-intelligence" element={<AudienceIntelligence />} />
                        <Route path="/google-analytics" element={<GoogleAnalytics />} />
                        <Route path="/campaign-reports" element={<CampaignReports />} />
                        <Route path="/journey-reports" element={<JourneyReports />} />
                        <Route path="/ortto-tutorial" element={<OrttoTutorial />} />
                        <Route path="/lead-scoring" element={<LeadScoringDashboard />} />
                      </Routes>
                    </div>
                  </main>
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 