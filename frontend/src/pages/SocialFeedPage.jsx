import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/social/PostCard';
import CreatePostModal from '../components/social/CreatePostModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import * as socialApi from '../api/social';

const PAGE_SIZE = 20;

export default function SocialFeedPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all'); // 'all' | 'following'
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(
    async (nextPage, currentFilter) => {
      setLoading(true);
      try {
        const data = await socialApi.getFeed({ following: currentFilter === 'following', page: nextPage });
        setPosts((prev) => (nextPage === 1 ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
        setPage(nextPage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(1, filter);
  }, [filter, load]);

  function handleCreated(post) {
    setModalOpen(false);
    // Yeni gönderi en üstte görünür.
    setPosts((prev) => [post, ...prev]);
  }

  function handleDeleted(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handleUpdated(updated) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, caption: updated.caption } : p)));
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-5">
        {/* Başlık + oluştur */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">{t('social.feed')}</h1>
          {user && (
            <div className="flex items-center gap-2">
              <Link
                to={`/sosyal/kullanici/${user.id}`}
                className="text-sm font-medium px-4 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
              >
                {t('social.myProfile')}
              </Link>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-brand-600 text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-brand-700 transition"
              >
                {t('social.createPost')}
              </button>
            </div>
          )}
        </div>

        {/* Filtre sekmeleri */}
        {user && (
          <div className="flex gap-1 mb-4 bg-white border border-gray-200 rounded-full p-1 w-fit">
            <button
              onClick={() => setFilter('all')}
              className={`text-sm px-4 py-1.5 rounded-full transition ${filter === 'all' ? 'bg-brand-600 text-white' : 'text-gray-600'}`}
            >
              {t('social.allPosts')}
            </button>
            <button
              onClick={() => setFilter('following')}
              className={`text-sm px-4 py-1.5 rounded-full transition ${filter === 'following' ? 'bg-brand-600 text-white' : 'text-gray-600'}`}
            >
              {t('social.followingPosts')}
            </button>
          </div>
        )}

        {!user && (
          <p className="text-sm text-gray-500 mb-4">
            {t('social.loginToInteractPre')}{' '}
            <Link to="/giris" className="text-brand-600 hover:underline">
              {t('detail.loginLink')}
            </Link>
            .
          </p>
        )}

        {/* Gönderiler */}
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDeleted={handleDeleted} onUpdated={handleUpdated} />
          ))}
        </div>

        {loading && <p className="text-sm text-gray-400 text-center py-6">{t('common.loading')}</p>}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">
            {filter === 'following' ? t('social.followingEmpty') : t('social.feedEmpty')}
          </p>
        )}
        {!loading && hasMore && (
          <div className="text-center py-5">
            <button
              onClick={() => load(page + 1, filter)}
              className="text-sm text-brand-600 font-medium hover:underline"
            >
              {t('social.loadMore')}
            </button>
          </div>
        )}
      </div>

      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </div>
  );
}
