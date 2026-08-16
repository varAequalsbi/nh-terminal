// src/components/Layout/Header.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Settings, LogOut } from 'lucide-react';

export default function Header({ onTabChange, onLogout }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname.replace('/', '') || 'dashboard';

  const handleTabClick = (tabId) => {
    navigate(`/${tabId}`);
    if (onTabChange) onTabChange(tabId);
  };

  const tabs = [
    { id: 'dashboard', label: 'DASHBOARD' },
    { id: 'signal', label: 'SIGNAL' },
    { id: 'market', label: 'MARKET' },
    { id: 'community', label: 'COMMUNITY' },
    { id: 'profile', label: 'PROFILE' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-bg-primary border-b border-border-color">
      <div className="container flex justify-between items-center h-20">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2">
          <div className="w-10 h-10 bg-color-gold rounded flex items-center justify-center">
            <span className="text-bg-primary font-black">NH</span>
          </div>
          <span className="hidden sm:inline">NH Terminal</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                px-4 py-2 text-sm font-semibold transition-colors
                ${
                  currentPath === tab.id
                    ? 'text-color-gold border-b-2 border-color-gold'
                    : 'text-text-secondary hover:text-text-primary'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Settings */}
          <button className="text-text-secondary hover:text-color-gold transition-colors">
            <Settings size={20} />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="text-text-secondary hover:text-color-gold transition-colors hidden sm:inline"
          >
            <LogOut size={20} />
          </button>

          {/* Mobile Menu */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-text-secondary hover:text-text-primary"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <nav className="md:hidden border-t border-border-color bg-bg-secondary">
          <div className="container py-4 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  handleTabClick(tab.id);
                  setShowMobileMenu(false);
                }}
                className={`
                  px-4 py-2 text-left font-semibold transition-colors
                  ${
                    currentPath === tab.id
                      ? 'text-color-gold bg-bg-tertiary'
                      : 'text-text-secondary hover:text-text-primary'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
            <hr className="border-border-color my-2" />
            <button
              onClick={() => {
                onLogout();
                setShowMobileMenu(false);
              }}
              className="px-4 py-2 text-left text-text-secondary hover:text-color-danger transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
