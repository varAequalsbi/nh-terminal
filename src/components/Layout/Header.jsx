import React, { useState } from 'react';
import { LogOut, Menu, Settings, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './layout.css';

export function NHLogo() {
  return <img className="nh-logo" src="/assets/brand/nh-logo.svg" alt="NH Terminal" />;
}

export default function Header({ onTabChange, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const current = useLocation().pathname.slice(1) || 'dashboard';
  const tabs = [['dashboard','DASHBOARD'],['signal','SIGNAL'],['market','MARKET'],['community','COMMUNITY'],['profile','PROFILE']];
  const go = (id) => { navigate(`/${id}`); onTabChange?.(id); setOpen(false); };
  return <header className="site-header">
    <div className="header-inner">
      <button className="logo-button" onClick={() => go('dashboard')}><NHLogo /></button>
      <nav className={open ? 'open' : ''}>{tabs.map(([id,label])=><button key={id} className={current===id?'selected':''} onClick={()=>go(id)}>{label}</button>)}</nav>
      <div className="header-tools"><button className="settings"><Settings size={20}/> SETTINGS</button><button onClick={onLogout} aria-label="Logout"><LogOut size={20}/></button><button className="menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>
    </div>
  </header>;
}
