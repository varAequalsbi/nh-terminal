import React, { useState } from 'react';
import {
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Radio,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './layout.css';

export function NHLogo() {
  return <img className="nh-logo" src="/assets/brand/nh-logo.svg" alt="NH Terminal" />;
}

export default function Header({ onTabChange, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const current = useLocation().pathname.slice(1) || 'dashboard';
  const tabs = [
    ['dashboard', 'Dashboard', LayoutDashboard],
    ['signal', 'Signal', Radio],
    ['market', 'Market', LineChart],
    ['community', 'Community', Users],
    ['profile', 'Profile', User],
  ];
  const go = (id) => { navigate(`/${id}`); onTabChange?.(id); setOpen(false); };
  return <header className="site-header">
    <div className="header-inner">
      <button className="logo-button" onClick={() => go('dashboard')}><NHLogo /></button>
      <nav className={open ? 'open' : ''} aria-label="Primary navigation">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            className={current === id ? 'selected' : ''}
            onClick={() => go(id)}
            aria-current={current === id ? 'page' : undefined}
          >
            <Icon className="nav-icon" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="header-tools"><button className={`settings ${current === 'settings' ? 'active' : ''}`} onClick={() => go('settings')}><Settings size={20}/> SETTINGS</button><button onClick={onLogout} aria-label="Logout"><LogOut size={20}/></button><button className="menu" onClick={()=>setOpen(!open)} aria-label="Toggle navigation">{open?<X/>:<Menu/>}</button></div>
    </div>
  </header>;
}
