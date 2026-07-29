import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProfileHeader from '../components/social/ProfileHeader';
import PostCard from '../components/social/PostCard';
import { resolveUploadUrl } from '../lib/media';
import { useLanguage } from '../context/LanguageContext';
import * as socialApi from '../api/social';

export default function SocialProfilePage() {
  const { userId } = useParams();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [view, setView] = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    socialApi
      .getProfile(userId)
      .then((data) => {
        if (!active) return;
        setProfile(data.profile);
        setPosts(data.posts);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  function handleDeleted(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  if (loading) {
    return <div className="h-full overflow-y-auto bg-gray-50 p-6 text-sm text-gray-400">{t('common.loading')}</div>;
  }
  if (notFound || !profile) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-3">
        <p className="text-sm text-gray-600">{t('social.userNotFound')}</p>
        <Link to="/sosyal" className="text-brand-600 hover:underline text-sm font-medium">
          {t('social.backToFeed')}
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-5 space-y-5">
        <ProfileHeader profile={profile} onProfileChange={setProfile} />

        {/* Görünüm değiştirici */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setView('grid')}
            className={`text-xs px-3 py-1 rounded-full ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 bg-white border border-gray-200'}`}
          >
            {t('social.gridView')}
          </button>
          <button
            onClick={() => setView('list')}
            className={`text-xs px-3 py-1 rounded-full ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 bg-white border border-gray-200'}`}
          >
            {t('social.listView')}
          </button>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">{t('social.noPosts')}</p>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/sosyal/gonderi/${post.id}`}
                className="relative aspect-square bg-gray-100 rounded-md overflow-hidden group"
              >
                {post.images[0] && (
                  <img src={resolveUploadUrl(post.images[0].url)} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-4 text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                  <span>♥ {post.likeCount}</span>
                  <span>💬 {post.commentCount}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
