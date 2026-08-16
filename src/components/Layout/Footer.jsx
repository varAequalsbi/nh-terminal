import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-border-color mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-color-gold font-bold mb-2">NH Terminal</div>
            <p className="text-sm text-text-secondary">
              Trade Smarter.<br />
              Understand The Market.<br />
              Make Better Decisions.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4">PRODUCT</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><a href="#" className="hover:text-color-gold">Dashboard</a></li>
              <li><a href="#" className="hover:text-color-gold">Signals</a></li>
              <li><a href="#" className="hover:text-color-gold">Market</a></li>
              <li><a href="#" className="hover:text-color-gold">Economic Calendar</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4">COMMUNITY</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><a href="#" className="hover:text-color-gold">Community</a></li>
              <li><a href="#" className="hover:text-color-gold">Live Trade</a></li>
              <li><a href="#" className="hover:text-color-gold">Forum</a></li>
              <li><a href="#" className="hover:text-color-gold">Education</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4">SUPPORT</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><a href="#" className="hover:text-color-gold">Help Center</a></li>
              <li><a href="#" className="hover:text-color-gold">FAQ</a></li>
              <li><a href="#" className="hover:text-color-gold">Contact</a></li>
              <li><a href="#" className="hover:text-color-gold">Privacy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border-color pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-text-tertiary">
          <p>© 2026 NH Terminal. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="hover:text-color-gold">Terms</a>
            <a href="#" className="hover:text-color-gold">Privacy</a>
            <a href="#" className="hover:text-color-gold">Risk Disclosure</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
