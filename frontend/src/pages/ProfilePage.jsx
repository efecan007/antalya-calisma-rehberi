import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  if (!user) return null;

  return (
    <div className="h-full p-6 max-w-md mx-auto bg-gray-50">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('profile.title')}</h1>
      <div className="bg-white rounded-2xl shadow-card p-5 space-y-2 text-sm">
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
          <span className="text-gray-500">{t('profile.memberSince')}</span>{' '}
          {new Date(user.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}
        </p>
      </div>
    </div>
  );
}
