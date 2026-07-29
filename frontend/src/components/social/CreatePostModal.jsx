import { useState } from 'react';
import PhotoUploader from './PhotoUploader';
import { useLanguage } from '../../context/LanguageContext';
import * as socialApi from '../../api/social';

// Yeni gönderi oluşturma modalı: çoklu fotoğraf + açıklama. Başarılı olunca
// oluşturulan gönderiyi onCreated ile ebeveyne verir.
export default function CreatePostModal({ open, onClose, onCreated }) {
  const { t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  function reset() {
    setFiles([]);
    setCaption('');
    setError('');
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!files.length) {
      setError(t('social.photoRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const post = await socialApi.createPost({ caption, images: files });
      reset();
      onCreated(post);
    } catch (err) {
      setError(err.response?.data?.message || t('social.postFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-card-hover w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('social.createPost')}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <PhotoUploader files={files} onChange={setFiles} error={error} />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2200}
            rows={3}
            placeholder={t('social.captionPlaceholder')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !files.length}
            className="w-full bg-brand-600 text-white text-sm font-medium py-2.5 rounded-full hover:bg-brand-700 transition disabled:opacity-50"
          >
            {submitting ? t('social.sharing') : t('social.share')}
          </button>
        </form>
      </div>
    </div>
  );
}
