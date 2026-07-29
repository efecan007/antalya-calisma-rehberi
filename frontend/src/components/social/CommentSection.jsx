import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CommentItem from './CommentItem';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import * as socialApi from '../../api/social';

// Bir gönderinin yorum listesi + yorum yazma formu. Yorum ekleme/silme burada
// yönetilir; ebeveyn (PostCard/PostDetail) yorum sayısı değişimini onCountChange
// ile öğrenebilir.
export default function CommentSection({ postId, onCountChange }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    socialApi
      .getComments(postId)
      .then((data) => {
        if (active) setComments(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [postId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const comment = await socialApi.addComment(postId, content);
      setComments((prev) => {
        const next = [...prev, comment];
        onCountChange?.(next.length);
        return next;
      });
      setText('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== commentId);
      onCountChange?.(next.length);
      return next;
    });
    try {
      await socialApi.deleteComment(commentId);
    } catch {
      // hata olursa listeyi geri yükle
      socialApi.getComments(postId).then(setComments);
    }
  }

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {loading ? (
          <p className="text-sm text-gray-400 py-2">{t('common.loading')}</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">{t('social.noComments')}</p>
        ) : (
          comments.map((c) => (
            <CommentItem key={c.id} comment={c} currentUserId={user?.id} onDelete={handleDelete} />
          ))
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder={t('social.commentPlaceholder')}
            className="flex-1 min-w-0 border border-gray-200 rounded-full px-3 py-1.5 text-sm bg-gray-50 focus:bg-white"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="text-brand-600 text-sm font-medium px-2 disabled:opacity-40"
          >
            {t('social.send')}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
          {t('social.loginToInteractPre')}{' '}
          <Link to="/giris" className="text-brand-600 hover:underline">
            {t('detail.loginLink')}
          </Link>
          .
        </p>
      )}
    </div>
  );
}
