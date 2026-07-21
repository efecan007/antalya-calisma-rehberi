import { useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

function resolvePhotoUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
}

export default function CommentList({ comments, onChanged }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  if (!comments.length) {
    return <p className="text-sm text-gray-500">{t('comment.none')}</p>;
  }

  async function toggleHelpful(comment) {
    setBusyId(comment.id);
    setError('');
    try {
      await apiClient.post(`/comments/${comment.id}/helpful`);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || t('comment.actionFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function reportComment(comment) {
    if (!window.confirm(t('comment.confirmReport'))) return;
    setBusyId(comment.id);
    setError('');
    try {
      await apiClient.post(`/comments/${comment.id}/report`);
      window.alert(t('comment.reported'));
    } catch (err) {
      setError(err.response?.data?.message || t('comment.reportFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteComment(comment) {
    if (!window.confirm(t('comment.confirmDelete'))) return;
    setBusyId(comment.id);
    setError('');
    try {
      await apiClient.delete(`/comments/${comment.id}`);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || t('comment.deleteFailed'));
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  async function saveEdit(comment) {
    if (!editContent.trim()) {
      setError(t('comment.empty'));
      return;
    }
    setBusyId(comment.id);
    setError('');
    try {
      const formData = new FormData();
      formData.append('content', editContent);
      await apiClient.put(`/comments/${comment.id}`, formData);
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || t('comment.updateFailed'));
    } finally {
      setBusyId(null);
    }
  }

  async function togglePin(comment) {
    setBusyId(comment.id);
    setError('');
    try {
      await apiClient.patch(`/comments/${comment.id}/${comment.isPinned ? 'unpin' : 'pin'}`);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || t('comment.actionFailed'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {comments.map((comment) => {
        const isOwner = user && comment.user?.id === user.id;
        const isEditing = editingId === comment.id;
        const isBusy = busyId === comment.id;
        const wasEdited = comment.updatedAt && comment.createdAt && comment.updatedAt !== comment.createdAt;

        return (
          <div
            key={comment.id}
            className={`rounded-xl p-3 ${comment.isPinned ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}
          >
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">{comment.user?.name || t('review.userFallback')}</span>
                {comment.isPinned && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                    {t('comment.pinned')}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}
                {wasEdited && ` · ${t('comment.edited')}`}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(comment)}
                    disabled={isBusy}
                    className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full disabled:opacity-50"
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    {t('comment.cancelEdit')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                {comment.photoUrl && (
                  <img
                    src={resolvePhotoUrl(comment.photoUrl)}
                    alt={t('comment.photoAlt')}
                    className="mt-2 h-40 w-auto max-w-full object-cover rounded-lg"
                  />
                )}
              </>
            )}

            {!isEditing && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggleHelpful(comment)}
                  disabled={!user || isBusy}
                  className={`px-2.5 py-1 rounded-full border transition disabled:opacity-50 ${
                    comment.isHelpfulByViewer
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300'
                  }`}
                >
                  {t('comment.helpful')}{comment.helpfulCount ? ` (${comment.helpfulCount})` : ''}
                </button>
                {isOwner && (
                  <button type="button" onClick={() => startEdit(comment)} className="text-gray-500 hover:underline">
                    {t('common.edit')}
                  </button>
                )}
                {(isOwner || user?.role === 'ADMIN') && (
                  <button type="button" onClick={() => deleteComment(comment)} className="text-red-500 hover:underline">
                    {t('common.delete')}
                  </button>
                )}
                {user?.role === 'ADMIN' && (
                  <button type="button" onClick={() => togglePin(comment)} className="text-amber-600 hover:underline">
                    {comment.isPinned ? t('comment.unpin') : t('comment.pin')}
                  </button>
                )}
                {user && !isOwner && (
                  <button
                    type="button"
                    onClick={() => reportComment(comment)}
                    className="text-gray-400 hover:underline"
                  >
                    {t('comment.report')}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
