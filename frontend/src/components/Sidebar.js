import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  Mail,
  Users,
  Settings,
  Bot,
  Zap,
  Wand2,
  Lightbulb,
  HelpCircle,
  FileText,
  GitBranch,
  Target,
  Brain,
  Sparkles,
  Image,
  Menu
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaign-reports', icon: FileText, label: 'Campaign Reports' },
  { to: '/journey-reports', icon: GitBranch, label: 'Journey Reports' },
  { to: '/ai-email-optimizer', icon: Bot, label: 'AI Email Optimizer', group: 'AI Tools' },
  { to: '/ai-pacing-editor', icon: Zap, label: 'AI Pacing Editor', group: 'AI Tools' },
  { to: '/audience-intelligence', icon: Brain, label: 'Audience Intelligence', group: 'AI Tools' },
  { to: '/ai-studio', icon: Sparkles, label: 'AI Studio', group: 'AI Studio' },
  { to: '/smart-recommendations', icon: Wand2, label: 'Smart Recommendations', group: 'AI Studio' },
  { to: '/visual-content', icon: Image, label: 'Visual Content', group: 'AI Studio' },
  { to: '/lead-scoring', icon: Target, label: 'Lead Scoring', group: 'Analytics' },
  { to: '/google-analytics', icon: BarChart2, label: 'Google Analytics' },
  { to: '/ortto-tutorial', icon: HelpCircle, label: 'Ortto Tutorial', group: 'Help' },
];

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 whitespace-nowrap ${
          isActive
            ? 'bg-accent text-background'
            : 'text-text-secondary hover:bg-primary hover:text-text'
        }`
      }
      title={label}
      onClick={() => setOpen(false)}
    >
      <Icon size={22} />
      <span className="ml-4 font-semibold">{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-primary p-2 rounded-lg border border-border shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open sidebar"
      >
        <Menu size={28} />
      </button>
      {/* Sidebar overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity md:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
      />
      {/* Sidebar itself */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-primary p-4 flex flex-col flex-shrink-0 z-50 transform transition-transform md:relative md:translate-x-0 md:flex md:h-auto md:w-64 md:z-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex-grow">
          <nav>
            <ul>
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavItem {...item} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex-shrink-0">
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 