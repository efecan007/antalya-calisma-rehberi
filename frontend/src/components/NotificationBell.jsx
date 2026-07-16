import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_MS = 30000;

const TYPE_LINKS = {
  SUGGESTION_APPROVED: (n) => (n.placeId ? `/mekan/${n.placeId}` : null),
  SUGGESTION_REJECTED: (n) => (n.placeId ? `/mekan/${n.placeId}` : null),
  FAVORITE_PLACE_UPDATED: (n) => (n.placeId ? `/mekan/${n.placeId}` : null),
  COMMENT_REPORTED: (n) => (n.placeId ? `/mekan/${n.placeId}` : null),
  COMMENT_DELETED: (n) => (n.placeId ? `/mekan/${n.placeId}` : null),
  FAVORITE_LOW_OCCUPANCY: (n) => (n.placeId ? `/mekan/${n.placeId}` : null),
  CHAT_REPLY: (n) => (n.placeId ? `/mekan/${n.placeId}` : null),
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  function fetchUnreadCount() {
    apiClient
      .get('/notifications/unread-count')
      .then(({ data }) => setUnreadCount(data.count))
      .catch(() => {});
  }

  function fetchNotifications() {
    apiClient
      .get('/notifications')
      .then(({ data }) => setNotifications(data))
      .catch(() => {});
  }

  useEffect(() => {
    if (!user) return undefined;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  }

  async function markAsRead(notification) {
    if (notification.isRead) return;
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiClient.patch(`/notifications/${notification.id}/read`);
    } catch {
      // sessizce yoksay, bir sonraki pollingde senkronize olur
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {
      // sessizce yoksay
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative p-1.5 text-gray-600 hover:text-brand-700 transition"
        aria-label="Bildirimler"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-card-hover z-30 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-900">Bildirimler</span>
            {notifications.some((n) => !n.isRead) && (
              <button type="button" onClick={markAllRead} className="text-xs text-brand-600 hover:underline">
                Tümünü okundu işaretle
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 px-4 py-6 text-center">Henüz bildirimin yok.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => {
                const link = TYPE_LINKS[n.type]?.(n);
                const content = (
                  <div className={`px-4 py-2.5 text-sm ${n.isRead ? 'bg-white' : 'bg-brand-50/60'}`}>
                    <p className="text-gray-800">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                );
                return link ? (
                  <Link key={n.id} to={link} onClick={() => { markAsRead(n); setOpen(false); }} className="block hover:bg-gray-50">
                    {content}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => markAsRead(n)}
                    className="block w-full text-left hover:bg-gray-50"
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
