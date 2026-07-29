import { useState } from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../UserAvatar';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import { resolveUploadUrl } from '../../lib/media';
import { timeAgo } from '../../lib/timeAgo';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import * as socialApi from '../../api/social';

// Tek bir gönderi kartı: kullanıcı bilgisi, fotoğraf galerisi, beğeni/yorum
// aksiyonları ve açıklama. Kendi gönderinizse düzenleme/silme menüsü görünür.
export default function PostCard({ post, onDeleted, onUpdated }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [liked, setLiked] = useState(post.isLikedByViewer);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [imageIndex, setImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post.caption || '');
  const [likeBusy, setLikeBusy] = useState(false);

  const isOwn = user?.id === post.userId;
  const images = post.images || [];

  async function toggleLike() {
    if (!user || likeBusy) return;
    setLikeBusy(true);
    const next = !liked;
    // Anlık (optimistic) güncelleme
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const result = next ? await socialApi.likePost(post.id) : await socialApi.unlikePost(post.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // hata olursa geri al
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    } finally {
      setLikeBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('social.confirmDeletePost'))) return;
    try {
      await socialApi.deletePost(post.id);
      onDeleted?.(post.id);
    } catch {
      // yoksay
    }
  }

  async function handleSaveCaption() {
    try {
      const updated = await socialApi.updatePost(post.id, { caption });
      setEditing(false);
      onUpdated?.(updated);
    } catch {
      // yoksay
    }
  }

  return (
    <article className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Başlık */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Link to={`/sosyal/kullanici/${post.userId}`}>
          <UserAvatar avatarUrl={post.user?.avatarUrl} name={post.user?.name} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/sosyal/kullanici/${post.userId}`}
            className="text-sm font-medium text-gray-900 hover:underline block truncate"
          >
            {post.user?.name}
          </Link>
          <p className="text-xs text-gray-400">{timeAgo(post.createdAt, t)}</p>
        </div>
        {isOwn && (
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => setEditing((v) => !v)} className="text-gray-500 hover:text-brand-700">
              {t('common.edit')}
            </button>
            <button onClick={handleDelete} className="text-gray-500 hover:text-red-500">
              {t('common.delete')}
            </button>
          </div>
        )}
      </div>

      {/* Fotoğraf galerisi */}
      {images.length > 0 && (
        <div className="relative bg-black aspect-square">
          <img
            src={resolveUploadUrl(images[imageIndex].url)}
            alt=""
            className="w-full h-full object-contain"
          />
          {images.length > 1 && (
            <>
              {imageIndex > 0 && (
                <button
                  onClick={() => setImageIndex((i) => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                  aria-label={t('social.prevPhoto')}
                >
                  ‹
                </button>
              )}
              {imageIndex < images.length - 1 && (
                <button
                  onClick={() => setImageIndex((i) => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                  aria-label={t('social.nextPhoto')}
                >
                  ›
                </button>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((img, i) => (
                  <span
                    key={img.id}
                    className={`w-1.5 h-1.5 rounded-full ${i === imageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="px-3 pt-2.5 flex items-center gap-4">
        <LikeButton liked={liked} count={likeCount} onToggle={toggleLike} disabled={!user || likeBusy} />
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-brand-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.7 9.7 0 01-4-.85L3 20l1.1-3.3A7.9 7.9 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="tabular-nums">{commentCount}</span>
        </button>
      </div>

      {/* Açıklama */}
      <div className="px-3 pb-3 pt-1.5">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={2200}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={handleSaveCaption} className="bg-brand-600 text-white text-xs px-3 py-1.5 rounded-full hover:bg-brand-700">
                {t('common.save')}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setCaption(post.caption || '');
                }}
                className="text-gray-500 text-xs px-2"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          post.caption && (
            <p className="text-sm text-gray-800 break-words">
              <Link to={`/sosyal/kullanici/${post.userId}`} className="font-medium text-gray-900 hover:underline">
                {post.user?.name}
              </Link>{' '}
              {post.caption}
            </p>
          )
        )}

        {showComments && (
          <div className="mt-3">
            <CommentSection postId={post.id} onCountChange={setCommentCount} />
          </div>
        )}
      </div>
    </article>
  );
}
