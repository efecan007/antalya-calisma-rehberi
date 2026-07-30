import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import * as jobsApi from '../../api/jobs';

// Yeni iş ilanı oluşturma modalı. Şirket ismi ve pozisyon zorunludur.
export default function CreateJobModal({ open, onClose, onCreated }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    companyName: '',
    position: '',
    profession: '',
    employmentType: '',
    location: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setForm({ companyName: '', position: '', profession: '', employmentType: '', location: '', description: '' });
    setError('');
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.companyName.trim() || !form.position.trim()) {
      setError(t('jobs.requiredError'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const job = await jobsApi.createJob(form);
      reset();
      onCreated(job);
    } catch (err) {
      setError(err.response?.data?.message || t('jobs.createFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-card-hover w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('jobs.createTitle')}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t('jobs.company')} <span className="text-red-500">*</span>
            </label>
            <input
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              maxLength={120}
              className={inputClass}
              placeholder={t('jobs.companyPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t('jobs.position')} <span className="text-red-500">*</span>
            </label>
            <input
              value={form.position}
              onChange={(e) => set('position', e.target.value)}
              maxLength={120}
              className={inputClass}
              placeholder={t('jobs.positionPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('jobs.profession')}</label>
            <input
              value={form.profession}
              onChange={(e) => set('profession', e.target.value)}
              maxLength={80}
              className={inputClass}
              placeholder={t('jobs.professionPlaceholder')}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('jobs.employmentType')}</label>
              <input
                value={form.employmentType}
                onChange={(e) => set('employmentType', e.target.value)}
                maxLength={60}
                className={inputClass}
                placeholder={t('jobs.employmentPlaceholder')}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('jobs.location')}</label>
              <input
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                maxLength={120}
                className={inputClass}
                placeholder={t('jobs.locationPlaceholder')}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('jobs.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={4000}
              rows={3}
              className={inputClass}
              placeholder={t('jobs.descriptionPlaceholder')}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 text-white text-sm font-medium py-2.5 rounded-full hover:bg-brand-700 transition disabled:opacity-50"
          >
            {submitting ? t('jobs.publishing') : t('jobs.publish')}
          </button>
        </form>
      </div>
    </div>
  );
}
