import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Headphones, HelpCircle, LockKeyhole, ShieldAlert } from 'lucide-react';
import './info.css';

const pages = {
  help: {
    eyebrow: 'SUPPORT', title: 'Help Center', icon: HelpCircle,
    intro: 'Find quick answers and the right place to get help with NH Terminal.',
    sections: [
      ['Using the terminal', 'Use the main navigation to access signals, market charts, the economic calendar, and the community.'],
      ['Account and membership', 'Your profile contains tier progress, rewards, education, and account settings.'],
      ['Still need help?', 'Visit Contact Support to speak with the NH team.'],
    ],
  },
  faq: {
    eyebrow: 'SUPPORT', title: 'Frequently Asked Questions', icon: HelpCircle,
    intro: 'Common questions about the platform, signals, market data, and membership.',
    sections: [
      ['Where can I find trading signals?', 'Open Signals from the header or footer to review the latest active setups.'],
      ['Where is the economic calendar?', 'Open Market, then choose the Calendar tab to filter upcoming events by impact.'],
      ['How do I join a live trade?', 'Open Community and select Live Trade. Live sessions appear there when published.'],
      ['How do I unlock education videos?', 'Education access depends on your membership tier and is shown on your Profile page.'],
    ],
  },
  contact: {
    eyebrow: 'SUPPORT', title: 'Contact Support', icon: Headphones,
    intro: 'The NH support team can help with account, membership, and platform questions.',
    sections: [
      ['Community support', 'Use the Chat tab in Community for the fastest in-platform support.'],
      ['Before contacting us', 'Include your member ID and a short description of the issue. Never share your password.'],
    ],
    action: ['Open Support Chat', '/community?tab=chat'],
  },
  privacy: {
    eyebrow: 'LEGAL', title: 'Privacy Policy', icon: LockKeyhole,
    intro: 'How NH Terminal handles information used to provide and improve the platform.',
    sections: [
      ['Information we use', 'We may process account, membership, device, and platform-usage information needed to operate the service.'],
      ['How information is used', 'Information is used for authentication, support, product functionality, security, and service improvements.'],
      ['Your choices', 'You may contact support to request access to, correction of, or deletion of eligible personal information.'],
    ],
  },
  terms: {
    eyebrow: 'LEGAL', title: 'Terms of Use', icon: FileText,
    intro: 'These terms describe the basic rules for accessing and using NH Terminal.',
    sections: [
      ['Platform access', 'Keep your credentials secure and use the service only for lawful purposes.'],
      ['Market information', 'Content is provided for informational and educational purposes and may be delayed or incomplete.'],
      ['Service availability', 'Features may change, be suspended, or become unavailable during maintenance or updates.'],
    ],
  },
  risk: {
    eyebrow: 'LEGAL', title: 'Risk Disclosure', icon: ShieldAlert,
    intro: 'Trading financial instruments involves substantial risk and is not suitable for every person.',
    sections: [
      ['Trading risk', 'You can lose some or all of the capital you commit. Leverage may amplify both gains and losses.'],
      ['No guarantee', 'Signals, analysis, examples, and historical results do not guarantee future performance.'],
      ['Make informed decisions', 'Consider your objectives, experience, and financial circumstances, and seek independent professional advice when appropriate.'],
    ],
  },
};

export default function InfoPage({ page }) {
  const content = pages[page];
  const Icon = content.icon;

  return (
    <div className="info-page">
      <section className="info-hero">
        <span><Icon aria-hidden="true" /> {content.eyebrow}</span>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </section>
      <section className="info-content">
        {content.sections.map(([title, body]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
        {content.action && <Link className="info-action" to={content.action[1]}>{content.action[0]}</Link>}
      </section>
    </div>
  );
}
