import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { regionLabel, typeLabel } from '../constants';

const STAT_KEYS = {
  totalUsers: 'admin.statUsers',
  totalPlaces: 'admin.statPlaces',
  pendingSuggestions: 'admin.statPending',
  totalReviews: 'admin.statReviews',
  totalFavorites: 'admin.statFavorites',
};

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [pendingPlaces, setPendingPlaces] = useState([]);
  const [places, setPlaces] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reportedComments, setReportedComments] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [statsRes, placesRes, pendingRes, reviewsRes, usersRes, messagesRes, reportedRes] = await Promise.all([
      apiClient.get('/admin/dashboard'),
      apiClient.get('/places'),
      apiClient.get('/admin/suggestions'),
      apiClient.get('/reviews'),
      apiClient.get('/admin/users'),
      apiClient.get('/messages'),
      apiClient.get('/admin/comments/reports'),
    ]);
    setStats(statsRes.data);
    setPlaces(placesRes.data);
    setPendingPlaces(pendingRes.data);
    setReviews(reviewsRes.data);
    setUsers(usersRes.data);
    setMessages(messagesRes.data);
    setReportedComments(reportedRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function approve(id) {
    await apiClient.patch(`/admin/suggestions/${id}/approve`);
    loadAll();
  }

  async function reject(id) {
    await apiClient.patch(`/admin/suggestions/${id}/reject`);
    loadAll();
  }

  async function deletePlace(id) {
    if (!window.confirm(t('admin.confirmDeletePlace'))) return;
    await apiClient.delete(`/places/${id}`);
    loadAll();
  }

  async function deleteReview(id) {
    await apiClient.delete(`/reviews/${id}`);
    loadAll();
  }

  async function deleteUser(id) {
    if (!window.confirm(t('admin.confirmDeleteUser'))) return;
    await apiClient.delete(`/admin/users/${id}`);
    loadAll();
  }

  async function deleteMessage(id) {
    if (!window.confirm(t('admin.confirmDeleteMessage'))) return;
    await apiClient.delete(`/messages/${id}`);
    loadAll();
  }

  async function deleteComment(id) {
    if (!window.confirm(t('admin.confirmDeleteComment'))) return;
    await apiClient.delete(`/comments/${id}`);
    loadAll();
  }

  async function dismissReports(id) {
    await apiClient.patch(`/admin/comments/${id}/dismiss-reports`);
    loadAll();
  }

  if (loading) return <p className="p-6 text-sm text-gray-500">{t('common.loading')}</p>;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto space-y-8 bg-gray-50">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{t('admin.title')}</h1>
        <Link
          to="/mekan-ekle"
          className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-full transition hover:bg-brand-700"
        >
          {t('admin.addNewPlace')}
        </Link>
      </div>

      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(STAT_KEYS).map(([key, labelKey]) => (
            <div key={key} className="bg-white shadow-card rounded-xl p-3 text-center">
              <p className="text-2xl font-semibold text-gray-900">{stats[key]}</p>
              <p className="text-xs text-gray-500">{t(labelKey)}</p>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="font-medium text-gray-900 mb-3">{t('admin.pendingPlaces', { count: pendingPlaces.length })}</h2>
        {pendingPlaces.length === 0 && (
          <p className="text-sm text-gray-500">{t('admin.noPending')}</p>
        )}
        <div className="space-y-2">
          {pendingPlaces.map((place) => (
            <div key={place.id} className="bg-white shadow-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{place.name}</p>
                <p className="text-xs text-gray-500">
                  {typeLabel(place.type, t)} · {regionLabel(place.region)} · {place.address}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approve(place.id)}
                  className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-full transition hover:bg-emerald-700"
                >
                  {t('admin.approve')}
                </button>
                <button
                  onClick={() => reject(place.id)}
                  className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-full transition hover:bg-red-700"
                >
                  {t('admin.reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">{t('admin.allPlaces', { count: places.length })}</h2>
        <div className="space-y-2">
          {places.map((place) => (
            <div key={place.id} className="bg-white shadow-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{place.name}</p>
                <p className="text-xs text-gray-500">
                  {typeLabel(place.type, t)} · {regionLabel(place.region)} · {place.address}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/admin/mekanlar/${place.id}/duzenle`}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full transition hover:bg-gray-200"
                >
                  {t('common.edit')}
                </Link>
                <button
                  onClick={() => deletePlace(place.id)}
                  className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-full transition hover:bg-red-700"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">{t('admin.reviews', { count: reviews.length })}</h2>
        <div className="space-y-2">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white shadow-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{review.user?.name}</span> ·{' '}
                  <span className="text-gray-500">{review.place?.name}</span> ·{' '}
                  <span className="text-amber-600">{review.overallRating}/5</span>
                </p>
                {review.comment && <p className="text-xs text-gray-500 mt-0.5">{review.comment}</p>}
              </div>
              <button
                onClick={() => deleteReview(review.id)}
                className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-full transition hover:bg-red-700"
              >
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">{t('admin.users', { count: users.length })}</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-white shadow-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{u.name}</span>{' '}
                  <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5 ml-1">{u.role}</span>
                </p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              {u.id !== currentUser?.id && (
                <button
                  onClick={() => deleteUser(u.id)}
                  className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-full transition hover:bg-red-700"
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">{t('admin.reportedComments', { count: reportedComments.length })}</h2>
        {reportedComments.length === 0 && <p className="text-sm text-gray-500">{t('admin.noReported')}</p>}
        <div className="space-y-2">
          {reportedComments.map((comment) => (
            <div key={comment.id} className="bg-white shadow-card rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{comment.user?.name}</span> ·{' '}
                  <span className="text-gray-500">{comment.place?.name}</span> ·{' '}
                  <span className="text-red-600">{t('admin.reportCount', { count: comment.reportCount })}</span>
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => dismissReports(comment.id)}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full transition hover:bg-gray-200"
                  >
                    {t('admin.dismissReports')}
                  </button>
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-full transition hover:bg-red-700"
                  >
                    {t('admin.deleteComment')}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">{comment.content}</p>
              <div className="mt-1 space-y-0.5">
                {comment.reports?.map((report) => (
                  <p key={report.id} className="text-xs text-gray-400">
                    {t('admin.reportedBy', { name: report.user?.name })}
                    {report.reason && t('admin.reportReason', { reason: report.reason })}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">{t('admin.chatMessages', { count: messages.length })}</h2>
        {messages.length === 0 && <p className="text-sm text-gray-500">{t('admin.noMessages')}</p>}
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="bg-white shadow-card rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{m.user?.name}</span> ·{' '}
                  <span className="text-gray-500">{m.place?.name}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{m.content}</p>
              </div>
              <button
                onClick={() => deleteMessage(m.id)}
                className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-full transition hover:bg-red-700"
              >
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
