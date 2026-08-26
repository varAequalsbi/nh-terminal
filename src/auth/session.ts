import type { Session, UserRole } from '../types/models';

const SESSION_KEY = 'nh.session';
const LEGACY_TOKEN_KEY = 'authToken';

export const readSession = (): Session | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored) as Session;
    if (localStorage.getItem(LEGACY_TOKEN_KEY)) {
      return { user: { id: 'demo-member', name: 'NH Member', email: '', role: 'member', tier: 'PRIME' } };
    }
  } catch { localStorage.removeItem(SESSION_KEY); }
  return null;
};

export const writeSession = (session: Session) => localStorage.setItem(SESSION_KEY, JSON.stringify(session));
export const clearSession = () => { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(LEGACY_TOKEN_KEY); };
export const hasRole = (session: Session | null, roles?: UserRole[]) => !roles?.length || Boolean(session && roles.includes(session.user.role));
