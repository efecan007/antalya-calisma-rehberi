import { resolveUploadUrl } from '../lib/media';

const SIZE_CLASSES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-16 h-16 text-xl',
};

// Kullanıcının profil fotoğrafını gösterir; fotoğrafı yoksa isminin baş harfini
// içeren renkli bir daire gösterir (yorumlarda, sohbette ve profil sayfasında
// tutarlı bir görünüm için paylaşılan tek bir bileşen).
export default function UserAvatar({ avatarUrl, name, size = 'sm', className = '' }) {
  const sizeClass = SIZE_CLASSES[size];

  if (avatarUrl) {
    return (
      <img
        src={resolveUploadUrl(avatarUrl)}
        alt={name || ''}
        className={`${sizeClass} rounded-full object-cover border border-gray-200 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-semibold border border-gray-200 shrink-0 ${className}`}
    >
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}
