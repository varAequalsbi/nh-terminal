import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NHLogo } from './Header';
import './layout.css';

const groups = [
  ['PRODUCT', [
    ['Dashboard', '/dashboard'],
    ['Signals', '/signal'],
    ['Market', '/market'],
    ['Economic Calendar', '/market?tab=calendar'],
  ]],
  ['COMMUNITY', [
    ['Community', '/community'],
    ['Live Trade', '/community?tab=live'],
    ['Forum', '/community?tab=forum'],
    ['Education', '/profile#education'],
  ]],
  ['SUPPORT', [
    ['Help Center', '/help-center'],
    ['FAQ', '/faq'],
    ['Contact', '/contact'],
    ['Privacy', '/privacy'],
  ]],
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <NHLogo />
          <p>
            Trade Smarter.
            <br />
            Understand The Market.
            <br />
            Make Better Decisions.
          </p>
        </div>
        {groups.map(([title, links]) => (
          <details className="footer-links" key={title}>
            <summary>
              <span>{title}</span>
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <div className="footer-link-list">
              {links.map(([label, to]) => (
                <Link to={to} key={label}>
                  {label}
                </Link>
              ))}
            </div>
          </details>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© 2026 NH Terminal</span>
        <div>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/risk-disclosure">Risk Disclosure</Link>
        </div>
      </div>
    </footer>
  );
}
