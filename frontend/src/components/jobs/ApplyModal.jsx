import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import * as jobsApi from '../../api/jobs';

// İş ilanına başvuru modalı. Başvuran kendi mesleğini belirtmek zorundadır.
export default function ApplyModal({ job, onClose, onApplied }) {
  const { t } = useLanguage();
  const [profession, setProfession] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!job) return null;

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!profession.trim()) {
      setError(t('jobs.professionRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const application = await jobsApi.applyToJob(job.id, { profession, message });
      onApplied(job.id, application);
    } catch (err) {
      setError(err.response?.data?.message || t('jobs.applyFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-card-hover w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('jobs.applyTitle')}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{job.position}</span> · {job.companyName}
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t('jobs.yourProfession')} <span className="text-red-500">*</span>
            </label>
            <input
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              maxLength={80}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder={t('jobs.yourProfessionPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('jobs.coverMessage')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder={t('jobs.coverMessagePlaceholder')}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 text-white text-sm font-medium py-2.5 rounded-full hover:bg-brand-700 transition disabled:opacity-50"
          >
            {submitting ? t('jobs.applying') : t('jobs.submitApplication')}
          </button>
        </form>
      </div>
    </div>
  );
}
