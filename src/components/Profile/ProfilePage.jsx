import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Eye, HelpCircle, Lock, Play, Settings } from 'lucide-react';
import { dataService, queryKeys } from '../../services/dataService';
import { AsyncBoundary } from '../Common/AsyncStates';
import { useNavigate } from 'react-router-dom';
import './profile.css';

const order = ['INACTIVE', 'TRADER', 'PRIME', 'ELITE', 'SULTAN'];
function TierRoadmap({ tiers, current }) {
  const currentIndex = order.indexOf(current);
  return (
    <div className="tier-roadmap">
      {[...tiers]
        .sort((a, b) => b.minimumLots - a.minimumLots)
        .map((tier) => {
          const index = order.indexOf(tier.name);
          const state =
            index === currentIndex ? 'active' : index < currentIndex ? 'done' : 'future';
          return (
            <div className={`tier-step ${state}`} key={tier.id}>
              <i />
              <b>{tier.name}</b>
              <span>
                <em>{tier.minimumLots.toLocaleString()} Lot</em>
                <u />
                {tier.reward}
              </span>
            </div>
          );
        })}
    </div>
  );
}
function VideoCard({ course, index, userTier }) {
  const locked = order.indexOf(userTier) < order.indexOf(course.requiredTier);
  const [playing, setPlaying] = useState(false);
  return (
    <article
      className={`education-card ${locked ? 'locked' : ''}`}
      onClick={() =>
        locked
          ? window.alert(`Upgrade to ${course.requiredTier} to unlock this lesson.`)
          : setPlaying(!playing)
      }
    >
      <h3>
        <b>{index}.</b> {course.title}
      </h3>
      <div className="video-screen">
        {locked ? (
          <div>
            <span>
              <Lock />
            </span>
            <strong>{course.requiredTier}</strong>
          </div>
        ) : playing ? (
          <strong>Playing lesson…</strong>
        ) : (
          <Play />
        )}
      </div>
      <footer>
        <span>NH TECHNICAL - {Math.round(course.durationSeconds / 60)} MIN</span>
        <span>
          <Eye />
          {course.completed
            ? 'Completed'
            : `${Math.round((course.progressSeconds || 0) / 60)} min watched`}
        </span>
      </footer>
    </article>
  );
}
export default function ProfilePage() {
  const navigate = useNavigate();
  const profile = useQuery({ queryKey: queryKeys.me, queryFn: dataService.users.me });
  const tiers = useQuery({ queryKey: queryKeys.tiers, queryFn: dataService.tiers.list });
  const courses = useQuery({
    queryKey: queryKeys.courses,
    queryFn: () => dataService.courses.list(),
  });
  const user = profile.data;
  const tierList = tiers.data?.items || [];
  const courseList = courses.data?.items || [];
  const loading = profile.isLoading || tiers.isLoading || courses.isLoading;
  const error = profile.error || tiers.error || courses.error;
  const progress = user ? Math.min(100, (user.lots / user.nextTierLots) * 100) : 0;
  return (
    <AsyncBoundary
      isLoading={loading}
      error={error}
      data={user}
      onRetry={() => {
        profile.refetch();
        tiers.refetch();
        courses.refetch();
      }}
    >
      {user && (
        <div className="profile-page">
          <section className="profile-summary">
            <div className="profile-identity">
              <div className="profile-avatar">
                {user.name
                  .split(' ')
                  .map((x) => x[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <h1>{user.name.toUpperCase()}</h1>
                <p>
                  @{user.username} - IB {user.ibId}
                </p>
                <b>{user.tier}</b>
              </div>
            </div>
            <div className="profile-progress">
              <div>
                <span>
                  Progress to <b>{user.nextTier}</b>
                </span>
                <strong>
                  {user.lots.toLocaleString()} / {user.nextTierLots.toLocaleString()} Lot
                </strong>
              </div>
              <div className="progress-track">
                <i style={{ width: `${progress}%` }} />
              </div>
              <small>{(user.nextTierLots - user.lots).toLocaleString()} Lot remaining</small>
              <nav>
                <button onClick={() => document.getElementById('rewards')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Award />
                  Reward Program
                </button>
                <button onClick={() => document.getElementById('education')?.scrollIntoView({ behavior: 'smooth' })}>
                  <BookOpen />
                  Education
                </button>
                <button onClick={() => navigate('/settings')}>
                  <Settings />
                  Settings
                </button>
                <button onClick={() => navigate('/help-center')}>
                  <HelpCircle />
                  Help
                </button>
              </nav>
            </div>
          </section>
          <section className="rewards" id="rewards">
            <div>
              <h2>REWARD TIERS</h2>
              <TierRoadmap tiers={tierList} current={user.tier} />
            </div>
            <div>
              <h2>MEMBERSHIP</h2>
              <div className="reward-stats">
                <article>
                  <span>Current Tier</span>
                  <b>{user.tier}</b>
                </article>
                <article>
                  <span>Total Lot</span>
                  <b>{user.lots} LOT</b>
                </article>
                <article>
                  <span>Progress</span>
                  <b>{progress.toFixed(1)}%</b>
                </article>
                <article>
                  <span>Member Since</span>
                  <b>
                    {new Date(user.joinedAt).toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </b>
                </article>
              </div>
            </div>
          </section>
          <section className="education" id="education">
            <h2>EDUCATION VIDEOS</h2>
            <div>
              {courseList.map((course, i) => (
                <VideoCard course={course} userTier={user.tier} index={i + 1} key={course.id} />
              ))}
            </div>
          </section>
        </div>
      )}
    </AsyncBoundary>
  );
}
