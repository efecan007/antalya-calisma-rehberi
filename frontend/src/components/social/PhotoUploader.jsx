import { useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const MAX_IMAGES = 10;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Çoklu fotoğraf seçici + önizleme (galeri desteği). Seçilen dosyaları ve önizleme
// URL'lerini ebeveyne (CreatePostModal) props ile bildirir.
export default function PhotoUploader({ files, onChange, error }) {
  const inputRef = useRef(null);
  const { t } = useLanguage();

  function handleSelect(e) {
    const selected = Array.from(e.target.files || []).filter((f) => ALLOWED_TYPES.has(f.type));
    e.target.value = '';
    if (!selected.length) return;
    const combined = [...files, ...selected].slice(0, MAX_IMAGES);
    onChange(combined);
  }

  function removeAt(index) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {files.map((file, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80"
              aria-label={t('common.delete')}
            >
              ×
            </button>
          </div>
        ))}
        {files.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-brand-400 hover:text-brand-500 flex items-center justify-center text-2xl"
          >
            +
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1.5">{t('social.photoHint')}</p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleSelect}
        className="hidden"
      />
    </div>
  );
}
