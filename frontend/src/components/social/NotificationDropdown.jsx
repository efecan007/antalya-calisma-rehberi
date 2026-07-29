import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../UserAvatar';
import { timeAgo } from '../../lib/timeAgo';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import * as socialApi from '../../api/social';

const POLL_INTERVAL_MS = 30000;

// Bildirim tipine göre metin ve gidilecek link. Metin i18n'den, aktörün adıyla
// birleştirilir (backend hazır "message" string'i tutmaz, tip + aktör döner).
function describe(n, t) {
  switch (n.type) {
    case 'POST_LIKE':
      return { text: t('social.notifLike', { name: n.actor?.name }), link: `/sosyal/gonderi/${n.postId}` };
    case 'POST_COMMENT':
      return { text: t('social.notifComment', { name: n.actor?.name }), link: `/sosyal/gonderi/${n.postId}` };
    case 'NEW_FOLLOWER':
      return { text: t('social.notifFollow', { name: n.actor?.name }), link: `/sosyal/kullanici/${n.actorId}` };
    default:
      return { text: '', link: '/sosyal' };
  }
}

// Sosyal medya bildirimleri (beğeni/yorum/takip). Mekan bildirimlerinden (NotificationBell)
// ayrı bir sistemdir; navbar'da kalp ikonuyla gösterilir.
export default function NotificationDropdown() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  function fetchUnread() {
    socialApi.getUnreadNotificationCount().then((d) => setUnreadCount(d.count)).catch(() => {});
  }

  useEffect(() => {
    if (!user) return undefined;
    fetchUnread();
    const interval = setInterval(fetchUnread, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) socialApi.getNotifications().then(setNotifications).catch(() => {});
  }

  async function markAsRead(n) {
    if (n.isRead) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await socialApi.markNotificationRead(n.id);
    } catch {
      // sonraki pollingde senkron olur
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative p-1.5 text-gray-600 hover:text-red-500 transition"
        aria-label={t('social.notificationsTitle')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
            <span className="text-sm font-medium text-gray-900">{t('social.notificationsTitle')}</span>
            <Link to="/sosyal/bildirimler" onClick={() => setOpen(false)} className="text-xs text-brand-600 hover:underline">
              {t('social.seeAll')}
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 px-4 py-6 text-center">{t('social.noNotifications')}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => {
                const { text, link } = describe(n, t);
                return (
                  <Link
                    key={n.id}
                    to={link}
                    onClick={() => { markAsRead(n); setOpen(false); }}
                    className={`flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 ${n.isRead ? 'bg-white' : 'bg-brand-50/60'}`}
                  >
                    <UserAvatar avatarUrl={n.actor?.avatarUrl} name={n.actor?.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">{text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt, t)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
