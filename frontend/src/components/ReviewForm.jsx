import { useState } from 'react';
import apiClient from '../api/client';
import { RATING_CRITERIA } from '../constants';

const initialState = RATING_CRITERIA.reduce((acc, c) => {
  acc[c.field] = 3;
  return acc;
}, { comment: '' });

export default function ReviewForm({ placeId, onSubmitted }) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await apiClient.post(`/places/${placeId}/reviews`, form);
      onSubmitted(data);
      setForm(initialState);
    } catch (err) {
      setError(err.response?.data?.message || 'Değerlendirme gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
      <h3 className="font-medium text-gray-900">Değerlendirme Yap</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RATING_CRITERIA.map((c) => (
          <label key={c.field} className="text-sm text-gray-700">
            {c.label}: <span className="font-semibold">{form[c.field]}</span>
            <input
              type="range"
              min="1"
              max="5"
              value={form[c.field]}
              onChange={(e) => updateField(c.field, Number(e.target.value))}
              className="w-full"
            />
          </label>
        ))}
      </div>
      <textarea
        placeholder="Yorumunuz (opsiyonel)"
        value={form.comment}
        onChange={(e) => updateField('comment', e.target.value)}
        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white"
        rows={3}
      />
      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
      >
        {submitting ? 'Gönderiliyor...' : 'Gönder'}
      </button>
    </form>
  );
}
