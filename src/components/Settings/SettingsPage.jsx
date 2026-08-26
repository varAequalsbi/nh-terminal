import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, LockKeyhole, Save, UserRound } from 'lucide-react';
import { authService } from '../../services/authService';
import { dataService, queryKeys } from '../../services/dataService';
import { AsyncBoundary } from '../Common/AsyncStates';
import './settings.css';

const defaultPreferences = {
  language: 'id',
  emailSignals: true,
  emailAnnouncements: true,
  browserNotifications: false,
};

function Status({ value }) {
  if (!value) return null;
  return <p className={`settings-status ${value.type}`} role="status"><CheckCircle2 />{value.message}</p>;
}

export default function SettingsPage({ onSessionUpdate }) {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: queryKeys.me, queryFn: dataService.users.me });
  const [profile, setProfile] = useState({ name: '', username: '', email: '' });
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [profileStatus, setProfileStatus] = useState(null);
  const [preferenceStatus, setPreferenceStatus] = useState(null);
  const [passwordStatus, setPasswordStatus] = useState(null);

  useEffect(() => {
    if (!profileQuery.data) return;
    setProfile({
      name: profileQuery.data.name || '',
      username: profileQuery.data.username || '',
      email: profileQuery.data.email || '',
    });
    setPreferences({ ...defaultPreferences, ...profileQuery.data.preferences });
  }, [profileQuery.data]);

  const saveProfile = useMutation({
    mutationFn: () => authService.updateProfile(profile),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      onSessionUpdate?.(user);
      setProfileStatus({ type: 'success', message: 'Profile saved.' });
    },
    onError: (error) => setProfileStatus({ type: 'error', message: error.response?.data?.message || 'Unable to save profile.' }),
  });
  const savePreferences = useMutation({
    mutationFn: () => authService.updatePreferences(preferences),
    onSuccess: () => setPreferenceStatus({ type: 'success', message: 'Preferences saved.' }),
    onError: (error) => setPreferenceStatus({ type: 'error', message: error.response?.data?.message || 'Unable to save preferences.' }),
  });
  const savePassword = useMutation({
    mutationFn: () => authService.updatePassword(passwords.current, passwords.next),
    onSuccess: (result) => {
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordStatus({ type: 'success', message: result.message || 'Password updated.' });
    },
    onError: (error) => setPasswordStatus({ type: 'error', message: error.response?.data?.message || 'Unable to update password.' }),
  });

  const submitPassword = (event) => {
    event.preventDefault();
    setPasswordStatus(null);
    if (passwords.next.length < 8) return setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters.' });
    if (passwords.next !== passwords.confirm) return setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
    savePassword.mutate();
  };

  return (
    <AsyncBoundary isLoading={profileQuery.isLoading} error={profileQuery.error} data={profileQuery.data} onRetry={profileQuery.refetch}>
      <div className="settings-page">
        <header className="settings-heading"><h1>ACCOUNT SETTINGS</h1><p>Manage your NH Terminal demo account.</p></header>
        <div className="settings-grid">
          <form className="settings-card" onSubmit={(event) => { event.preventDefault(); setProfileStatus(null); saveProfile.mutate(); }}>
            <h2><UserRound /> Profile</h2>
            <label>Full name<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></label>
            <label>Username<input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} required /></label>
            <label>Email<input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></label>
            <Status value={profileStatus} />
            <button className="settings-save" disabled={saveProfile.isPending}><Save />{saveProfile.isPending ? 'Saving…' : 'Save Profile'}</button>
          </form>

          <form className="settings-card" onSubmit={submitPassword}>
            <h2><LockKeyhole /> Password</h2>
            <label>Current password<input type="password" autoComplete="current-password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required /></label>
            <label>New password<input type="password" autoComplete="new-password" minLength="8" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required /></label>
            <label>Confirm new password<input type="password" autoComplete="new-password" minLength="8" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required /></label>
            <small>At least 8 characters.</small>
            <Status value={passwordStatus} />
            <button className="settings-save" disabled={savePassword.isPending}><Save />{savePassword.isPending ? 'Updating…' : 'Update Password'}</button>
          </form>

          <form className="settings-card preferences-card" onSubmit={(event) => { event.preventDefault(); setPreferenceStatus(null); savePreferences.mutate(); }}>
            <h2><Bell /> Preferences</h2>
            <label>Language<select value={preferences.language} onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}><option value="id">Bahasa Indonesia</option><option value="en">English</option></select></label>
            <label className="toggle-row"><span><b>Signal emails</b><small>Updates for newly published signals.</small></span><input type="checkbox" checked={preferences.emailSignals} onChange={(e) => setPreferences({ ...preferences, emailSignals: e.target.checked })} /></label>
            <label className="toggle-row"><span><b>Announcement emails</b><small>Important platform and community news.</small></span><input type="checkbox" checked={preferences.emailAnnouncements} onChange={(e) => setPreferences({ ...preferences, emailAnnouncements: e.target.checked })} /></label>
            <label className="toggle-row"><span><b>Browser notifications</b><small>Demo preference; browser permission integration comes later.</small></span><input type="checkbox" checked={preferences.browserNotifications} onChange={(e) => setPreferences({ ...preferences, browserNotifications: e.target.checked })} /></label>
            <Status value={preferenceStatus} />
            <button className="settings-save" disabled={savePreferences.isPending}><Save />{savePreferences.isPending ? 'Saving…' : 'Save Preferences'}</button>
          </form>
        </div>
      </div>
    </AsyncBoundary>
  );
}
