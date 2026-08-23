import React from 'react';
import { ChevronDown } from 'lucide-react';
import { NHLogo } from './Header';
import './layout.css';

const groups = [
  ['PRODUCT', 'Dashboard', 'Signals', 'Market', 'Economic Calendar'],
  ['COMMUNITY', 'Community', 'Live Trade', 'Forum', 'Education'],
  ['SUPPORT', 'Help Center', 'FAQ', 'Contact', 'Privacy'],
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
        {groups.map(([title, ...links]) => (
          <details className="footer-links" key={title}>
            <summary>
              <span>{title}</span>
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <div className="footer-link-list">
              {links.map((x) => (
                <a href="#" key={x}>
                  {x}
                </a>
              ))}
            </div>
          </details>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© 2026 NH Terminal</span>
        <div>
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Risk Disclosure</a>
        </div>
      </div>
    </footer>
  );
}
