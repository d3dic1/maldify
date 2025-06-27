import React, { useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from './../services/firebase'; // Adjust path as needed

const Navbar = () => {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex-shrink-0 bg-primary border-b border-border w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-2 w-full">
        <div className="flex items-center w-full sm:w-auto justify-between">
          <h1 className="text-2xl font-bold text-accent">Maldify</h1>
          {/* Hamburger for mobile (optional, for future expansion) */}
          {/*
          <button
            className="sm:hidden ml-4 p-2 rounded-lg border border-border"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          */}
        </div>
        <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-text-secondary hover:text-accent transition-colors duration-200"
            title="Logout"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar; 