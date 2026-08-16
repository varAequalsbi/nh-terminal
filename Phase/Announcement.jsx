// src/components/Dashboard/Announcement.jsx
import React, { useEffect, useState } from 'react';
import { Card, Badge } from '../Common';

/**
 * Announcement Component
 * Displays latest community announcements
 * 
 * Features:
 * - Shows top 2 announcements
 * - Displays title, content preview, time, author
 * - Has "View All" link
 * - Loading and error states
 */
export default function Announcement() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with real API call when backend is ready
      // import { communityService } from '../../services';
      // const response = await communityService.getAnnouncements();
      // setAnnouncements(response || []);

      // Mock data for now
      const mockAnnouncements = [
        {
          id: 1,
          title: 'High Impact News Today',
          content: 'Volatilitas Estimasi 80-150 Pips. Rekomendasi Close Posisi Atau Perlebar SL Minimal 50 Pips.',
          timestamp: 'Hari ini 15:30 WIB',
          author: 'Admin NH',
          time: '2 Jam Lalu',
        },
        {
          id: 2,
          title: 'High Impact News Today',
          content: 'Volatilitas Estimasi 80-150 Pips. Rekomendasi Close Posisi Atau Perlebar SL Minimal 50 Pips.',
          timestamp: 'Hari ini 15:30 WIB',
          author: 'Admin NH',
          time: '2 Jam Lalu',
        },
      ];

      setAnnouncements(mockAnnouncements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Card>
        <Card.Header title="📢 ANNOUNCEMENT" />
        <Card.Body>
          <p className="text-color-danger text-sm">{error}</p>
        </Card.Body>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <Card.Header title="📢 ANNOUNCEMENT" />
        <Card.Body className="animate-pulse space-y-3">
          <div className="h-16 bg-bg-tertiary rounded"></div>
          <div className="h-16 bg-bg-tertiary rounded"></div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header 
        title="📢 ANNOUNCEMENT" 
        action={
          <a href="/community" className="text-color-gold text-xs font-semibold hover:text-opacity-80">
            View All →
          </a>
        }
      />
      <Card.Body className="space-y-4">
        {announcements.slice(0, 2).map((announcement, idx) => (
          <div
            key={announcement.id || idx}
            className="pb-4 border-b border-border-color last:border-0 last:pb-0"
          >
            {/* Announcement Title */}
            <h4 className="text-sm font-semibold text-text-primary mb-2">
              {announcement.title}
            </h4>

            {/* Announcement Content */}
            <p className="text-xs text-text-secondary mb-2 line-clamp-2">
              {announcement.content}
            </p>

            {/* Time and Author */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-tertiary">
                {announcement.time}
              </span>
              <span className="text-xs text-text-tertiary">
                {announcement.author}
              </span>
            </div>
          </div>
        ))}
      </Card.Body>
    </Card>
  );
}
