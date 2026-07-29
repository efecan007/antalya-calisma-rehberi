import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import { timeAgo } from '../lib/timeAgo';
import { useLanguage } from '../context/LanguageContext';
import * as socialApi from '../api/social';

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

export default function SocialNotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    socialApi
      .getNotifications()
      .then((data) => {
        if (active) setNotifications(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function markRead(n) {
    if (n.isRead) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    try {
      await socialApi.markNotificationRead(n.id);
    } catch {
      // yoksay
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-5">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('social.notificationsTitle')}</h1>

        {loading ? (
          <p className="text-sm text-gray-400 py-6">{t('common.loading')}</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">{t('social.noNotifications')}</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            {notifications.map((n) => {
              const { text, link } = describe(n, t);
              return (
                <Link
                  key={n.id}
                  to={link}
                  onClick={() => markRead(n)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${n.isRead ? 'bg-white' : 'bg-brand-50/60'}`}
                >
                  <UserAvatar avatarUrl={n.actor?.avatarUrl} name={n.actor?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800">{text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt, t)}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
