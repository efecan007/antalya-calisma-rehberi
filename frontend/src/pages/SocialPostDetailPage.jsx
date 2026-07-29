import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PostCard from '../components/social/PostCard';
import { useLanguage } from '../context/LanguageContext';
import * as socialApi from '../api/social';

export default function SocialPostDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    socialApi
      .getPost(id)
      .then((data) => {
        if (active) setPost(data);
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
  }, [id]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-5">
        <Link to="/sosyal" className="text-sm text-gray-500 hover:text-brand-700 transition inline-block mb-3">
          ← {t('social.backToFeed')}
        </Link>

        {loading && <p className="text-sm text-gray-400 py-6">{t('common.loading')}</p>}
        {notFound && <p className="text-sm text-gray-600 py-6">{t('social.postNotFound')}</p>}
        {post && <PostCard post={post} onDeleted={() => setNotFound(true)} />}
      </div>
    </div>
  );
}
