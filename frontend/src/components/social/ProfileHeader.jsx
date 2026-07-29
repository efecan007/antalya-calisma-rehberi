import { useState } from 'react';
import UserAvatar from '../UserAvatar';
import { useLanguage } from '../../context/LanguageContext';
import * as socialApi from '../../api/social';

// Profil başlığı: avatar, isim, biyografi, istatistikler ve Takip Et/Takip
// Ediliyor butonu. Kendi profiliniz ise biyografi düzenleme görünür.
export default function ProfileHeader({ profile, onProfileChange }) {
  const { t } = useLanguage();
  const [following, setFollowing] = useState(profile.isFollowedByViewer);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [busy, setBusy] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(profile.bio || '');
  const [savingBio, setSavingBio] = useState(false);

  async function toggleFollow() {
    if (busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    setFollowerCount((c) => c + (next ? 1 : -1));
    try {
      if (next) await socialApi.followUser(profile.userId);
      else await socialApi.unfollowUser(profile.userId);
    } catch {
      setFollowing(!next);
      setFollowerCount((c) => c + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  async function saveBio() {
    setSavingBio(true);
    try {
      const result = await socialApi.updateMyProfile({ bio });
      setEditingBio(false);
      onProfileChange?.(result.profile);
    } catch {
      // yoksay
    } finally {
      setSavingBio(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-4 sm:gap-6">
        <UserAvatar avatarUrl={profile.avatarUrl} name={profile.name} size="md" className="!w-20 !h-20 !text-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{profile.name}</h1>
            {!profile.isSelf && (
              <button
                onClick={toggleFollow}
                disabled={busy}
                className={`text-sm px-4 py-1.5 rounded-full font-medium transition disabled:opacity-50 ${
                  following
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {following ? t('social.following') : t('social.follow')}
              </button>
            )}
          </div>

          {/* İstatistikler */}
          <div className="flex gap-5 mt-3 text-sm">
            <span><b className="text-gray-900">{profile.postCount}</b> <span className="text-gray-500">{t('social.posts')}</span></span>
            <span><b className="text-gray-900">{followerCount}</b> <span className="text-gray-500">{t('social.followers')}</span></span>
            <span><b className="text-gray-900">{profile.followingCount}</b> <span className="text-gray-500">{t('social.followingLabel')}</span></span>
            <span className="hidden sm:inline"><b className="text-gray-900">{profile.totalLikes}</b> <span className="text-gray-500">{t('social.totalLikes')}</span></span>
          </div>
        </div>
      </div>

      {/* Biyografi */}
      <div className="mt-4">
        {editingBio ? (
          <div className="space-y-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder={t('social.bioPlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={saveBio} disabled={savingBio} className="bg-brand-600 text-white text-xs px-3 py-1.5 rounded-full hover:bg-brand-700 disabled:opacity-50">
                {t('common.save')}
              </button>
              <button onClick={() => { setEditingBio(false); setBio(profile.bio || ''); }} className="text-gray-500 text-xs px-2">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.bio || (profile.isSelf ? t('social.noBioSelf') : '')}</p>
            {profile.isSelf && (
              <button onClick={() => setEditingBio(true)} className="shrink-0 text-xs text-brand-600 hover:underline">
                {t('social.editBio')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
