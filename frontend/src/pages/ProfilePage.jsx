import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import UserAvatar from '../components/UserAvatar';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export default function ProfilePage() {
  const { user, updateAvatar, removeAvatar } = useAuth();
  const { t, lang } = useLanguage();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      setError(t('profile.photoInvalidType'));
      return;
    }

    setUploading(true);
    setError('');
    try {
      await updateAvatar(file);
    } catch (err) {
      setError(err.response?.data?.message || t('profile.photoUploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    setRemoving(true);
    setError('');
    try {
      await removeAvatar();
    } catch (err) {
      setError(err.response?.data?.message || t('profile.photoRemoveFailed'));
    } finally {
      setRemoving(false);
    }
  }

  const locale = lang === 'en' ? 'en-US' : 'tr-TR';
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(locale) : '—');

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 max-w-lg mx-auto bg-gray-50">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('profile.title')}</h1>

      <div className="bg-white rounded-2xl shadow-card p-5 space-y-4 text-sm">
        <div className="flex items-center gap-4">
          <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || removing}
                className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-full transition hover:bg-brand-700 disabled:opacity-50"
              >
                {uploading ? t('profile.uploadingPhoto') : t('profile.changePhoto')}
              </button>
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploading || removing}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full transition hover:bg-gray-200 disabled:opacity-50"
                >
                  {removing ? t('profile.removingPhoto') : t('profile.removePhoto')}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">{t('profile.photoHint')}</p>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p>
            <span className="text-gray-500">{t('profile.name')}</span> {user.name}
          </p>
          {user.companyName && (
            <p>
              <span className="text-gray-500">{t('profile.company')}</span> {user.companyName}
            </p>
          )}
          <p>
            <span className="text-gray-500">{t('profile.email')}</span> {user.email}
          </p>
          <p>
            <span className="text-gray-500">{t('profile.role')}</span>{' '}
            {user.role === 'ADMIN' ? t('profile.roleAdmin') : t('profile.roleUser')}
          </p>
          <p>
            <span className="text-gray-500">{t('profile.memberSince')}</span> {fmtDate(user.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
