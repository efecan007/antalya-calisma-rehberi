import { Link } from 'react-router-dom';
import UserAvatar from '../UserAvatar';
import { timeAgo } from '../../lib/timeAgo';
import { useLanguage } from '../../context/LanguageContext';

// Tek bir yorum: profil fotoğrafı, kullanıcı adı, yorum metni ve tarih. Kendi
// yorumunuzsa silme butonu görünür.
export default function CommentItem({ comment, currentUserId, onDelete }) {
  const { t } = useLanguage();
  const isOwn = currentUserId === comment.userId;

  return (
    <div className="flex items-start gap-2.5 py-2">
      <Link to={`/sosyal/kullanici/${comment.userId}`} className="shrink-0">
        <UserAvatar avatarUrl={comment.user?.avatarUrl} name={comment.user?.name} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 break-words">
          <Link to={`/sosyal/kullanici/${comment.userId}`} className="font-medium text-gray-900 hover:underline">
            {comment.user?.name}
          </Link>{' '}
          {comment.content}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(comment.createdAt, t)}</p>
      </div>
      {isOwn && (
        <button
          type="button"
          onClick={() => onDelete(comment.id)}
          className="shrink-0 text-xs text-gray-400 hover:text-red-500 transition"
        >
          {t('common.delete')}
        </button>
      )}
    </div>
  );
}
